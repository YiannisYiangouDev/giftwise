"""GiftWise price scraper service."""
import asyncio
import time
import os
import logging
import socket
import ipaddress
import collections
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser
from dotenv import load_dotenv

from scrapers.skroutz import SkroutzScraper
from scrapers.woocommerce import WooCommerceScraper
from scrapers.shopify import ShopifyScraper
from scrapers.firecrawl import FirecrawlScraper
from scrapers.playwright_scraper import PlaywrightScraper
from scrapers.cloudflare import CloudflareScraper
from db import get_tracked_items, update_price

load_dotenv()

# Configure structured logging
log_format = "%(asctime)s [%(levelname)s] %(message)s"
logging.basicConfig(
    level=logging.INFO,
    format=log_format,
    handlers=[
        logging.FileHandler("scraper.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("giftwise-scraper")

USER_AGENT = "GiftWise/1.0 (gift-tracking price monitor; contact@giftwise.app)"
CRAWL_DELAY = 3.0  # seconds between requests to same domain
MAX_RETRIES = 3
MAX_RESPONSE_SIZE = 5 * 1024 * 1024  # 5 MB

# URL-based scraper routing for Cyprus stores
STORE_ROUTING = {
    "skroutz": "cloudflare",          # Cloudflare-protected
    "electroline.com.cy": "woocommerce",
    "cablenet.com.cy": "woocommerce",
    "beautybar.com.cy": "shopify",
    "superhomecenter.com.cy": "cloudflare",
    "public-cyprus.com.cy": "cloudflare",
    "kotsovolos.com.cy": "cloudflare",
    "germanos.com.cy": "cloudflare",
    "leroymerlin.com.cy": "cloudflare",
    "ikea.com.cy": "cloudflare",
    "athienitis.com.cy": "cloudflare",
    "stephanis.com.cy": "cloudflare",
    "bionic.com.cy": "cloudflare",
    "xenion.com.cy": "firecrawl",
    "kyriakides.com.cy": "firecrawl",
}

def detect_scraper(url: str) -> str:
    for domain, scraper in STORE_ROUTING.items():
        if domain in url.lower():
            return scraper
    return "firecrawl"  # default fallback

def is_safe_url(url: str) -> bool:
    """Validate URL to prevent Server-Side Request Forgery (SSRF)."""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = parsed.hostname
        if not hostname:
            return False
        
        # Block common local/internal hostnames
        if hostname.lower() in ("localhost", "127.0.0.1", "::1", "localhost.localdomain"):
            return False
            
        # Resolve hostname to verify IP range
        ip = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(ip)
        
        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
            return False
            
        return True
    except Exception:
        return False

def check_robots(url: str) -> bool:
    """Check robots.txt. Returns True if scraping is allowed."""
    parsed = urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    try:
        rp = RobotFileParser()
        rp.set_url(f"{base}/robots.txt")
        rp.read()
        return rp.can_fetch(USER_AGENT, url)
    except Exception as e:
        logger.debug(f"Could not read robots.txt for {base}: {e}")
        return True

async def scrape_item_with_retry(item: dict) -> bool:
    """Scrape a single item with retries and exponential backoff."""
    url = item["product_url"]
    name = item["product_name"]
    scraper_type = detect_scraper(url)

    if not is_safe_url(url):
        logger.error(f"SSRF Check Failed: Blocked unsafe URL for item '{name}': {url}")
        return False

    if not check_robots(url):
        logger.warning(f"Robots.txt Blocked: Skipped item '{name}': disallowed by robots.txt")
        return False

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(f"Scraping '{name}' (Attempt {attempt}/{MAX_RETRIES}) using {scraper_type}...")
            
            if scraper_type == "skroutz":
                result = await SkroutzScraper().scrape(url)
            elif scraper_type == "woocommerce":
                result = await WooCommerceScraper().scrape(url)
            elif scraper_type == "shopify":
                result = await ShopifyScraper().scrape(url)
            elif scraper_type == "playwright":
                result = await PlaywrightScraper().scrape(url)
            elif scraper_type == "cloudflare":
                result = await CloudflareScraper().scrape(url)
            else:
                result = await FirecrawlScraper().scrape(url)

            if result and result.get("price"):
                await update_price(item["id"], result)
                logger.info(f"✓ Success '{name}': €{result['price']} @ {result.get('store_name', 'unknown')}")
                return True
            else:
                raise ValueError("Price not found in scrape result")

        except Exception as e:
            logger.warning(f"Attempt {attempt} failed for '{name}': {e}")
            if attempt < MAX_RETRIES:
                wait_time = 2 ** attempt  # 2s, 4s
                logger.info(f"Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"✗ Failed all {MAX_RETRIES} attempts for '{name}': {e}")
    
    return False

async def scrape_domain_worker(domain: str, items: list):
    """Processes items for a single domain sequentially to respect rate limits."""
    for i, item in enumerate(items):
        if i > 0:
            logger.info(f"Enforcing crawl delay of {CRAWL_DELAY}s for domain {domain}...")
            await asyncio.sleep(CRAWL_DELAY)
        await scrape_item_with_retry(item)

async def run():
    items = await get_tracked_items()
    logger.info(f"Starting price checker. Found {len(items)} items to check.")

    # Group items by domain
    domain_groups = collections.defaultdict(list)
    for item in items:
        url = item["product_url"]
        domain = urlparse(url).netloc
        domain_groups[domain].append(item)

    # Process domains concurrently (limit 3 domains in parallel)
    sem = asyncio.Semaphore(3)

    async def worker_with_sem(domain, domain_items):
        async with sem:
            logger.info(f"Starting worker for domain: {domain} ({len(domain_items)} items)")
            await scrape_domain_worker(domain, domain_items)
            logger.info(f"Finished worker for domain: {domain}")

    tasks = [worker_with_sem(domain, domain_items) for domain, domain_items in domain_groups.items()]
    await asyncio.gather(*tasks)
    logger.info("Price checker run completed.")

if __name__ == "__main__":
    asyncio.run(run())

"""GiftWise price scraper service."""
import asyncio
import time
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

USER_AGENT = "GiftWise/1.0 (gift-tracking price monitor; contact@giftwise.app)"
CRAWL_DELAY = 3.0  # seconds between requests to same domain
_last_request: dict[str, float] = {}

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

def check_robots(url: str) -> bool:
    """Check robots.txt. Returns True if scraping is allowed."""
    parsed = urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    try:
        rp = RobotFileParser()
        rp.set_url(f"{base}/robots.txt")
        rp.read()
        return rp.can_fetch(USER_AGENT, url)
    except Exception:
        return True

async def rate_limit(url: str):
    """Enforce crawl delay per domain."""
    domain = urlparse(url).netloc
    now = time.time()
    last = _last_request.get(domain, 0)
    wait = CRAWL_DELAY - (now - last)
    if wait > 0:
        await asyncio.sleep(wait)
    _last_request[domain] = time.time()

async def run():
    items = await get_tracked_items()
    print(f"Checking prices for {len(items)} items...")

    for item in items:
        url = item["product_url"]

        if not check_robots(url):
            print(f"  ⚠ Skipped {item['product_name']}: disallowed by robots.txt")
            continue

        scraper_type = detect_scraper(url)
        try:
            await rate_limit(url)
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
                print(f"  ✓ {item['product_name']}: €{result['price']} @ {result.get('store_name', 'unknown')}")
        except Exception as e:
            print(f"  ✗ {item['product_name']}: {e}")

if __name__ == "__main__":
    asyncio.run(run())

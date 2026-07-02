"""GiftWise price scraper service."""
import asyncio
import os
from dotenv import load_dotenv
from scrapers.skroutz import SkroutzScraper
from scrapers.woocommerce import WooCommerceScraper
from scrapers.shopify import ShopifyScraper
from scrapers.firecrawl import FirecrawlScraper
from db import get_tracked_items, update_price

load_dotenv()

async def run():
    items = await get_tracked_items()
    print(f"Checking prices for {len(items)} items...")

    for item in items:
        url = item["product_url"]
        try:
            if "skroutz" in url:
                result = await SkroutzScraper().scrape(url)
            elif "woocommerce" in (item.get("scraper_type") or ""):
                result = await WooCommerceScraper().scrape(url)
            elif "shopify" in (item.get("scraper_type") or ""):
                result = await ShopifyScraper().scrape(url)
            else:
                result = await FirecrawlScraper().scrape(url)

            if result and result.get("price"):
                await update_price(item["id"], result)
                print(f"  ✓ {item['product_name']}: €{result['price']} @ {result.get('store_name', 'unknown')}")
        except Exception as e:
            print(f"  ✗ {item['product_name']}: {e}")

if __name__ == "__main__":
    asyncio.run(run())

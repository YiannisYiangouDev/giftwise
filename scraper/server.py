"""Lightweight FastAPI wrapper around the scraper so Next.js /api/scrape can call it."""
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from scrapers.skroutz import SkroutzScraper
from scrapers.woocommerce import WooCommerceScraper
from scrapers.shopify import ShopifyScraper
from scrapers.firecrawl import FirecrawlScraper

app = FastAPI(title="GiftWise Scraper Service")

STORE_TYPES = {
    'skroutz': SkroutzScraper,
    'woocommerce': WooCommerceScraper,
    'shopify': ShopifyScraper,
    'firecrawl': FirecrawlScraper,
}

class ScrapeRequest(BaseModel):
    url: str
    type: str = 'firecrawl'

@app.post('/scrape')
async def scrape(req: ScrapeRequest):
    ScraperClass = STORE_TYPES.get(req.type, FirecrawlScraper)
    result = await ScraperClass().scrape(req.url)
    if not result:
        raise HTTPException(status_code=422, detail='Could not extract product data')
    return result

@app.get('/health')
def health():
    return {'status': 'ok'}

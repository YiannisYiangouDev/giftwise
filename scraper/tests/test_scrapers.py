"""Basic smoke tests for scrapers."""
import pytest
from scrapers.shopify import ShopifyScraper
from scrapers.woocommerce import WooCommerceScraper

def test_shopify_scraper_instantiates():
    s = ShopifyScraper()
    assert s is not None

def test_woocommerce_scraper_instantiates():
    s = WooCommerceScraper()
    assert s is not None

"""Shopify store scraper via /products.json endpoint."""
import httpx
from urllib.parse import urlparse

USER_AGENT = "GiftWise/1.0 (gift-tracking price monitor; contact@giftwise.app)"

class ShopifyScraper:
    async def scrape(self, url: str) -> dict | None:
        parsed = urlparse(url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        handle = parsed.path.strip('/').split('/')[-1]

        async with httpx.AsyncClient(timeout=30, headers={"User-Agent": USER_AGENT}) as client:
            res = await client.get(f"{base}/products/{handle}.json")
            if res.status_code == 200:
                data = res.json()
                product = data.get("product", {})
                variants = product.get("variants", [])
                if variants:
                    price = float(variants[0].get("price", 0))
                    in_stock = variants[0].get("inventory_quantity", 1) > 0
                    return {
                        "price": price,
                        "store_name": parsed.netloc.replace('www.', ''),
                        "store_url": url,
                        "in_stock": in_stock
                    }
        return None

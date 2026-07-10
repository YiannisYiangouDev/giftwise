"""Firecrawl.dev extract scraper — used for JS-heavy sites (MediaMarkt, Public, Plaisio etc)."""
import os
import httpx

EXTRACT_SCHEMA = {
    "type": "object",
    "properties": {
        "product_name": {"type": "string"},
        "price": {"type": "number"},
        "image_url": {"type": "string"},
        "in_stock": {"type": "boolean"},
    },
    "required": ["product_name", "price"],
}

class FirecrawlScraper:
    API_BASE = "https://api.firecrawl.dev/v1"

    async def scrape(self, url: str) -> dict | None:
        api_key = os.environ.get("FIRECRAWL_API_KEY")
        if not api_key:
            raise EnvironmentError("FIRECRAWL_API_KEY is not set")

        from urllib.parse import urlparse
        store_name = urlparse(url).netloc.replace('www.', '')

        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(
                f"{self.API_BASE}/extract",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "urls": [url],
                    "prompt": "Extract the product name, current price in EUR (as a number), main product image URL, and whether it is in stock.",
                    "schema": EXTRACT_SCHEMA,
                },
            )
            if res.status_code != 200:
                return None

            data = res.json().get('data', [{}])[0]
            return {
                'product_name': data.get('product_name'),
                'image_url': data.get('image_url'),
                'price': data.get('price'),
                'store_name': store_name,
                'store_url': url,
                'in_stock': data.get('in_stock', True),
            }

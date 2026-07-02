"""WooCommerce store scraper via public wp-json REST API."""
import httpx
from urllib.parse import urlparse

class WooCommerceScraper:
    async def scrape(self, url: str) -> dict | None:
        parsed = urlparse(url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        slug = parsed.path.strip('/').split('/')[-1]

        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.get(
                f"{base}/wp-json/wc/v3/products",
                params={"slug": slug, "per_page": 1}
            )
            if res.status_code == 200:
                products = res.json()
                if products:
                    p = products[0]
                    return {
                        "price": float(p.get("price", 0)),
                        "store_name": parsed.netloc.replace('www.', ''),
                        "store_url": url,
                        "in_stock": p.get("stock_status") == "instock"
                    }
        return None

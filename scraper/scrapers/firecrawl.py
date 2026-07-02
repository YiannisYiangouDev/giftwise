"""Universal scraper using Firecrawl for JS-rendered pages."""
import os
import httpx

class FirecrawlScraper:
    API_URL = "https://api.firecrawl.dev/v1/scrape"

    async def scrape(self, url: str) -> dict | None:
        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(
                self.API_URL,
                headers={
                    "Authorization": f"Bearer {os.environ['FIRECRAWL_API_KEY']}",
                    "Content-Type": "application/json"
                },
                json={
                    "url": url,
                    "formats": ["extract"],
                    "extract": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "price": {"type": "number", "description": "Current product price in EUR"},
                                "store_name": {"type": "string", "description": "Store name"},
                                "in_stock": {"type": "boolean", "description": "Is product in stock?"}
                            }
                        }
                    }
                }
            )
            if res.status_code == 200:
                data = res.json()
                extracted = data.get("data", {}).get("extract", {})
                if extracted.get("price"):
                    return {
                        "price": extracted["price"],
                        "store_name": extracted.get("store_name", "Unknown"),
                        "store_url": url,
                        "in_stock": extracted.get("in_stock", True)
                    }
        return None

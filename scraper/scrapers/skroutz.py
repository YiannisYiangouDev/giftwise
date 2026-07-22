"""Skroutz.cy / Skroutz.gr scraper via Apify."""
import os
import httpx

USER_AGENT = "GiftWise/1.0 (gift-tracking price monitor; contact@giftwise.app)"

class SkroutzScraper:
    ACTOR_ID = "studio-amba~skroutz-scraper"
    API_BASE = "https://api.apify.com/v2"

    async def scrape(self, url: str) -> dict | None:
        token = os.environ["APIFY_API_TOKEN"]
        async with httpx.AsyncClient(timeout=60, headers={"User-Agent": USER_AGENT}) as client:
            # Start actor run
            run_res = await client.post(
                f"{self.API_BASE}/acts/{self.ACTOR_ID}/runs",
                params={"token": token},
                json={"startUrls": [{"url": url}]}
            )
            run = run_res.json()
            run_id = run["data"]["id"]

            # Wait for completion
            import asyncio
            for _ in range(30):
                await asyncio.sleep(3)
                status_res = await client.get(
                    f"{self.API_BASE}/actor-runs/{run_id}",
                    params={"token": token}
                )
                status = status_res.json()["data"]["status"]
                if status == "SUCCEEDED":
                    break

            # Fetch results
            results_res = await client.get(
                f"{self.API_BASE}/actor-runs/{run_id}/dataset/items",
                params={"token": token}
            )
            items = results_res.json()
            if items:
                item = items[0]
                return {
                    "price": item.get("price") or item.get("minPrice"),
                    "store_name": item.get("shopName", "Skroutz"),
                    "store_url": url,
                    "in_stock": item.get("available", True)
                }
        return None

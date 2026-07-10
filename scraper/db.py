"""Supabase DB helpers for the scraper service."""
import os
import httpx
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

async def get_tracked_items() -> list[dict]:
    """Return all wishlist_items that have a product_url and target_price set."""
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/wishlist_items",
            headers=HEADERS,
            params={
                "select": "id,product_name,product_url,current_best_price,target_price,scraper_type",
                "product_url": "not.is.null",
                "target_price": "not.is.null",
            },
        )
        return res.json()

async def update_price(item_id: str, result: dict) -> None:
    """Update current_best_price on the item, insert price_history row, fire alert if target hit."""
    now = datetime.now(timezone.utc).isoformat()
    new_price = float(result["price"])

    async with httpx.AsyncClient() as client:
        # 1. Get old price
        old_res = await client.get(
            f"{SUPABASE_URL}/rest/v1/wishlist_items",
            headers=HEADERS,
            params={"id": f"eq.{item_id}", "select": "current_best_price,target_price"},
        )
        old_data = old_res.json()
        old_price = float(old_data[0]["current_best_price"]) if old_data and old_data[0].get("current_best_price") else None
        target_price = float(old_data[0]["target_price"]) if old_data and old_data[0].get("target_price") else None

        # 2. Update wishlist_items
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/wishlist_items",
            headers=HEADERS,
            params={"id": f"eq.{item_id}"},
            json={"current_best_price": new_price, "updated_at": now},
        )

        # 3. Insert price_history
        await client.post(
            f"{SUPABASE_URL}/rest/v1/price_history",
            headers=HEADERS,
            json={
                "item_id": item_id,
                "price": new_price,
                "store_name": result.get("store_name"),
                "store_url": result.get("store_url"),
                "in_stock": result.get("in_stock", True),
                "scraped_at": now,
            },
        )

        # 4. Fire price_alert if new price <= target and price has dropped
        if target_price and new_price <= target_price and (old_price is None or new_price < old_price):
            await client.post(
                f"{SUPABASE_URL}/rest/v1/price_alerts",
                headers=HEADERS,
                json={
                    "item_id": item_id,
                    "old_price": old_price,
                    "new_price": new_price,
                    "triggered_at": now,
                },
            )

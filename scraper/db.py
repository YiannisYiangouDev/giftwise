"""Supabase DB helpers for the scraper."""
import os
from supabase import create_client, Client

def get_client() -> Client:
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    )

async def get_tracked_items():
    client = get_client()
    res = client.table("wishlist_items") \
        .select("id, product_url, product_name, target_price, current_best_price") \
        .not_("status", "in", '("purchased","received")') \
        .execute()
    return res.data or []

async def update_price(item_id: str, result: dict):
    client = get_client()
    client.table("price_history").insert({
        "item_id": item_id,
        "store_name": result.get("store_name", "Unknown"),
        "store_url": result.get("store_url", ""),
        "price": result["price"],
        "in_stock": result.get("in_stock", True)
    }).execute()

    # Update current best price
    client.table("wishlist_items") \
        .update({"current_best_price": result["price"]}) \
        .eq("id", item_id) \
        .execute()

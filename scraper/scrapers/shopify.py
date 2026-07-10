"""Shopify scraper using the /products.json public endpoint."""
import httpx
import re

class ShopifyScraper:
    async def scrape(self, url: str) -> dict | None:
        try:
            # Shopify handle from URL
            handle_match = re.search(r'/products/([^/?#]+)', url)
            if not handle_match:
                return None
            handle = handle_match.group(1)

            from urllib.parse import urlparse
            base = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
            store_name = urlparse(url).netloc.replace('www.', '')

            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.get(
                    f"{base}/products/{handle}.json",
                    headers={"User-Agent": "GiftWise/1.0"}
                )
                if res.status_code != 200:
                    return None

                product = res.json().get('product', {})
                variants = product.get('variants', [])
                price = float(variants[0]['price']) if variants else None
                image = product.get('images', [{}])[0].get('src') if product.get('images') else None

                return {
                    'product_name': product.get('title'),
                    'image_url': image,
                    'price': price,
                    'store_name': store_name,
                    'store_url': url,
                    'in_stock': variants[0].get('available', True) if variants else True,
                }
        except Exception:
            return None

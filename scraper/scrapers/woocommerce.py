"""WooCommerce Store API scraper (no auth required for public product data)."""
import httpx
import re

class WooCommerceScraper:
    async def scrape(self, url: str) -> dict | None:
        try:
            # Extract product slug from URL
            slug_match = re.search(r'/product/([^/?#]+)', url)
            if not slug_match:
                return await self._firecrawl_fallback(url)
            slug = slug_match.group(1)

            from urllib.parse import urlparse
            base = f"{urlparse(url).scheme}://{urlparse(url).netloc}"

            async with httpx.AsyncClient(timeout=20) as client:
                # WooCommerce Store API v1 (no auth needed for public data)
                res = await client.get(
                    f"{base}/wp-json/wc/store/v1/products",
                    params={"slug": slug},
                    headers={"User-Agent": "GiftWise/1.0"}
                )
                if res.status_code != 200:
                    return await self._firecrawl_fallback(url)

                data = res.json()
                if not data:
                    return await self._firecrawl_fallback(url)

                product = data[0]
                price_raw = product.get('prices', {}).get('price', '')
                price = float(price_raw) / 100 if price_raw else None

                from urllib.parse import urlparse as _up
                store_name = _up(url).netloc.replace('www.', '')

                return {
                    'product_name': product.get('name'),
                    'image_url': product.get('images', [{}])[0].get('src'),
                    'price': price,
                    'store_name': store_name,
                    'store_url': url,
                    'in_stock': product.get('is_in_stock', True),
                }
        except Exception:
            return await self._firecrawl_fallback(url)

    async def _firecrawl_fallback(self, url: str) -> dict | None:
        from scrapers.firecrawl import FirecrawlScraper
        return await FirecrawlScraper().scrape(url)

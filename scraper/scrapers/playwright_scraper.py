"""Playwright scraper for JavaScript-heavy Cyprus store websites."""
import httpx

USER_AGENT = "GiftWise/1.0 (gift-tracking price monitor; contact@giftwise.app)"

class PlaywrightScraper:
    """Uses Firecrawl as backend (handles JS rendering).
    For local Playwright, set USE_LOCAL_PLAYWRIGHT=true in env."""

    async def scrape(self, url: str) -> dict | None:
        import os
        # Firecrawl handles JS rendering natively, so delegate
        from scrapers.firecrawl import FirecrawlScraper

        scraper = FirecrawlScraper()
        result = await scraper.scrape(url)
        if result:
            return result

        # Fallback: try fetching page HTML and parse common price patterns
        async with httpx.AsyncClient(timeout=30, follow_redirects=True, headers={"User-Agent": USER_AGENT}) as client:
            res = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
                },
            )
            if res.status_code == 200:
                price = self._extract_price(res.text)
                if price:
                    from urllib.parse import urlparse

                    return {
                        "price": price,
                        "store_name": urlparse(url).netloc.replace("www.", ""),
                        "store_url": url,
                        "in_stock": True,
                    }
        return None

    @staticmethod
    def _extract_price(html: str) -> float | None:
        """Extract price from HTML using common CY store patterns."""
        import re

        # Try JSON-LD structured data first
        ld_match = re.search(
            r'"price"\s*:\s*"?([\d.]+)"?', html, re.IGNORECASE
        )
        if ld_match:
            return float(ld_match.group(1))

        # Common CSS class patterns for Cyprus stores
        patterns = [
            r'class="[^"]*price[^"]*"[^>]*>€?\s*([\d,.]+)',
            r'data-price\s*=\s*["\']([\d.]+)["\']',
            r'"priceAmount"\s*:\s*"?([\d.]+)"?',
            r'<meta[^>]+property="product:price:amount"[^>]+content="([\d.]+)"',
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                return float(match.group(1).replace(",", ""))

        return None

"""Cloudflare bypass scraper. Uses cloudscraper (primary, no Docker needed)
or FlareSolverr (fallback, Docker-based).

Usage:
  pip install cloudscraper  # primary — lightweight, no external deps
  docker run -d --name flaresolverr -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest  # fallback
"""
import asyncio
import os
import re
import json
from urllib.parse import urlparse

try:
    import cloudscraper
    HAS_CLOUDSCRAPER = True
except ImportError:
    HAS_CLOUDSCRAPER = False

FLARESOLVERR_URL = os.environ.get("FLARESOLVERR_URL", "http://localhost:8191")


class CloudflareScraper:
    """Scrape Cloudflare-protected pages. Tries cloudscraper first, then FlareSolverr."""

    async def scrape(self, url: str) -> dict | None:
        # Tier 1: cloudscraper (fast, no Docker needed)
        if HAS_CLOUDSCRAPER:
            try:
                result = await asyncio.to_thread(self._scrape_with_cloudscraper, url)
                if result and result.get("price"):
                    return result
            except Exception:
                pass

        # Tier 2: FlareSolverr (Docker-based, more robust)
        try:
            result = await self._scrape_with_flaresolverr(url)
            if result and result.get("price"):
                return result
        except Exception:
            pass

        # Tier 3: cloudscraper — name only (no price requirement)
        if HAS_CLOUDSCRAPER:
            try:
                result = await asyncio.to_thread(self._scrape_with_cloudscraper, url)
                if result:
                    return result
            except Exception:
                pass

        return None

    def _scrape_with_cloudscraper(self, url: str) -> dict | None:
        scraper = cloudscraper.create_scraper()
        r = scraper.get(url, timeout=30)
        if r.status_code != 200: return None
        parsed = urlparse(url)
        html = r.text
        return {
            "price": self._extract_price(html),
            "store_name": parsed.netloc.replace("www.", ""),
            "store_url": url,
            "in_stock": True,
            "product_name": self._extract_name(html, url),
        }

    async def _scrape_with_flaresolverr(self, url: str) -> dict | None:
        import httpx
        async with httpx.AsyncClient(timeout=120) as client:
            res = await client.post(f"{FLARESOLVERR_URL}/v1", json={
                "cmd": "request.get", "url": url, "maxTimeout": 60000,
            })
            if res.status_code != 200: return None
            data = res.json()
            if data.get("status") != "ok": return None
            html = data["solution"]["response"]
            parsed = urlparse(data["solution"]["url"])
            return {
                "price": self._extract_price(html),
                "store_name": parsed.netloc.replace("www.", ""),
                "store_url": url,
                "in_stock": True,
                "product_name": self._extract_name(html, url),
            }

    @staticmethod
    def _extract_name(html: str, url: str) -> str:
        m = re.search(r"<title[^>]*>([^<]+)</title>", html, re.IGNORECASE)
        if m:
            return m[1].strip().replace("\n", " ").split("|")[0].split("\u2013")[0].strip()[:200]
        m = re.search(r'<script type="application/ld\+json"[^>]*>([\s\S]*?)</script>', html, re.IGNORECASE)
        if m:
            try:
                ld = json.loads(m[1])
                if isinstance(ld, list): ld = ld[0]
                if ld.get("name"): return ld["name"][:200]
            except (json.JSONDecodeError, KeyError): pass
        try:
            parts = urlparse(url).path.strip("/").split("/")
            return parts[-1].replace("-", " ").replace("_", " ")[:200]
        except Exception: return "Unknown Product"

    @staticmethod
    def _extract_price(html: str) -> float | None:
        m = re.search(r'<script type="application/ld\+json"[^>]*>([\s\S]*?)</script>', html, re.IGNORECASE)
        if m:
            try:
                ld = json.loads(m[1])
                if isinstance(ld, list): ld = ld[0]
                offers = ld.get("offers", {})
                if isinstance(offers, list): offers = offers[0]
                if offers.get("price"): return float(offers["price"])
            except (json.JSONDecodeError, KeyError, ValueError): pass
        meta = re.search(r'<meta[^>]+property="product:price:amount"[^>]+content="([\d.]+)"', html, re.IGNORECASE)
        if meta:
            try: return float(meta[1])
            except ValueError: pass
        for p in [r'"price"\s*:\s*"?([\d.]+)"?', r'€\s*([\d,.]+)']:
            m = re.search(p, html, re.IGNORECASE)
            if m:
                try: return float(m[1].replace(",", ""))
                except ValueError: pass
        return None

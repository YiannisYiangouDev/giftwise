"""CLI helper for Cloudflare bypass — called by Next.js API route."""
import sys, json, re, cloudscraper

url = sys.argv[1]
s = cloudscraper.create_scraper()
r = s.get(url, timeout=15)

if r.status_code != 200:
    print(json.dumps({"name": None, "price": None}))
    sys.exit(0)

name = None
price = None

m = re.search(r"<title[^>]*>([^<]+)</title>", r.text)
if m:
    name = m[1].strip().replace("\n", " ").split("|")[0].split("\u2013")[0].strip()[:200]

m = re.search(r'<meta[^>]+property="product:price:amount"[^>]+content="([\d.]+)"', r.text)
if m:
    price = float(m[1])

if not price:
    m = re.search(r'"price"\s*:\s*"?([\d.]+)"?', r.text)
    if m:
        price = float(m[1])

print(json.dumps({"name": name, "price": price}))

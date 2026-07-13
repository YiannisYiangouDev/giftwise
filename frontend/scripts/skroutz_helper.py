"""Unified Skroutz helper for GiftWise — called by Next.js API routes."""
import sys, json, re, cloudscraper

action = sys.argv[1]  # "search" or "fetch"
query_or_url = sys.argv[2]

s = cloudscraper.create_scraper()

if action == "search":
    r = s.get(f"https://www.skroutz.cy/search?keyphrase={query_or_url}", timeout=15)
    if r.status_code == 200:
        html = r.text
        results = []
        seen = set()
        for m in re.finditer(r'<a[^>]*title="([^"]+)"[^>]*href="(/s/(\d+)/([^"?]+)\.html)', html):
            title, url_path, pid, slug = m[1], m[2], m[3], m[4]
            base = url_path.split("?")[0]
            if base in seen: continue
            seen.add(base)
            name = title.strip()[:200]
            full_url = f"https://www.skroutz.cy{base}"
            # Extract product image from nearby <img> tag
            chunk = html[max(0, m.start()-1500):m.end()+3000]
            img_m = re.search(r'<img[^>]+src="(https?://[^"]+)"[^>]*>', chunk)
            image_url = img_m[1] if img_m else None
            # No price from search results — unreliable (picks up nearby accessories).
            # User clicks → Fetch button gets exact price from product page.
            results.append({
                "name": name,
                "url": full_url,
                "price": None,
                "image_url": image_url,
                "store": "Skroutz.cy",
            })
            if len(results) >= 10:
                break
        if results:
            print(json.dumps(results))
            sys.exit(0)
    # Fallback
    print(json.dumps([{"name": query_or_url, "url": "", "price": None, "image_url": None, "store": "Manual"}]))
    sys.exit(0)

elif action == "fetch":
    # Product page scrape
    r = s.get(query_or_url, timeout=15)
    if r.status_code != 200:
        print(json.dumps({"name": None, "price": None, "image_url": None}))
        sys.exit(0)
    name = None
    price = None
    image_url = None
    m = re.search(r"<title[^>]*>([^<]+)</title>", r.text)
    if m:
        name = m[1].strip().replace("\n", " ").split("|")[0].split("\u2013")[0].strip()[:200]
    m = re.search(r'<meta[^>]+property="product:price:amount"[^>]+content="([\d.]+)"', r.text)
    if m: price = float(m[1])
    if not price:
        m = re.search(r'"price"\s*:\s*"?([\d.]+)"?', r.text)
        if m: price = float(m[1])
    # Extract product image
    img_m = re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', r.text)
    if not img_m:
        img_m = re.search(r'<img[^>]+(?:id|class|data-testid)="[^"]*(?:main|product|primary)[^"]*"[^>]+src="([^"]+)"', r.text)
    if img_m:
        image_url = img_m[1]
    print(json.dumps({"name": name, "price": price, "image_url": image_url}))
    sys.exit(0)

else:
    print(json.dumps({"error": f"unknown action: {action}"}))
    sys.exit(1)

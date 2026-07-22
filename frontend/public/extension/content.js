// GiftWise Quick Clip Content Script
(function () {
  // 1. Scrape title
  const getTitle = () => {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.content) return ogTitle.content.trim();
    
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle && twitterTitle.content) return twitterTitle.content.trim();
    
    const h1 = document.querySelector('h1');
    if (h1 && h1.innerText && h1.innerText.trim().length > 3) return h1.innerText.trim();

    return document.title ? document.title.trim() : '';
  };

  // 2. Scrape price
  const getPrice = () => {
    // Try JSON-LD structured data first (very standard on modern e-commerce sites)
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        const json = JSON.parse(script.innerText);
        const searchLD = (obj) => {
          if (!obj) return null;
          if (obj.price !== undefined) return obj.price;
          if (obj.offers) {
            if (Array.isArray(obj.offers)) {
              for (const offer of obj.offers) {
                if (offer.price !== undefined) return offer.price;
              }
            } else if (obj.offers.price !== undefined) {
              return obj.offers.price;
            }
          }
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const res = searchLD(item);
              if (res) return res;
            }
          }
          if (typeof obj === 'object') {
            for (const key in obj) {
              const res = searchLD(obj[key]);
              if (res) return res;
            }
          }
          return null;
        };
        const price = searchLD(json);
        if (price) {
          const parsed = parseFloat(String(price).replace(/[^0-9.]/g, ''));
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
      }
    } catch (e) {}

    // Try meta tags
    const priceMetaSelectors = [
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
      'meta[name="price"]',
      'meta[itemprop="price"]',
      'meta[property="product:sale_price:amount"]'
    ];
    for (const selector of priceMetaSelectors) {
      const el = document.querySelector(selector);
      if (el && el.content) {
        const val = parseFloat(el.content.replace(/[^0-9.]/g, ''));
        if (!isNaN(val) && val > 0) return val;
      }
    }

    // Try common element selectors for pricing (Skroutz, Amazon)
    const priceClasses = [
      '.price', '.current-price', '#priceblock_ourprice', '#priceblock_saleprice',
      '.a-price-whole', '[itemprop="price"]', '.product-price', '.price-amount'
    ];
    for (const cls of priceClasses) {
      const el = document.querySelector(cls);
      if (el) {
        let text = el.innerText || el.textContent || '';
        // Remove currency symbols, common text, commas
        text = text.replace(/,/g, '.').replace(/[^0-9.]/g, '');
        const val = parseFloat(text);
        if (!isNaN(val) && val > 0) return val;
      }
    }

    return null;
  };

  // 3. Scrape image
  const getImage = () => {
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.content) return ogImage.content;

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage && twitterImage.content) return twitterImage.content;

    const relImage = document.querySelector('link[rel="image_src"]');
    if (relImage && relImage.href) return relImage.href;

    const firstProductImg = document.querySelector('img[class*="product"], img[id*="product"], img[src*="product"]');
    if (firstProductImg && firstProductImg.src) return firstProductImg.src;

    return null;
  };

  // Return parsed object
  return {
    title: getTitle(),
    price: getPrice(),
    image: getImage(),
    url: window.location.href
  };
})();

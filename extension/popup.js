// GiftWise Quick Clip Popup JS
document.addEventListener('DOMContentLoaded', async () => {
  const setupView = document.getElementById('setup-view');
  const clipView = document.getElementById('clip-view');
  const successView = document.getElementById('success-view');

  const setupForm = document.getElementById('setup-form');
  const hostUrlInput = document.getElementById('host-url');
  const accessTokenInput = document.getElementById('access-token');
  const setupError = document.getElementById('setup-error');

  const clipForm = document.getElementById('clip-form');
  const recipientSelect = document.getElementById('recipient-select');
  const wishlistSelect = document.getElementById('wishlist-select');
  const productNameInput = document.getElementById('product-name');
  const productPriceInput = document.getElementById('product-price');
  const productNotesInput = document.getElementById('product-notes');
  const productImg = document.getElementById('product-img');
  const productImgPlaceholder = document.getElementById('product-img-placeholder');
  const clipError = document.getElementById('clip-error');
  const clipBtn = document.getElementById('clip-btn');

  const successWishlistName = document.getElementById('success-wishlist-name');
  const viewItemLink = document.getElementById('view-item-link');
  const clipAnotherBtn = document.getElementById('clip-another-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');

  let activeUrl = '';
  let activeImageUrl = '';
  let recipients = [];
  let wishlists = [];

  // 1. Initial State Check
  const config = await getStorage(['hostUrl', 'accessToken']);
  if (config.hostUrl && config.accessToken) {
    showClipView(config.hostUrl, config.accessToken);
  } else {
    showSetupView();
  }

  // 2. Setup Form Submit
  setupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setupError.hidden = true;
    const saveBtn = document.getElementById('save-setup-btn');
    saveBtn.disabled = true;
    saveBtn.innerText = 'Connecting...';

    let host = hostUrlInput.value.trim().replace(/\/$/, '');
    const token = accessTokenInput.value.trim();

    try {
      // Test connection
      const res = await fetch(`${host}/api/extension/wishlists`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(res.status === 401 ? 'Invalid access token' : 'Failed to connect to host');
      }

      await setStorage({ hostUrl: host, accessToken: token });
      showClipView(host, token);
    } catch (err) {
      setupError.textContent = err.message;
      setupError.hidden = false;
      saveBtn.disabled = false;
      saveBtn.innerText = 'Connect Account';
    }
  });

  // 3. Disconnect Button
  disconnectBtn.addEventListener('click', async () => {
    if (confirm('Disconnect from GiftWise?')) {
      await removeStorage(['hostUrl', 'accessToken']);
      showSetupView();
    }
  });

  // 4. Clip Form Submit
  clipForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clipError.hidden = true;
    clipBtn.disabled = true;
    clipBtn.innerText = 'Clipping Item...';

    const config = await getStorage(['hostUrl', 'accessToken']);
    const wishlistId = wishlistSelect.value;
    const name = productNameInput.value.trim();
    const price = productPriceInput.value.trim();
    const notes = productNotesInput.value.trim();

    try {
      const res = await fetch(`${config.hostUrl}/api/extension/clip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.accessToken}`
        },
        body: JSON.stringify({
          wishlist_id: wishlistId,
          product_name: name,
          product_url: activeUrl,
          image_url: activeImageUrl || null,
          target_price: price ? parseFloat(price) : null,
          notes: notes || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to clip item');
      }

      // Success
      const selectedWishlist = wishlists.find(w => w.id === wishlistId);
      successWishlistName.textContent = selectedWishlist ? selectedWishlist.title : 'Wishlist';
      viewItemLink.href = `${config.hostUrl}/wishlists/${wishlistId}`;
      
      clipView.hidden = true;
      successView.hidden = false;
    } catch (err) {
      clipError.textContent = err.message;
      clipError.hidden = false;
      clipBtn.disabled = false;
      clipBtn.innerText = '⚡ Clip to Wishlist';
    }
  });

  // 5. Clip Another Button
  clipAnotherBtn.addEventListener('click', () => {
    successView.hidden = true;
    clipView.hidden = false;
    clipBtn.disabled = false;
    clipBtn.innerText = '⚡ Clip to Wishlist';
    // Clear product fields but keep selected wishlist/recipient
    productNameInput.value = '';
    productPriceInput.value = '';
    productNotesInput.value = '';
    productImg.src = '';
    productImg.hidden = true;
    productImgPlaceholder.hidden = false;
    // Rescrape
    scrapeActiveTab();
  });

  // Views Toggles
  function showSetupView() {
    setupView.hidden = false;
    clipView.hidden = true;
    successView.hidden = true;
    disconnectBtn.hidden = true;
  }

  async function showClipView(host, token) {
    setupView.hidden = true;
    clipView.hidden = false;
    successView.hidden = true;
    disconnectBtn.hidden = false;

    // Load wishlists/recipients
    try {
      const res = await fetch(`${host}/api/extension/wishlists`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      recipients = data.recipients || [];
      wishlists = data.wishlists || [];

      populateRecipients();
      scrapeActiveTab();
    } catch {
      // Token probably revoked
      await removeStorage(['hostUrl', 'accessToken']);
      showSetupView();
    }
  }

  function populateRecipients() {
    recipientSelect.innerHTML = '<option value="" disabled selected>Select Recipient</option>';
    recipients.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name;
      recipientSelect.appendChild(opt);
    });

    recipientSelect.addEventListener('change', () => {
      const recipientId = recipientSelect.value;
      populateWishlists(recipientId);
    });
  }

  function populateWishlists(recipientId) {
    wishlistSelect.innerHTML = '<option value="" disabled selected>Select Wishlist</option>';
    const filtered = wishlists.filter(w => w.recipient_id === recipientId);
    
    if (filtered.length > 0) {
      wishlistSelect.disabled = false;
      filtered.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.textContent = w.title;
        wishlistSelect.appendChild(opt);
      });
      // Pre-select first wishlist
      wishlistSelect.selectedIndex = 1;
    } else {
      wishlistSelect.disabled = true;
    }
  }

  // Scrape Active Tab
  async function scrapeActiveTab() {
    const tabs = await queryTabs({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) return;
    const tab = tabs[0];
    activeUrl = tab.url;

    // Don't scrape chrome:// or extension pages
    if (activeUrl.startsWith('chrome://') || activeUrl.startsWith('edge://')) {
      productNameInput.value = tab.title;
      return;
    }

    try {
      const results = await executeScript(tab.id, 'content.js');
      if (results && results[0] && results[0].result) {
        const metadata = results[0].result;
        productNameInput.value = metadata.title || tab.title;
        if (metadata.price) {
          productPriceInput.value = parseFloat(metadata.price).toFixed(2);
        }
        if (metadata.image) {
          activeImageUrl = metadata.image;
          productImg.src = metadata.image;
          productImg.hidden = false;
          productImgPlaceholder.hidden = true;
        }
      } else {
        productNameInput.value = tab.title;
      }
    } catch {
      productNameInput.value = tab.title;
    }
  }

  // Helper APIs for Chrome/Edge extensions compatibility
  function getStorage(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  function setStorage(items) {
    return new Promise((resolve) => {
      chrome.storage.local.set(items, resolve);
    });
  }

  function removeStorage(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, resolve);
    });
  }

  function queryTabs(queryInfo) {
    return new Promise((resolve) => {
      chrome.tabs.query(queryInfo, resolve);
    });
  }

  function executeScript(tabId, file) {
    return new Promise((resolve, reject) => {
      chrome.scripting.executeScript({
        target: { tabId },
        files: [file]
      }, (res) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(res);
      });
    });
  }
});

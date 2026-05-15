import { api, navigate, addToCart } from '../main.js';

export async function renderDetail(container, params) {
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const item = await api(`/media/${params.id}`);
    let qty = 1;

    container.innerHTML = `
      <div class="detail-page fade-in">
        <button class="btn btn-secondary" id="back-btn" style="margin-bottom:40px;border:none;padding:0;text-transform:uppercase;font-family:var(--font-display);font-weight:700">← Back</button>
        <div class="detail-grid">
          <div class="detail-img-container">
            <img class="detail-img" src="${item.ThumbnailURL}" alt="${item.Title}" onerror="this.style.background='#dcd8ce';" />
          </div>
          <div class="detail-info">
            <div style="margin-bottom:16px"><span class="media-badge ${item.MediaType}" style="font-size:0.85rem">${item.MediaType}</span></div>
            <h1>${item.Title}</h1>
            <p class="detail-desc">${item.Description || 'No description available for this work.'}</p>
            
            <div class="detail-meta-list">
              <div class="detail-meta-item"><span class="label">Region</span><span>${item.Country}</span></div>
              <div class="detail-meta-item"><span class="label">Timeline</span><span>${item.Year}</span></div>
              <div class="detail-meta-item"><span class="label">Added</span><span>${new Date(item.DateAdded).toLocaleDateString()}</span></div>
              <div class="detail-meta-item"><span class="label">Archive ID</span><span>#${item.PhotoID}</span></div>
            </div>

            ${item.people && item.people.length > 0 ? `
              <div style="margin-bottom:40px">
                <h3 style="font-size:1.1rem;margin-bottom:16px;text-transform:uppercase">Subjects</h3>
                <div style="display:flex;flex-wrap:wrap;gap:12px">
                  ${item.people.map(p => `
                    <div style="border:1px solid var(--border);padding:8px 16px;font-size:0.9rem">
                      <span style="font-weight:600">${p.FirstName} ${p.LastName}</span>
                      <span style="color:var(--text-muted);margin-left:4px">(${p.Country})</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div class="detail-actions">
              <div style="font-family:var(--font-display);font-weight:700;font-size:1.25rem;margin-bottom:8px">Order Prints</div>
              <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
                <div class="qty-control">
                  <button class="qty-btn" id="qty-minus">−</button>
                  <input class="qty-value" type="number" id="qty-input" value="1" min="1" max="99" />
                  <button class="qty-btn" id="qty-plus">+</button>
                </div>
                <button class="btn btn-primary" id="add-cart-btn">Add to Cart</button>
                <button class="btn btn-secondary" id="share-btn">Share Link</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#back-btn').onclick = () => navigate('browse');
    const qtyInput = container.querySelector('#qty-input');
    container.querySelector('#qty-minus').onclick = () => { qty = Math.max(1, qty - 1); qtyInput.value = qty; };
    container.querySelector('#qty-plus').onclick = () => { qty = Math.min(99, qty + 1); qtyInput.value = qty; };
    qtyInput.onchange = () => { qty = Math.max(1, Math.min(99, parseInt(qtyInput.value) || 1)); qtyInput.value = qty; };
    
    container.querySelector('#add-cart-btn').onclick = () => {
      addToCart({
        photoId: item.PhotoID,
        title: item.Title,
        thumbnail: item.ThumbnailURL,
        mediaType: item.MediaType,
        copies: qty,
      });
    };

    container.querySelector('#share-btn').onclick = () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        // Since we don't have showToast imported here, we'll just alert
        alert('Link copied to clipboard!');
      });
    };
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Error loading media</h3><p>${e.message}</p><button class="btn btn-secondary" id="back-btn2">← Back</button></div>`;
    container.querySelector('#back-btn2').onclick = () => navigate('browse');
  }
}

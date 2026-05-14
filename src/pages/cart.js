import { state, navigate, removeFromCart, updateCartQty, showToast, api, clearCart } from '../main.js';

export function renderCart(container) {
  function render() {
    const cart = state.cart;
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="page-header"><h1>🛒 Print Cart</h1></div>
        <div class="empty-state">
          <div class="icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Browse the album and add items to your cart</p>
          <button class="btn btn-primary" id="browse-btn" style="margin-top:16px">Browse Album</button>
        </div>
      `;
      container.querySelector('#browse-btn').onclick = () => navigate('browse');
      return;
    }

    let selectedService = '3day';
    const costs = { '1day': 0.30, '3day': 0.20, '1week': 0.10 };
    const totalCopies = cart.reduce((s, i) => s + i.copies, 0);

    container.innerHTML = `
      <div class="cart-page fade-in">
        <div class="page-header">
          <h1>Selected Prints</h1>
          <p>${cart.length} work(s), ${totalCopies} total copies.</p>
        </div>
        <div class="cart-layout">
          <div>
            <div class="cart-list" id="cart-list">
              ${cart.map(item => `
                <div class="cart-item" data-id="${item.photoId}">
                  <img class="cart-item-img" src="http://localhost:3001${item.thumbnail}" alt="${item.title}" onerror="this.style.background='#dcd8ce'" />
                  <div class="cart-item-info">
                    <h4>${item.title}</h4>
                    <p><span class="media-badge ${item.mediaType}">${item.mediaType}</span></p>
                  </div>
                  <div class="qty-control">
                    <button class="qty-btn cart-qty-minus" data-id="${item.photoId}">−</button>
                    <input class="qty-value cart-qty-input" data-id="${item.photoId}" type="number" value="${item.copies}" min="1" max="99" />
                    <button class="qty-btn cart-qty-plus" data-id="${item.photoId}">+</button>
                  </div>
                  <button class="cart-item-remove" data-id="${item.photoId}" title="Remove">Remove</button>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="checkout-sidebar">
            <h3>Service Option</h3>
            <div class="service-tiers" id="service-tiers">
              <div class="tier-card selected" data-tier="1day">
                <div>
                  <h4>Express</h4>
                  <div class="tier-label">Ready in 1 day</div>
                </div>
                <div class="tier-price">$0.30</div>
              </div>
              <div class="tier-card" data-tier="3day">
                <div>
                  <h4>Standard</h4>
                  <div class="tier-label">Ready in 3 days</div>
                </div>
                <div class="tier-price">$0.20</div>
              </div>
              <div class="tier-card" data-tier="1week">
                <div>
                  <h4>Economy</h4>
                  <div class="tier-label">Ready in 1 week</div>
                </div>
                <div class="tier-price">$0.10</div>
              </div>
            </div>
            <div id="summary-card">
              <div class="summary-row"><span>Items</span><span>${cart.length}</span></div>
              <div class="summary-row"><span>Total Copies</span><span>${totalCopies}</span></div>
              <div class="summary-row"><span>Service</span><span id="summary-service">Express</span></div>
              <div class="summary-row"><span>Cost per Copy</span><span id="summary-cost-per">$0.30</span></div>
              <div class="summary-row total"><span>Total</span><span id="summary-total">$${(totalCopies * 0.30).toFixed(2)}</span></div>
            </div>
            <button class="btn btn-primary btn-block" id="checkout-btn" style="margin-top:32px">Place Print Order</button>
          </div>
        </div>
      </div>
    `;

    // Set initial service to 1day
    selectedService = '1day';
    updateSummary();

    function updateSummary() {
      const labels = { '1day': 'Express (1 day)', '3day': 'Standard (3 days)', '1week': 'Economy (1 week)' };
      const tc = cart.reduce((s, i) => s + i.copies, 0);
      container.querySelector('#summary-service').textContent = labels[selectedService];
      container.querySelector('#summary-cost-per').textContent = `$${costs[selectedService].toFixed(2)}`;
      container.querySelector('#summary-total').textContent = `$${(tc * costs[selectedService]).toFixed(2)}`;
    }

    // Tier selection
    container.querySelectorAll('.tier-card').forEach(card => {
      card.onclick = () => {
        container.querySelectorAll('.tier-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedService = card.dataset.tier;
        updateSummary();
      };
    });

    // Quantity controls
    container.querySelectorAll('.cart-qty-minus').forEach(btn => {
      btn.onclick = () => { const id = parseInt(btn.dataset.id); const item = cart.find(c => c.photoId === id); if (item && item.copies > 1) { updateCartQty(id, item.copies - 1); render(); } };
    });
    container.querySelectorAll('.cart-qty-plus').forEach(btn => {
      btn.onclick = () => { const id = parseInt(btn.dataset.id); const item = cart.find(c => c.photoId === id); if (item) { updateCartQty(id, item.copies + 1); render(); } };
    });
    container.querySelectorAll('.cart-qty-input').forEach(inp => {
      inp.onchange = () => { updateCartQty(parseInt(inp.dataset.id), Math.max(1, parseInt(inp.value) || 1)); render(); };
    });

    // Remove
    container.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.onclick = () => { removeFromCart(parseInt(btn.dataset.id)); showToast('Item removed from cart', 'info'); render(); };
    });

    // Checkout
    container.querySelector('#checkout-btn').onclick = async () => {
      const btn = container.querySelector('#checkout-btn');
      btn.disabled = true; btn.textContent = 'Processing...';
      try {
        const data = await api('/orders', {
          method: 'POST',
          body: {
            items: cart.map(i => ({ photoId: i.photoId, copies: i.copies })),
            serviceType: selectedService,
          }
        });
        clearCart();
        navigate('checkout', { order: data.order });
      } catch (e) {
        showToast(e.message, 'error');
        btn.disabled = false; btn.textContent = 'Place Print Order';
      }
    };
  }

  render();
}

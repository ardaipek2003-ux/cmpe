import { api, navigate, state } from '../main.js';

export async function renderCheckout(container, params) {
  // If we just placed an order, show confirmation
  if (params?.order) {
    const order = params.order;
    const serviceLabels = { '1day': 'Express (1 Day)', '3day': 'Standard (3 Days)', '1week': 'Economy (1 Week)' };
    container.innerHTML = `
      <div class="order-success fade-in">
        <h2 style="font-family:var(--font-display)">Order Placed.</h2>
        <p style="color:var(--text-secondary);font-size:1.1rem">Your print order <strong>#${order.OrderID}</strong> has been received and is being processed.</p>
        <div style="border:1px solid var(--border);padding:32px;text-align:left;margin:40px auto;max-width:600px">
          <div class="summary-row"><span>Service</span><span style="font-family:var(--font-display);font-weight:700;text-transform:uppercase">${serviceLabels[order.ServiceType]}</span></div>
          <div class="summary-row"><span>Available Date</span><span>${order.availableDate}</span></div>
          <div class="summary-row"><span>Items</span><span>${order.items.length}</span></div>
          <div class="summary-row total"><span>Total Cost</span><span>$${order.TotalCost.toFixed(2)}</span></div>
        </div>
        <h3 style="font-family:var(--font-display);font-size:1.5rem;text-transform:uppercase;margin-bottom:24px">Works Ordered</h3>
        <div class="cart-list" style="max-width:600px;margin:0 auto 40px;border-top:2px solid var(--text-primary)">
          ${order.items.map(item => `
            <div class="cart-item" style="grid-template-columns:80px 1fr auto;padding:24px 0">
              <img class="cart-item-img" src="${item.ThumbnailURL}" alt="${item.Title}" style="width:80px;height:100px" onerror="this.style.background='#dcd8ce'" />
              <div class="cart-item-info">
                <h4 style="font-size:1.2rem">${item.Title}</h4>
                <p><span class="media-badge ${item.MediaType}">${item.MediaType}</span></p>
              </div>
              <div style="text-align:right;font-size:1rem;font-family:var(--font-display);font-weight:700">
                <div>${item.Copies} copies</div>
                <div style="color:var(--text-secondary)">$${(item.Copies * item.CostPerCopy).toFixed(2)}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <p style="color:var(--text-secondary);font-size:0.95rem;margin-bottom:32px">
          Shipping to:<br> <strong style="color:var(--text-primary)">${state.user.mailingAddress}</strong>
        </p>
        <div style="display:flex;gap:16px;justify-content:center">
          <button class="btn btn-primary" id="browse-btn">Back to Exhibition</button>
          <button class="btn btn-secondary" id="history-btn">View All Orders</button>
        </div>
      </div>
    `;
    container.querySelector('#browse-btn').onclick = () => navigate('browse');
    container.querySelector('#history-btn').onclick = () => navigate('checkout', { tab: 'history' });
    return;
  }

  // Order history view
  container.innerHTML = `
    <div class="page-header fade-in">
      <h1>Archive</h1>
      <p>View your past print orders and their status</p>
    </div>
    <div id="orders-list" class="fade-in"><div class="spinner"></div></div>
  `;

  try {
    const orders = await api('/orders');
    const list = container.querySelector('#orders-list');
    if (orders.length === 0) {
      list.innerHTML = `<div class="empty-state"><h3>No orders yet</h3><p>Browse the exhibition and place your first print order.</p><button class="btn btn-primary" id="browse-btn2" style="margin-top:24px">Explore Works</button></div>`;
      list.querySelector('#browse-btn2').onclick = () => navigate('browse');
      return;
    }

    const serviceLabels = { '1day': 'Express', '3day': 'Standard', '1week': 'Economy' };
    list.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:32px;padding-bottom:120px">
        ${orders.map(order => `
          <div style="border:1px solid var(--border);padding:24px;background:var(--bg-secondary)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;border-bottom:1px solid var(--border);padding-bottom:16px">
              <div>
                <div style="font-family:var(--font-display);font-weight:700;font-size:1.25rem;text-transform:uppercase">Order #${order.OrderID}</div>
                <div style="font-size:0.85rem;color:var(--text-secondary)">${new Date(order.OrderDate).toLocaleDateString()}</div>
              </div>
              <span style="background:var(--text-primary);color:var(--bg-secondary);padding:6px 12px;font-size:0.75rem;text-transform:uppercase;font-weight:700">${order.Status}</span>
            </div>
            <div style="display:flex;gap:8px;margin-bottom:24px;overflow-x:auto;padding-bottom:8px">
              ${order.items.map(item => `<img src="${item.ThumbnailURL}" alt="${item.Title}" style="width:60px;height:80px;object-fit:cover" onerror="this.style.background='#dcd8ce'" />`).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-family:var(--font-display)">
              <div style="color:var(--text-secondary);font-size:0.9rem">${serviceLabels[order.ServiceType]}</div>
              <div style="font-weight:700;font-size:1.5rem">$${order.TotalCost.toFixed(2)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    container.querySelector('#orders-list').innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Error loading orders</h3><p>${e.message}</p></div>`;
  }
}

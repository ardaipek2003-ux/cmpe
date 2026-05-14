import { state, navigate, api, showToast } from '../main.js';

export function renderHeader(container) {
  const header = document.createElement('header');
  header.className = 'header';
  const initials = (state.user.firstName[0] + state.user.lastName[0]).toUpperCase();

  header.innerHTML = `
    <div style="display:flex;align-items:center;width:100%;justify-content:space-between;gap:24px">
      <nav class="nav-links">
        <button class="nav-link ${state.currentPage === 'browse' ? 'active' : ''}" id="nav-browse">Browse</button>
        <button class="nav-link ${state.currentPage === 'checkout' && state.pageParams?.tab === 'history' ? 'active' : ''}" id="nav-orders">Orders</button>
      </nav>
      
      <a class="logo" href="#" id="nav-home" style="white-space:nowrap;font-size:1.2rem;letter-spacing:-0.05em">
        P.Lab
      </a>

      <div class="nav-actions">
        <button class="cart-btn" id="nav-cart">
          Cart
          <span class="cart-badge"></span>
        </button>
        <div class="dropdown">
          <button class="user-menu" id="user-menu-btn" title="${state.user.firstName}">
            ${initials}
          </button>
          <div class="dropdown-menu" id="user-dropdown">
            <div style="padding:10px 16px;border-bottom:1px solid var(--border);margin-bottom:8px">
              <div style="font-family:var(--font-display);font-weight:700;text-transform:uppercase">${state.user.firstName} ${state.user.lastName}</div>
              <div style="font-size:0.8rem;color:var(--text-muted)">${state.user.email}</div>
            </div>
            <button class="dropdown-item" id="menu-orders">Order History</button>
            <button class="dropdown-item danger" id="menu-logout">Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  `;
  container.appendChild(header);

  // Events
  header.querySelector('#nav-home').onclick = (e) => { e.preventDefault(); navigate('browse'); };
  header.querySelector('#nav-browse').onclick = () => navigate('browse');
  header.querySelector('#nav-orders').onclick = () => navigate('checkout', { tab: 'history' });
  header.querySelector('#nav-cart').onclick = () => navigate('cart');
  
  const menuBtn = header.querySelector('#user-menu-btn');
  const dropdown = header.querySelector('#user-dropdown');
  menuBtn.onclick = () => dropdown.classList.toggle('open');
  document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('open');
  });

  header.querySelector('#menu-orders').onclick = () => { dropdown.classList.remove('open'); navigate('checkout', { tab: 'history' }); };
  header.querySelector('#menu-logout').onclick = async () => {
    await api('/auth/logout', { method: 'POST' });
    state.user = null;
    showToast('Signed out successfully', 'info');
    navigate('login');
  };
}

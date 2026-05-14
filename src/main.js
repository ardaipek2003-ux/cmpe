// ═══ State Management ═══
const API = '/api';

export const state = {
  user: null,
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  currentPage: 'login',
};

export function saveCart() {
  localStorage.setItem('cart', JSON.stringify(state.cart));
  updateCartBadge();
}

export function addToCart(item) {
  const existing = state.cart.find(c => c.photoId === item.photoId);
  if (existing) { existing.copies += item.copies; }
  else { state.cart.push({ ...item }); }
  saveCart();
  showToast(`Added "${item.title}" to cart`, 'success');
}

export function removeFromCart(photoId) {
  state.cart = state.cart.filter(c => c.photoId !== photoId);
  saveCart();
}

export function updateCartQty(photoId, copies) {
  const item = state.cart.find(c => c.photoId === photoId);
  if (item) { item.copies = Math.max(1, copies); saveCart(); }
}

export function clearCart() { state.cart = []; saveCart(); }

function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (badge) {
    const count = state.cart.reduce((sum, i) => sum + i.copies, 0);
    badge.textContent = count > 0 ? count : '';
  }
}

// ═══ API Helpers ═══
export async function api(endpoint, options = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ═══ Toast System ═══
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ═══ Router ═══
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderBrowse } from './pages/browse.js';
import { renderDetail } from './pages/detail.js';
import { renderCart } from './pages/cart.js';
import { renderCheckout } from './pages/checkout.js';
import { renderHeader } from './components/header.js';

export function navigate(page, params = {}) {
  state.currentPage = page;
  state.pageParams = params;
  render();
}

async function render() {
  const app = document.getElementById('app');
  const page = state.currentPage;

  if (page === 'login' || page === 'register') {
    app.innerHTML = '';
    if (page === 'login') renderLogin(app);
    else renderRegister(app);
    return;
  }

  // Authenticated pages
  if (!state.user) {
    navigate('login');
    return;
  }

  app.innerHTML = '';
  renderHeader(app);
  const main = document.createElement('main');
  main.className = 'container fade-in';
  app.appendChild(main);

  switch (page) {
    case 'browse': await renderBrowse(main); break;
    case 'detail': await renderDetail(main, state.pageParams); break;
    case 'cart': renderCart(main); break;
    case 'checkout': await renderCheckout(main, state.pageParams); break;
    default: await renderBrowse(main);
  }
  updateCartBadge();
}

// ═══ Init ═══
async function init() {
  try {
    const data = await api('/auth/me');
    state.user = data.user;
    navigate('browse');
  } catch {
    navigate('login');
  }
}

init();

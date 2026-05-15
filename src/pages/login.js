import { api, state, navigate, showToast } from '../main.js';

export function renderLogin(container) {
  const page = document.createElement('div');
  page.className = 'auth-page';
  page.innerHTML = `
    <div class="auth-card fade-in">
      <div class="auth-header">
        <div style="font-family:var(--font-display); font-size:1.5rem; font-weight:800; text-transform:uppercase; margin-bottom:16px; letter-spacing:-0.03em;">PhotoLab Gallery</div>
        <h1 style="font-family:var(--font-display)">Welcome Back.</h1>
        <p style="color:var(--text-secondary)">Sign in to access your curated collection of premium archival prints.</p>
      </div>
      <form id="login-form">
        <div class="form-group">
          <label class="form-label" for="login-username">Username</label>
          <input class="form-input" type="text" id="login-username" placeholder="Enter your username" autocomplete="username" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <input class="form-input" type="password" id="login-password" placeholder="Enter your password" autocomplete="current-password" required />
        </div>
        <div id="login-error" class="form-error" style="margin-bottom:24px;display:none"></div>
        <button type="submit" class="btn btn-primary btn-block" id="login-submit" style="margin-top:16px">Sign In</button>
      </form>
      <p style="text-align:left;margin-top:32px;font-size:0.95rem;color:var(--text-secondary)">
        Don't have an account? <a href="#" id="goto-register" style="font-weight:700;color:var(--text-primary)">Create one</a>
      </p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid var(--border);font-size:0.85rem;color:var(--text-muted)">
        Demo account: <strong style="color:var(--text-primary)">demo</strong> / <strong style="color:var(--text-primary)">demo123</strong>
      </div>
    </div>
  `;
  container.appendChild(page);

  page.querySelector('#goto-register').onclick = (e) => { e.preventDefault(); navigate('register'); };
  page.querySelector('#login-form').onsubmit = async (e) => {
    e.preventDefault();
    const errorEl = page.querySelector('#login-error');
    errorEl.style.display = 'none';
    const btn = page.querySelector('#login-submit');
    btn.disabled = true; btn.textContent = 'Signing in...';
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: {
          username: page.querySelector('#login-username').value.trim(),
          password: page.querySelector('#login-password').value,
        }
      });
      state.user = data.user;
      showToast(`Welcome back, ${data.user.firstName}!`, 'success');
      navigate('browse');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Sign In';
    }
  };
}

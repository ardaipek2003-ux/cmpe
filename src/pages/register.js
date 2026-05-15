import { api, state, navigate, showToast } from '../main.js';

export function renderRegister(container) {
  const page = document.createElement('div');
  page.className = 'auth-page';
  page.innerHTML = `
    <div class="auth-hero" style="background-image: url('/media/citizen_kane.jpg')"></div>
    <div class="auth-content">
      <div class="auth-card fade-in" style="max-width:500px">
      <div class="auth-header">
        <div style="font-family:var(--font-display); font-size:1.5rem; font-weight:800; text-transform:uppercase; margin-bottom:16px; letter-spacing:-0.03em;">PhotoLab Gallery</div>
        <h1 style="font-family:var(--font-display)">Join the Exhibition.</h1>
        <p style="color:var(--text-secondary)">Create an account to start collecting exclusive, museum-quality prints from world-renowned artists.</p>
      </div>
      <form id="register-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="reg-firstname">First Name</label>
            <input class="form-input" type="text" id="reg-firstname" placeholder="John" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-lastname">Last Name</label>
            <input class="form-input" type="text" id="reg-lastname" placeholder="Doe" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-email">Email Address</label>
          <input class="form-input" type="email" id="reg-email" placeholder="john@example.com" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-address">Mailing Address</label>
          <input class="form-input" type="text" id="reg-address" placeholder="123 Main St, City, Country" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="reg-username">Username</label>
            <input class="form-input" type="text" id="reg-username" placeholder="johndoe" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-password">Password</label>
            <input class="form-input" type="password" id="reg-password" placeholder="Min 4 characters" required minlength="4" />
          </div>
        </div>
        <div id="reg-error" class="form-error" style="margin-bottom:24px;display:none"></div>
        <button type="submit" class="btn btn-primary btn-block" id="reg-submit">Create Account</button>
      </form>
      <p style="text-align:left;margin-top:32px;font-size:0.95rem;color:var(--text-secondary)">
        Already have an account? <a href="#" id="goto-login" style="font-weight:700;color:var(--text-primary)">Sign in</a>
      </p>
      </div>
    </div>
  `;
  container.appendChild(page);

  page.querySelector('#goto-login').onclick = (e) => { e.preventDefault(); navigate('login'); };
  page.querySelector('#register-form').onsubmit = async (e) => {
    e.preventDefault();
    const errorEl = page.querySelector('#reg-error');
    errorEl.style.display = 'none';
    const btn = page.querySelector('#reg-submit');
    btn.disabled = true; btn.textContent = 'Creating account...';
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: {
          firstName: page.querySelector('#reg-firstname').value.trim(),
          lastName: page.querySelector('#reg-lastname').value.trim(),
          email: page.querySelector('#reg-email').value.trim(),
          mailingAddress: page.querySelector('#reg-address').value.trim(),
          username: page.querySelector('#reg-username').value.trim(),
          password: page.querySelector('#reg-password').value,
        }
      });
      state.user = data.user;
      showToast('Account created successfully!', 'success');
      navigate('browse');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Create Account';
    }
  };
}

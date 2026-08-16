import { api } from '../api.js';
import { tenant, escapeHtml } from '../tenant.js';
import { cart } from '../store.js';

export async function renderLoginPage() {
  const token = api.isAuthenticated();
  if (token) {
    window.location.hash = '#/account';
    return `<main class="section"><div class="container" style="text-align:center;padding:4rem;">Redirecting to account dashboard...</div></main>`;
  }

  return `
    <main class="section auth-page">
      <div class="container auth-shell" style="max-width:520px;">
        <div class="glass-card auth-card" style="padding:2.5rem;">
          <!-- Auth Toggle Tabs -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:2rem;background:var(--bg-tertiary);padding:0.35rem;border-radius:var(--radius-md);">
            <button id="tab-login" class="btn btn-primary btn-sm auth-tab-btn" style="border-radius:var(--radius-sm);">Sign In</button>
            <button id="tab-register" class="btn btn-secondary btn-sm auth-tab-btn" style="border-radius:var(--radius-sm);">Create Account</button>
          </div>

          <!-- Sign In Form -->
          <form id="login-form">
            <div style="text-align:center;margin-bottom:1.5rem;">
              <h1 style="font-size:1.8rem;margin-bottom:0.25rem;">Welcome Back</h1>
              <p style="color:var(--text-secondary);font-size:0.9rem;">Sign in to access your orders & quick checkout.</p>
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="login-email" class="form-control" required placeholder="customer@example.com" />
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="login-password" class="form-control" required placeholder="••••••••" />
            </div>

            <button type="submit" id="btn-submit-login" class="btn btn-primary btn-lg" style="width:100%;margin-top:1rem;">
              Sign In <i class="ri-arrow-right-line"></i>
            </button>
          </form>

          <!-- Register Form -->
          <form id="register-form" style="display:none;">
            <div style="text-align:center;margin-bottom:1.5rem;">
              <h1 style="font-size:1.8rem;margin-bottom:0.25rem;">Join ${escapeHtml(tenant.brand.identity.name)}</h1>
              <p style="color:var(--text-secondary);font-size:0.9rem;">Create your diner account in seconds.</p>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">First Name *</label>
                <input type="text" id="reg-fname" class="form-control" required placeholder="Jane" />
              </div>
              <div class="form-group">
                <label class="form-label">Last Name *</label>
                <input type="text" id="reg-lname" class="form-control" required placeholder="Doe" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" id="reg-email" class="form-control" required placeholder="jane@example.com" />
            </div>

            <div class="form-group">
              <label class="form-label">Phone Number *</label>
              <input type="tel" id="reg-phone" class="form-control" required placeholder="+1 (555) 019-2831" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">Password *</label>
                <input type="password" id="reg-pass" class="form-control" required placeholder="••••••••" />
              </div>
              <div class="form-group">
                <label class="form-label">Confirm Password *</label>
                <input type="password" id="reg-pass-confirm" class="form-control" required placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" id="btn-submit-register" class="btn btn-primary btn-lg" style="width:100%;margin-top:1rem;">
              Create Account <i class="ri-user-add-line"></i>
            </button>
          </form>
        </div>
      </div>
    </main>
  `;
}

export function setupLoginPageEvents() {
  // Tab Switching
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (tabLogin && tabRegister) {
    tabLogin.onclick = () => {
      tabLogin.className = 'btn btn-primary btn-sm auth-tab-btn';
      tabRegister.className = 'btn btn-secondary btn-sm auth-tab-btn';
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
    };

    tabRegister.onclick = () => {
      tabRegister.className = 'btn btn-primary btn-sm auth-tab-btn';
      tabLogin.className = 'btn btn-secondary btn-sm auth-tab-btn';
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
    };
  }

  // Handle Login Submit
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-submit-login');
      btn.disabled = true;
      btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Authenticating...`;

      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;

      const res = await api.login(email, pass);

      if (res.success) {
        cart.showToast(`Welcome back to ${tenant.brand.identity.name}!`);
        window.location.hash = '#/account';
      } else {
        btn.disabled = false;
        btn.innerHTML = `Sign In <i class="ri-arrow-right-line"></i>`;
        cart.showToast(res.error || 'Authentication failed. Please check credentials.');
      }
    };
  }

  // Handle Register Submit
  if (registerForm) {
    registerForm.onsubmit = async (e) => {
      e.preventDefault();
      const pass = document.getElementById('reg-pass').value;
      const passConfirm = document.getElementById('reg-pass-confirm').value;

      if (pass !== passConfirm) {
        cart.showToast('Passwords do not match.');
        return;
      }

      const btn = document.getElementById('btn-submit-register');
      btn.disabled = true;
      btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Registering Account...`;

      const payload = {
        first_name: document.getElementById('reg-fname').value,
        last_name: document.getElementById('reg-lname').value,
        email: document.getElementById('reg-email').value,
        telephone: document.getElementById('reg-phone').value,
        password: pass,
        password_confirm: passConfirm,
        send_invite: false,
        customer_group_id: 1,
        status: true
      };

      const res = await api.registerCustomer(payload);

      if (res.success) {
        cart.showToast('Account created successfully!');
        window.location.hash = '#/account';
      } else {
        btn.disabled = false;
        btn.innerHTML = `Create Account <i class="ri-user-add-line"></i>`;
        cart.showToast(res.error || 'Registration failed. Please check input details.');
      }
    };
  }
}

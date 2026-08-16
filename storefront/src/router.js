import { renderHeader, setupHeaderEvents } from './components/header.js';
import { renderCartDrawer, setupCartDrawerEvents } from './components/cart-drawer.js';
import { renderHomePage, setupHomePageEvents } from './pages/home.js';
import { renderMenuPage, setupMenuPageEvents } from './pages/menu.js';
import { renderCheckoutPage, setupCheckoutPageEvents } from './pages/checkout.js';
import { renderReservationPage, setupReservationEvents } from './pages/reservation.js';
import { renderLoginPage, setupLoginPageEvents } from './pages/login.js';
import { renderAccountPage, setupAccountPageEvents } from './pages/account.js';
import { renderLocationsPage, setupLocationsPageEvents } from './pages/locations.js';
import { tenant, escapeHtml, safeImageUrl } from './tenant.js';
import { analytics } from './analytics.js';

const routes = {
  '/': { render: renderHomePage, setup: setupHomePageEvents },
  '/menu': { render: renderMenuPage, setup: setupMenuPageEvents },
  '/checkout': { render: renderCheckoutPage, setup: setupCheckoutPageEvents },
  '/reservations': { render: renderReservationPage, setup: setupReservationEvents },
  '/login': { render: renderLoginPage, setup: setupLoginPageEvents },
  '/account': { render: renderAccountPage, setup: setupAccountPageEvents },
  '/locations': { render: renderLocationsPage, setup: setupLocationsPageEvents }
};

export async function handleRouting() {
  const hash = window.location.hash.slice(1) || '/';
  const [path, queryString] = hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(queryString || ''));

  const route = routes[path] || routes['/'];

  const appEl = document.getElementById('app');
  if (!appEl) return;

  // Render Skeleton / Loading state while fetching async page data
  appEl.innerHTML = `
    ${renderHeader()}
    <div id="cart-drawer-container">${renderCartDrawer()}</div>
    <div id="page-content" style="min-height:70vh;display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;color:var(--text-secondary);">
        <div class="spinner-glow"></div>
        <p style="font-weight:600;font-size:1.05rem;color:var(--text-primary);">Preparing Culinary Experience...</p>
        <p style="font-size:0.85rem;color:var(--text-muted);margin-top:0.25rem;">Fetching real-time menu data</p>
      </div>
    </div>
    ${renderFooter()}
  `;

  setupHeaderEvents();
  setupCartDrawerEvents();

  // Render actual page
  const contentEl = document.getElementById('page-content');
  try {
    const pageHtml = await route.render(params);
    if (contentEl) {
      contentEl.style.minHeight = 'auto';
      contentEl.style.display = 'block';
      contentEl.innerHTML = pageHtml;
      if (route.setup) route.setup();
      analytics.track('page_view', {route: path});
    }
  } catch (error) {
    if (contentEl) {
      contentEl.style.minHeight = '70vh';
      contentEl.style.display = 'flex';
      contentEl.innerHTML = `
        <div style="max-width:460px;padding:2rem;text-align:center;">
          <i class="ri-error-warning-line" style="font-size:3rem;color:var(--accent-rose);"></i>
          <h2 style="margin:1rem 0 0.5rem;">We couldn't load this page</h2>
          <p style="color:var(--text-secondary);">${error.message || 'Please check your connection and try again.'}</p>
          <button class="btn btn-primary" style="margin-top:1.5rem;" onclick="window.location.reload()">Try again</button>
        </div>`;
    }
  }

  // Scroll to top on navigation
  window.scrollTo(0, 0);
}

function renderFooter() {
  const navigation = tenant.brand.navigation?.length ? tenant.brand.navigation : [
    {label: 'Menu', href: '#/menu'}, {label: 'Reserve Table', href: '#/reservations'}, {label: 'Locations', href: '#/locations'},
  ];
  return `
    <footer class="site-footer" style="background:var(--bg-secondary);border-top:1px solid var(--border-subtle);padding:4rem 0 2rem;margin-top:4rem;">
      <div class="container" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:2.5rem;margin-bottom:3rem;">
        <div>
          <a href="#/" class="logo" style="margin-bottom:1rem;">
            ${tenant.brand.identity.logo_url ? `<span class="logo-icon logo-icon-image"><img src="${safeImageUrl(tenant.brand.identity.logo_url)}" alt="" /></span>` : '<span class="logo-icon"><i class="ri-restaurant-2-fill"></i></span>'}
            <span>${escapeHtml(tenant.brand.identity.name)}</span>
          </a>
          <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;">
            ${escapeHtml(tenant.brand.identity.tagline || tenant.brand.content.hero_subtitle || '')}
          </p>
        </div>

        <div>
          <h4 style="font-size:1.1rem;margin-bottom:1rem;color:#fff;">Quick Links</h4>
          <ul style="list-style:none;display:flex;flex-direction:column;gap:0.5rem;color:var(--text-secondary);font-size:0.9rem;">
            ${navigation.map(item => `<li><a href="${item.href}" class="nav-link">${escapeHtml(item.label)}</a></li>`).join('')}
            <li><a href="#/login" class="nav-link">Customer Account</a></li>
          </ul>
        </div>

        <div>
          <h4 style="font-size:1.1rem;margin-bottom:1rem;color:#fff;">Opening Hours</h4>
          <ul style="list-style:none;display:flex;flex-direction:column;gap:0.5rem;color:var(--text-secondary);font-size:0.9rem;">
            <li>Monday - Friday: 11:00 AM - 10:30 PM</li>
            <li>Saturday - Sunday: 10:00 AM - 11:00 PM</li>
            <li>Holiday Hours May Vary</li>
          </ul>
        </div>

        <div>
          <h4 style="font-size:1.1rem;margin-bottom:1rem;color:#fff;">Newsletter</h4>
          <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:0.75rem;">Get secret chef specials & exclusive discounts.</p>
          <div style="display:flex;gap:0.5rem;">
            <input type="email" class="form-control" placeholder="Enter email..." style="border-radius:var(--radius-md);font-size:0.85rem;" />
            <button class="btn btn-primary btn-sm">Join</button>
          </div>
        </div>
      </div>

      <div class="container" style="padding-top:1.5rem;border-top:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;color:var(--text-muted);font-size:0.85rem;">
        <div>&copy; ${new Date().getFullYear()} ${escapeHtml(tenant.brand.content.footer_text || tenant.brand.identity.name)}</div>
        <div style="display:flex;gap:1rem;font-size:1.2rem;">
          <a href="#" style="color:var(--text-secondary);"><i class="ri-instagram-line"></i></a>
          <a href="#" style="color:var(--text-secondary);"><i class="ri-facebook-box-line"></i></a>
          <a href="#" style="color:var(--text-secondary);"><i class="ri-twitter-x-line"></i></a>
        </div>
      </div>
    </footer>
  `;
}

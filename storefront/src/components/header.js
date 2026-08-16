import { cart } from '../store.js';
import { api } from '../api.js';
import { tenant, escapeHtml, safeImageUrl } from '../tenant.js';

export function renderHeader() {
  const state = cart.getState();
  const isLoggedIn = api.isAuthenticated();
  const userLabel = isLoggedIn ? 'Account' : 'Sign In';
  const userHref = isLoggedIn ? '#/account' : '#/login';
  const navigation = tenant.brand.navigation?.length ? tenant.brand.navigation : [
    {label: 'Home', href: '#/'}, {label: 'Menu', href: '#/menu'},
    {label: 'Reserve Table', href: '#/reservations'}, {label: 'Locations', href: '#/locations'},
  ];

  return `
    <header class="navbar">
      <div class="container navbar-container">
        <a href="#/" class="logo">
          ${tenant.brand.identity.logo_url ? `<span class="logo-icon logo-icon-image"><img src="${safeImageUrl(tenant.brand.identity.logo_url)}" alt="" /></span>` : '<span class="logo-icon"><i class="ri-restaurant-2-fill"></i></span>'}
          <span>${escapeHtml(tenant.brand.identity.name)}</span>
        </a>

        <button id="mobile-menu-toggle" class="mobile-menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="primary-navigation">
          <i class="ri-menu-line"></i>
        </button>

        <ul class="nav-links" id="primary-navigation">
          ${navigation.map(item => `<li><a href="${item.href}" class="nav-link ${window.location.hash === item.href.slice(1) || (item.href === '#/' && !window.location.hash) ? 'active' : ''}">${escapeHtml(item.label)}</a></li>`).join('')}
        </ul>

        <div class="nav-actions">
          <a href="${userHref}" class="btn btn-outline btn-sm">
            <i class="ri-user-3-line"></i>
            <span>${userLabel}</span>
          </a>

          <button id="cart-drawer-toggle" class="btn btn-primary btn-sm" style="position:relative;">
            <i class="ri-shopping-bag-3-fill" style="font-size:1.1rem"></i>
            <span class="cart-btn-badge" id="header-cart-count">${state.count}</span>
            <span style="margin-left:4px;">${escapeHtml(tenant.currency.symbol || '')}${state.total.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </header>
  `;
}

export function setupHeaderEvents() {
  const toggleBtn = document.getElementById('cart-drawer-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.querySelector('.cart-drawer-overlay')?.classList.add('open');
    });
  }

  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('primary-navigation');
  if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('mobile-open');
      mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
      mobileMenuToggle.innerHTML = `<i class="ri-${isOpen ? 'close' : 'menu'}-line"></i>`;
    });
  }

  // Update header badge when cart changes
  cart.subscribe((state) => {
    const badge = document.getElementById('header-cart-count');
    if (badge) badge.textContent = state.count;
  });
}

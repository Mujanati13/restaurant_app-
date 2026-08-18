import { api } from '../api.js';
import { openItemModal } from '../components/item-modal.js';
import { tenant, escapeHtml, safeImageUrl } from '../tenant.js';

export async function renderHomePage() {
  const [categories, menuItems, storefrontConfig, locations] = await Promise.all([
    api.getCategories(),
    api.getMenus(),
    api.getStorefrontConfig(),
    api.getLocations(),
  ]);

  const currencySymbol = storefrontConfig.currency?.symbol || '';
  const specials = menuItems.filter(item => item.is_special).slice(0, 4);
  const featuredItems = (specials.length ? specials : menuItems).slice(0, 4);
  const brand = tenant.brand;
  const visible = type => brand.sections.length === 0 || brand.sections.some(section => section.type === type && section.visible);
  const restaurantName = escapeHtml(brand.identity.name);

  return `
    <main class="home-page">
      <section class="storefront-status" aria-label="Restaurant services">
        <div class="container storefront-status-inner">
          <span><i class="ri-checkbox-circle-fill"></i> Online ordering available</span>
          <span><i class="ri-calendar-check-line"></i> Instant reservations</span>
          <span><i class="ri-shield-check-line"></i> Secure customer accounts</span>
        </div>
      </section>

      ${visible('hero') ? `<section class="hero home-hero">
        <div class="container hero-grid">
          <div class="hero-copy">
            <span class="eyebrow"><i class="ri-leaf-fill"></i> ${escapeHtml(brand.identity.tagline)}</span>
            <h1 class="hero-title">${escapeHtml(brand.content.hero_title)}</h1>
            <p class="hero-subtitle">${escapeHtml(brand.content.hero_subtitle)}</p>

            <div class="hero-actions">
              <a href="#/menu" class="btn btn-primary btn-lg">Explore the menu <i class="ri-arrow-right-line"></i></a>
              <a href="#/reservations" class="btn btn-outline btn-lg">Make a reservation <i class="ri-calendar-check-line"></i></a>
            </div>

            <dl class="hero-metrics" aria-label="Restaurant availability">
              <div><dt>${menuItems.length}</dt><dd>Dishes available</dd></div>
              <div><dt>${categories.length}</dt><dd>Menu categories</dd></div>
              <div><dt>${locations.length}</dt><dd>${locations.length === 1 ? 'Location' : 'Locations'}</dd></div>
            </dl>
          </div>

          <div class="hero-visual">
            <div class="hero-image-frame">
              <img src="${safeImageUrl(brand.content.hero_image_url, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=86')}" alt="${restaurantName}" class="hero-image" />
            </div>
            <div class="hero-order-card">
              <span class="hero-order-icon"><i class="ri-restaurant-2-line"></i></span>
              <div><strong>Freshly prepared</strong><span>Order for delivery or collection</span></div>
            </div>
            <div class="hero-reserve-card"><i class="ri-calendar-event-line"></i><span>Reserve online</span></div>
          </div>
        </div>
      </section>` : ''}

      <section class="service-features" aria-labelledby="service-features-title">
        <div class="container">
          <div class="section-heading centered-heading">
            <span class="section-kicker">Everything in one place</span>
            <h2 id="service-features-title">A smoother way to enjoy ${restaurantName}</h2>
            <p>Browse, order, reserve, and follow every visit from one responsive storefront.</p>
          </div>
          <div class="service-feature-grid">
            <a href="#/menu" class="service-feature-card">
              <span class="feature-icon"><i class="ri-shopping-bag-3-line"></i></span>
              <div><h3>Order online</h3><p>Explore live menus and restaurant pricing, then choose delivery or collection.</p></div>
              <i class="ri-arrow-right-up-line feature-arrow"></i>
            </a>
            <a href="#/reservations" class="service-feature-card">
              <span class="feature-icon"><i class="ri-calendar-check-line"></i></span>
              <div><h3>Reservations</h3><p>Choose your branch, party size, date, and time in a few simple steps.</p></div>
              <i class="ri-arrow-right-up-line feature-arrow"></i>
            </a>
            <a href="#/account" class="service-feature-card">
              <span class="feature-icon"><i class="ri-user-heart-line"></i></span>
              <div><h3>Your dining account</h3><p>Keep addresses together and review your orders and reservations securely.</p></div>
              <i class="ri-arrow-right-up-line feature-arrow"></i>
            </a>
          </div>
        </div>
      </section>

      ${visible('categories') ? `<section class="quick-order-section">
        <div class="container">
          <div class="section-heading section-heading-inline">
            <div><span class="section-kicker">Find your favourite</span><h2>Browse the menu</h2></div>
            <a href="#/menu" class="section-link">View everything <i class="ri-arrow-right-line"></i></a>
          </div>
          ${categories.length ? `<div class="category-bar">
            ${categories.map(category => `<a href="#/menu?category=${encodeURIComponent(category.id)}" class="category-tab"><i class="ri-restaurant-2-line"></i><span>${escapeHtml(category.name)}</span></a>`).join('')}
          </div>` : `<div class="home-empty-state"><i class="ri-restaurant-line"></i><p>Our menu categories are being prepared.</p></div>`}
        </div>
      </section>` : ''}

      ${visible('featured_dishes') ? `<section class="section featured-section">
        <div class="container">
          <div class="section-heading section-heading-inline">
            <div>
              <span class="section-kicker">From our kitchen</span>
              <h2>Featured dishes</h2>
              <p>Customer favourites with live ${escapeHtml(storefrontConfig.currency?.code || '')} pricing.</p>
            </div>
            <a href="#/menu" class="section-link">Full menu <i class="ri-arrow-right-line"></i></a>
          </div>

          ${featuredItems.length ? `<div class="menu-grid home-menu-grid">
            ${featuredItems.map(item => `<article class="glass-card menu-card">
              <div class="menu-card-img-wrap">
                <img src="${safeImageUrl(item.image)}" alt="${escapeHtml(item.name)}" class="menu-card-img" loading="lazy" />
                <span class="badge badge-gold menu-card-badge">Featured</span>
              </div>
              <div class="menu-card-body">
                <div class="menu-card-header"><h3 class="menu-card-title">${escapeHtml(item.name)}</h3><span class="menu-card-price">${escapeHtml(currencySymbol)}${Number(item.price).toFixed(2)}</span></div>
                <p class="menu-card-desc">${escapeHtml(item.description || 'Freshly prepared by our kitchen.')}</p>
                <div class="menu-card-footer">
                  <span class="delivery-time"><i class="ri-restaurant-line"></i> Made to order</span>
                  <button class="btn btn-primary btn-sm add-item-btn" type="button" data-id="${escapeHtml(item.id)}" aria-label="Add ${escapeHtml(item.name)} to cart"><i class="ri-add-line"></i><span class="button-label">Add</span></button>
                </div>
              </div>
            </article>`).join('')}
          </div>` : `<div class="home-empty-state"><i class="ri-restaurant-line"></i><p>Featured dishes will appear here soon.</p><a href="#/menu" class="btn btn-primary">Open menu</a></div>`}
        </div>
      </section>` : ''}

      <section class="section home-journey-section">
        <div class="container journey-layout">
          <div class="journey-copy">
            <span class="section-kicker">Made for every screen</span>
            <h2>Your order and reservations stay with you.</h2>
            <p>Create an account once to keep your details, follow recent orders, and manage upcoming reservations from mobile or desktop.</p>
            <ul class="journey-list">
              <li><i class="ri-check-line"></i> Tenant-secured customer account</li>
              <li><i class="ri-check-line"></i> Server-validated menu prices</li>
              <li><i class="ri-check-line"></i> Order and reservation history</li>
            </ul>
            <a href="#/login" class="btn btn-secondary">Open your account <i class="ri-arrow-right-line"></i></a>
          </div>
          <div class="journey-panel" aria-hidden="true">
            <div class="journey-phone">
              <div class="phone-top"><span></span></div>
              <div class="phone-brand"><i class="ri-restaurant-2-fill"></i><strong>${restaurantName}</strong></div>
              <div class="phone-card"><span class="phone-card-icon"><i class="ri-shopping-bag-3-line"></i></span><div><small>Recent order</small><strong>Fresh from the kitchen</strong></div><span class="phone-pill">Received</span></div>
              <div class="phone-card"><span class="phone-card-icon"><i class="ri-calendar-check-line"></i></span><div><small>Reservation</small><strong>Your reservation request</strong></div><span class="phone-pill">Saved</span></div>
            </div>
          </div>
        </div>
      </section>

      ${visible('reservation_cta') ? `<section class="section service-section">
        <div class="container service-banner">
          <div><span class="section-kicker">Planning a visit?</span><h2>Your next dining experience is only a few clicks away.</h2><p>Select a location and time, then let our team prepare for your arrival.</p></div>
          <a href="#/reservations" class="btn btn-primary">Make a reservation <i class="ri-calendar-check-line"></i></a>
        </div>
      </section>` : ''}
    </main>
  `;
}

export function setupHomePageEvents() {
  document.querySelectorAll('.add-item-btn').forEach(button => {
    button.onclick = async () => {
      button.disabled = true;
      try {
        const item = await api.getMenu(button.dataset.id);
        if (item) openItemModal(item);
      } finally {
        button.disabled = false;
      }
    };
  });
}

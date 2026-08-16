import { cart } from '../store.js';

export function renderCartDrawer() {
  const state = cart.getState();

  const itemsHtml = state.items.length === 0 ? `
    <div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
      <i class="ri-shopping-bag-line" style="font-size: 3.5rem; display: block; margin-bottom: 1rem; color: var(--border-subtle);"></i>
      <p style="font-size: 1.1rem; font-weight: 600; color: var(--text-secondary);">Your cart is empty</p>
      <p style="font-size: 0.88rem; margin-top: 0.5rem;">Explore our gourmet menu and add your favorite dishes!</p>
      <a href="#/menu" class="btn btn-outline btn-sm" style="margin-top: 1.5rem;" onclick="document.querySelector('.cart-drawer-overlay').classList.remove('open')">Browse Menu</a>
    </div>
  ` : state.items.map((item, idx) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
      <div class="cart-item-info">
        <div class="cart-item-title">${item.name}</div>
        ${item.selectedOptions && item.selectedOptions.length > 0 ? `
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
            ${item.selectedOptions.map(o => o.name).join(', ')}
          </div>
        ` : ''}
        <div class="cart-item-price">$${(item.unitPrice * item.quantity).toFixed(2)}</div>
      </div>
      <div class="cart-item-qty">
        <button class="btn-qty-minus" data-index="${idx}" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;padding:2px 6px;">
          <i class="ri-subtract-line"></i>
        </button>
        <span style="font-weight:700;font-size:0.9rem;">${item.quantity}</span>
        <button class="btn-qty-plus" data-index="${idx}" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;padding:2px 6px;">
          <i class="ri-add-line"></i>
        </button>
      </div>
    </div>
  `).join('');

  return `
    <div class="cart-drawer-overlay">
      <div class="cart-drawer">
        <div class="cart-header">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <i class="ri-shopping-bag-fill text-gold" style="font-size:1.4rem;"></i>
            <h3 style="font-size:1.2rem;">Your Order</h3>
            <span class="badge badge-gold">${state.count} items</span>
          </div>
          <button id="cart-drawer-close" style="background:none;border:none;color:var(--text-muted);font-size:1.5rem;cursor:pointer;">
            <i class="ri-close-line"></i>
          </button>
        </div>

        <!-- Delivery Mode Switcher -->
        <div style="padding: 1rem 1.5rem 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <button class="btn ${state.deliveryType === 'delivery' ? 'btn-primary' : 'btn-secondary'} btn-sm delivery-type-btn" data-type="delivery">
            <i class="ri-takeaway-fill"></i> Delivery
          </button>
          <button class="btn ${state.deliveryType === 'pickup' ? 'btn-primary' : 'btn-secondary'} btn-sm delivery-type-btn" data-type="pickup">
            <i class="ri-store-2-fill"></i> Pickup
          </button>
        </div>

        <div class="cart-items" id="cart-drawer-items">
          ${itemsHtml}
        </div>

        ${state.items.length > 0 ? `
          <div class="cart-footer">
            <div class="cart-summary-row">
              <span>Subtotal</span>
              <span>$${state.subtotal.toFixed(2)}</span>
            </div>
            <div class="cart-summary-row">
              <span>Tax (8%)</span>
              <span>$${state.tax.toFixed(2)}</span>
            </div>
            <div class="cart-summary-row">
              <span>${state.deliveryType === 'delivery' ? 'Delivery Fee' : 'Pickup Fee'}</span>
              <span>${state.deliveryType === 'delivery' ? `$${state.deliveryFee.toFixed(2)}` : 'FREE'}</span>
            </div>
            <div class="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span class="text-gold">$${state.total.toFixed(2)}</span>
            </div>

            <a href="#/checkout" class="btn btn-primary btn-lg" style="width:100%;margin-top:1.25rem;" onclick="document.querySelector('.cart-drawer-overlay').classList.remove('open')">
              Proceed to Checkout <i class="ri-arrow-right-line"></i>
            </a>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

export function setupCartDrawerEvents() {
  document.addEventListener('click', (e) => {
    const overlay = document.querySelector('.cart-drawer-overlay');
    if (!overlay) return;

    if (e.target.id === 'cart-drawer-close' || e.target.closest('#cart-drawer-close') || e.target === overlay) {
      overlay.classList.remove('open');
    }

    const minusBtn = e.target.closest('.btn-qty-minus');
    if (minusBtn) {
      const idx = parseInt(minusBtn.dataset.index);
      cart.updateQuantity(idx, cart.items[idx].quantity - 1);
    }

    const plusBtn = e.target.closest('.btn-qty-plus');
    if (plusBtn) {
      const idx = parseInt(plusBtn.dataset.index);
      cart.updateQuantity(idx, cart.items[idx].quantity + 1);
    }

    const deliveryBtn = e.target.closest('.delivery-type-btn');
    if (deliveryBtn) {
      cart.setDeliveryType(deliveryBtn.dataset.type);
    }
  });

  cart.subscribe(() => {
    const container = document.getElementById('cart-drawer-container');
    if (container) {
      const isOpen = document.querySelector('.cart-drawer-overlay')?.classList.contains('open');
      container.innerHTML = renderCartDrawer();
      if (isOpen) {
        document.querySelector('.cart-drawer-overlay')?.classList.add('open');
      }
    }
  });
}

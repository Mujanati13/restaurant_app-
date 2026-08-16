import { cart } from '../store.js';
import { api } from '../api.js';
import { analytics } from '../analytics.js';

export async function renderCheckoutPage() {
  const state = cart.getState();

  if (state.items.length === 0) {
    return `
      <main class="section">
        <div class="container" style="text-align:center;padding:5rem 1rem;">
          <i class="ri-shopping-cart-2-line" style="font-size:4rem;color:var(--text-muted);display:block;margin-bottom:1rem;"></i>
          <h2>Your Cart is Empty</h2>
          <p style="color:var(--text-secondary);margin:0.5rem 0 2rem;">Add items to your cart before proceeding to checkout.</p>
          <a href="#/menu" class="btn btn-primary btn-lg">Browse Menu</a>
        </div>
      </main>
    `;
  }

  const [locations, storefrontConfig] = await Promise.all([
    api.getLocations(),
    api.getStorefrontConfig(),
  ]);

  return `
    <main class="section checkout-page">
      <div class="container">
        <div style="margin-bottom:2rem;">
          <h1 style="font-size:2.2rem;margin-bottom:0.25rem;">Checkout & Place Order</h1>
          <p style="color:var(--text-secondary);">Complete your order details below.</p>
        </div>

        <div class="checkout-grid" style="display:grid;grid-template-columns:1.5fr 1fr;gap:2.5rem;" id="checkout-grid">
          <!-- Checkout Form -->
          <form id="checkout-form" class="glass-card" style="padding:2rem;" data-order-status-id="${storefrontConfig.default_order_status_id}" data-country-id="${storefrontConfig.default_country_id}">
            <h3 style="font-size:1.3rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:0.5rem;">
              <i class="ri-user-contact-fill text-gold"></i> 1. Contact Information
            </h3>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">First Name *</label>
                <input type="text" id="cust-fname" class="form-control" required placeholder="John" />
              </div>
              <div class="form-group">
                <label class="form-label">Last Name *</label>
                <input type="text" id="cust-lname" class="form-control" required placeholder="Doe" />
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input type="email" id="cust-email" class="form-control" required placeholder="john@example.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number *</label>
                <input type="tel" id="cust-phone" class="form-control" required placeholder="+1 (555) 000-0000" />
              </div>
            </div>

            <h3 style="font-size:1.3rem;margin:2rem 0 1.5rem;display:flex;align-items:center;gap:0.5rem;">
              <i class="ri-map-pin-2-fill text-gold"></i> 2. ${state.deliveryType === 'delivery' ? 'Delivery Address' : 'Pickup Location'}
            </h3>

            <div class="form-group">
              <label class="form-label">Restaurant Branch *</label>
              <select id="order-location" class="form-control" required>
                ${locations.map(loc => `<option value="${loc.id}">${loc.name} — ${loc.address}</option>`).join('')}
              </select>
            </div>

            ${state.deliveryType === 'delivery' ? `
              <div class="form-group">
                <label class="form-label">Street Address *</label>
                <input type="text" id="cust-street" class="form-control" required placeholder="123 Main Street, Apt 4B" />
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;">
                <div class="form-group">
                  <label class="form-label">City *</label>
                  <input type="text" id="cust-city" class="form-control" required placeholder="New York" />
                </div>
                <div class="form-group">
                  <label class="form-label">State / Prov</label>
                  <input type="text" id="cust-state" class="form-control" placeholder="NY" />
                </div>
                <div class="form-group">
                  <label class="form-label">Postal Code *</label>
                  <input type="text" id="cust-zip" class="form-control" required placeholder="10001" />
                </div>
              </div>
            ` : `
              <div class="form-group" style="display:none" aria-hidden="true">
                <label class="form-label">Select Pickup Branch *</label>
                <select id="pickup-location" class="form-control">
                  ${locations.map(loc => `<option value="${loc.id}">${loc.name} — ${loc.address}</option>`).join('')}
                </select>
              </div>
            `}

            <h3 style="font-size:1.3rem;margin:2rem 0 1.5rem;display:flex;align-items:center;gap:0.5rem;">
              <i class="ri-bank-card-fill text-gold"></i> 3. Payment Method
            </h3>

            <div style="display:grid;grid-template-columns:1fr;gap:1rem;margin-bottom:1.5rem;">
              <label style="display:flex;align-items:center;gap:0.75rem;padding:1rem;background:var(--bg-tertiary);border-radius:var(--radius-md);border:1px solid var(--accent-amber);cursor:pointer;">
                <input type="radio" name="payment_method" value="cod" checked style="accent-color:var(--accent-amber);" />
                <div>
                  <div style="font-weight:700;">Cash / Card on Delivery</div>
                  <div style="font-size:0.8rem;color:var(--text-secondary);">Pay upon arrival</div>
                </div>
              </label>

            </div>

            <button type="submit" id="btn-place-order" class="btn btn-primary btn-lg" style="width:100%;margin-top:1rem;">
              <i class="ri-lock-2-fill"></i> Complete Order ($${state.total.toFixed(2)})
            </button>
          </form>

          <!-- Order Summary Sidebar -->
          <div>
            <div class="glass-card" style="padding:1.5rem;position:sticky;top:90px;">
              <h3 style="font-size:1.2rem;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border-subtle);">
                Order Summary (${state.count} items)
              </h3>

              <div style="display:flex;flex-direction:column;gap:1rem;max-height:300px;overflow-y:auto;margin-bottom:1.25rem;">
                ${state.items.map(item => `
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                      <div style="font-weight:600;font-size:0.95rem;">${item.quantity}x ${item.name}</div>
                      ${item.selectedOptions?.length ? `<div style="font-size:0.75rem;color:var(--text-muted);">${item.selectedOptions.map(o=>o.name).join(', ')}</div>` : ''}
                    </div>
                    <span style="font-weight:700;color:var(--accent-gold);">$${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                `).join('')}
              </div>

              <div class="cart-summary-row"><span>Subtotal</span><span>$${state.subtotal.toFixed(2)}</span></div>
              <div class="cart-summary-row"><span>Tax (8%)</span><span>$${state.tax.toFixed(2)}</span></div>
              <div class="cart-summary-row"><span>${state.deliveryType === 'delivery' ? 'Delivery Fee' : 'Pickup Fee'}</span><span>${state.deliveryType === 'delivery' ? `$${state.deliveryFee.toFixed(2)}` : 'FREE'}</span></div>

              <div class="cart-summary-row cart-summary-total">
                <span>Total Due</span>
                <span class="text-gold">$${state.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;
}

export function setupCheckoutPageEvents() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!api.isAuthenticated()) {
      cart.showToast('Please sign in before placing an order.');
      window.location.hash = '#/login';
      return;
    }
    const btn = document.getElementById('btn-place-order');
    btn.disabled = true;
    btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Processing Order...`;

    const state = cart.getState();
    const defaultCountryId = Number(form.dataset.countryId);
    const orderPayload = {
      location_id: Number(document.getElementById('order-location').value),
      first_name: document.getElementById('cust-fname').value,
      last_name: document.getElementById('cust-lname').value,
      telephone: document.getElementById('cust-phone').value,
      order_type: state.deliveryType === 'pickup' ? 'collection' : 'delivery',
      items: state.items.map(i => ({
        menu_id: Number(i.id),
        quantity: i.quantity,
        comment: i.specialInstructions || '',
      })),
    };

    if (state.deliveryType === 'delivery') {
      orderPayload.address = {
        address_1: document.getElementById('cust-street').value,
        city: document.getElementById('cust-city').value,
        state: document.getElementById('cust-state').value,
        postcode: document.getElementById('cust-zip').value,
        country_id: defaultCountryId
      };
    }

    const result = await api.createOrder(orderPayload);

    if (result.success) {
      analytics.track('order_completed', {order_id: result.orderId, order_type: orderPayload.order_type, items: state.count});
      cart.clear();
      renderOrderSuccess(result.orderId);
    } else {
      btn.disabled = false;
      btn.textContent = 'Retry Order';
      alert('Order processing failed. Please try again.');
    }
  };
}

function renderOrderSuccess(orderId) {
  const grid = document.getElementById('checkout-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="glass-card" style="grid-column:1/-1;text-align:center;padding:4rem 2rem;">
        <div style="width:80px;height:80px;background:var(--accent-amber-glow);color:var(--accent-gold);border-radius:var(--radius-full);display:flex;align-items:center;justify-content:center;font-size:3rem;margin:0 auto 1.5rem;">
          <i class="ri-checkbox-circle-fill"></i>
        </div>
        <h1 style="font-size:2.5rem;margin-bottom:0.5rem;">Order Confirmed!</h1>
        <p style="font-size:1.1rem;color:var(--text-secondary);max-width:500px;margin:0 auto 1.5rem;">
          Thank you for dining with us! Your order <strong class="text-gold">#${orderId}</strong> has been received and is being prepared by our chefs.
        </p>
        <div style="display:flex;justify-content:center;gap:1rem;">
          <a href="#/menu" class="btn btn-primary btn-lg">Order Something Else</a>
          <a href="#/" class="btn btn-outline btn-lg">Back to Home</a>
        </div>
      </div>
    `;
  }
}

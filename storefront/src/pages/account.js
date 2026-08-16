import { api } from '../api.js';
import { cart } from '../store.js';

export async function renderAccountPage() {
  const token = api.isAuthenticated();
  if (!token) {
    window.location.hash = '#/login';
    return `<main class="section"><div class="container" style="text-align:center;padding:4rem;">Redirecting to login...</div></main>`;
  }

  const [user, orders, reservations, addresses] = await Promise.all([
    api.getUserProfile(),
    api.getOrders(),
    api.getReservations(),
    api.getAddresses()
  ]);

  const firstName = user?.first_name || user?.name?.split(' ')[0] || 'Diner';
  const lastName = user?.last_name || user?.name?.split(' ').slice(1).join(' ') || '';
  const email = user?.email || '';
  const telephone = user?.telephone || '';

  return `
    <main class="section account-page">
      <div class="container" style="max-width:1000px;">
        
        <!-- Header Banner -->
        <div class="glass-card account-hero" style="padding:2rem;margin-bottom:2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.5rem;">
          <div style="display:flex;align-items:center;gap:1.25rem;">
            <div style="width:64px;height:64px;background:var(--accent-amber-glow);color:var(--accent-gold);border-radius:var(--radius-full);display:flex;align-items:center;justify-content:center;font-size:2rem;">
              <i class="ri-user-3-line"></i>
            </div>
            <div>
              <h1 style="font-size:1.8rem;margin-bottom:0.25rem;">Hello, ${firstName}!</h1>
              <p style="color:var(--text-secondary);font-size:0.95rem;"><i class="ri-mail-line"></i> ${email} ${telephone ? `• <i class="ri-phone-line"></i> ${telephone}` : ''}</p>
            </div>
          </div>
          <button id="account-btn-logout" class="btn btn-outline btn-sm">
            <i class="ri-logout-box-r-line"></i> Sign Out
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div style="display:flex;gap:1rem;margin-bottom:2rem;border-bottom:1px solid var(--border-color);padding-bottom:0.5rem;overflow-x:auto;">
          <button id="acc-tab-orders" class="btn btn-primary btn-sm acc-tab"><i class="ri-file-list-3-line"></i> Orders (${orders.length})</button>
          <button id="acc-tab-reservations" class="btn btn-secondary btn-sm acc-tab"><i class="ri-calendar-event-line"></i> Reservations (${reservations.length})</button>
          <button id="acc-tab-addresses" class="btn btn-secondary btn-sm acc-tab"><i class="ri-map-pin-line"></i> Addresses (${addresses.length})</button>
          <button id="acc-tab-profile" class="btn btn-secondary btn-sm acc-tab"><i class="ri-user-settings-line"></i> Profile Settings</button>
        </div>

        <!-- Tab 1: Orders -->
        <div id="acc-sec-orders" class="acc-section">
          ${orders.length === 0 ? `
            <div class="glass-card" style="padding:3rem;text-align:center;">
              <i class="ri-restaurant-2-line" style="font-size:3rem;color:var(--text-muted);display:block;margin-bottom:1rem;"></i>
              <h3 style="margin-bottom:0.5rem;">No orders placed yet</h3>
              <p style="color:var(--text-secondary);margin-bottom:1.5rem;">Explore our menu and enjoy gourmet dishes delivered to your door.</p>
              <a href="#/menu" class="btn btn-primary btn-md">Browse Menu</a>
            </div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:1rem;">
              ${orders.map(order => `
                <div class="glass-card" style="padding:1.5rem;">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:1rem;border-bottom:1px solid var(--border-color);padding-bottom:1rem;">
                    <div>
                      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.35rem;">
                        <h3 style="font-size:1.15rem;margin:0;">Order #${order.id}</h3>
                        <span class="badge" style="background:${order.status_color}22;color:${order.status_color};border:1px solid ${order.status_color}55;">
                          ${order.status_name}
                        </span>
                        <span class="badge badge-gold" style="text-transform:capitalize;">${order.order_type}</span>
                      </div>
                      <p style="color:var(--text-secondary);font-size:0.85rem;margin:0;">
                        <i class="ri-time-line"></i> ${new Date(order.created_at || order.order_time).toLocaleString()} • ${order.location}
                      </p>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:1.3rem;font-weight:700;color:var(--accent-gold);">$${parseFloat(order.total).toFixed(2)}</div>
                      <button class="btn btn-outline btn-sm btn-view-order" data-id="${order.id}" style="margin-top:0.35rem;">
                        <i class="ri-eye-line"></i> Details
                      </button>
                    </div>
                  </div>
                  ${order.menus && order.menus.length > 0 ? `
                    <div style="color:var(--text-secondary);font-size:0.9rem;">
                      <strong>Items:</strong> ${order.menus.map(m => `${m.qty || m.quantity || 1}x ${m.name || m.menu_name}`).join(', ')}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Tab 2: Reservations -->
        <div id="acc-sec-reservations" class="acc-section" style="display:none;">
          ${reservations.length === 0 ? `
            <div class="glass-card" style="padding:3rem;text-align:center;">
              <i class="ri-calendar-check-line" style="font-size:3rem;color:var(--text-muted);display:block;margin-bottom:1rem;"></i>
              <h3 style="margin-bottom:0.5rem;">No active reservations</h3>
              <p style="color:var(--text-secondary);margin-bottom:1.5rem;">Book a table at one of our locations for an unforgettable dining experience.</p>
              <a href="#/reservations" class="btn btn-primary btn-md">Reserve a Table</a>
            </div>
          ` : `
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:1.5rem;">
              ${reservations.map(res => `
                <div class="glass-card" style="padding:1.5rem;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                    <span class="badge" style="background:${res.status_color}22;color:${res.status_color};border:1px solid ${res.status_color}55;">
                      ${res.status_name}
                    </span>
                    <span style="font-size:0.85rem;color:var(--text-secondary);"><i class="ri-user-line"></i> ${res.guest_num} Guests</span>
                  </div>
                  <h3 style="font-size:1.1rem;margin-bottom:0.5rem;"><i class="ri-calendar-line text-gold"></i> ${res.reserve_date} at ${res.reserve_time}</h3>
                  <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:0.5rem;"><i class="ri-map-pin-line text-gold"></i> ${res.location_name}</p>
                  ${res.comment ? `<p style="font-size:0.85rem;color:var(--text-muted);font-style:italic;">"${res.comment}"</p>` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Tab 3: Saved Addresses -->
        <div id="acc-sec-addresses" class="acc-section" style="display:none;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
            <h2 style="font-size:1.4rem;margin:0;">Delivery Addresses</h2>
            <button id="btn-toggle-add-address" class="btn btn-primary btn-sm"><i class="ri-add-line"></i> Add New Address</button>
          </div>

          <!-- Add Address Form Card -->
          <div id="card-add-address" class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem;display:none;">
            <h3 style="font-size:1.1rem;margin-bottom:1rem;">New Address</h3>
            <form id="form-add-address">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div class="form-group">
                  <label class="form-label">Address Line 1 *</label>
                  <input type="text" id="addr-1" class="form-control" required placeholder="123 Main Street" />
                </div>
                <div class="form-group">
                  <label class="form-label">Address Line 2</label>
                  <input type="text" id="addr-2" class="form-control" placeholder="Apt 4B" />
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;">
                <div class="form-group">
                  <label class="form-label">City *</label>
                  <input type="text" id="addr-city" class="form-control" required placeholder="New York" />
                </div>
                <div class="form-group">
                  <label class="form-label">State / Province *</label>
                  <input type="text" id="addr-state" class="form-control" required placeholder="NY" />
                </div>
                <div class="form-group">
                  <label class="form-label">Postal / Zip Code *</label>
                  <input type="text" id="addr-zip" class="form-control" required placeholder="10001" />
                </div>
              </div>
              <div style="display:flex;gap:1rem;justify-content:flex-end;margin-top:1rem;">
                <button type="button" id="btn-cancel-address" class="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm">Save Address</button>
              </div>
            </form>
          </div>

          ${addresses.length === 0 ? `
            <div class="glass-card" style="padding:2.5rem;text-align:center;">
              <p style="color:var(--text-secondary);margin:0;">No saved addresses found. Add one for faster checkout!</p>
            </div>
          ` : `
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1rem;">
              ${addresses.map(addr => `
                <div class="glass-card" style="padding:1.25rem;">
                  <div style="font-weight:600;font-size:1rem;margin-bottom:0.35rem;">${addr.address_1} ${addr.address_2 || ''}</div>
                  <div style="color:var(--text-secondary);font-size:0.9rem;">${addr.city}, ${addr.state} ${addr.postcode}</div>
                  <div style="color:var(--text-muted);font-size:0.85rem;margin-top:0.25rem;">${addr.country}</div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Tab 4: Profile Settings -->
        <div id="acc-sec-profile" class="acc-section" style="display:none;">
          <div class="glass-card" style="padding:2rem;max-width:600px;">
            <h2 style="font-size:1.4rem;margin-bottom:1.5rem;">Update Account Details</h2>
            <form id="form-update-profile">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div class="form-group">
                  <label class="form-label">First Name</label>
                  <input type="text" id="prof-fname" class="form-control" value="${firstName}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name</label>
                  <input type="text" id="prof-lname" class="form-control" value="${lastName}" required />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" id="prof-email" class="form-control" value="${email}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="tel" id="prof-phone" class="form-control" value="${telephone}" placeholder="+1 (555) 019-2831" />
              </div>
              <button type="submit" id="btn-save-profile" class="btn btn-primary btn-md" style="margin-top:1rem;">
                Save Changes
              </button>
            </form>
          </div>
        </div>

      </div>
    </main>

    <!-- Order Detail Modal Container -->
    <div id="order-detail-modal" class="modal-backdrop" style="display:none;">
      <div class="glass-card modal-content" style="max-width:600px;width:90%;padding:2rem;max-height:85vh;overflow-y:auto;">
        <div id="order-detail-body">
          <i class="ri-loader-4-line ri-spin" style="font-size:2rem;display:block;text-align:center;"></i>
        </div>
      </div>
    </div>
  `;
}

export function setupAccountPageEvents() {
  // Logout
  const logoutBtn = document.getElementById('account-btn-logout');
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      try {
        await api.logout();
        cart.showToast('Logged out successfully');
        window.location.hash = '#/login';
      } catch (error) {
        cart.showToast('Unable to close the session. Please try again.');
      }
    };
  }

  // Tabs Switching
  const tabs = ['orders', 'reservations', 'addresses', 'profile'];
  tabs.forEach(tabName => {
    const btn = document.getElementById(`acc-tab-${tabName}`);
    if (btn) {
      btn.onclick = () => {
        tabs.forEach(t => {
          const b = document.getElementById(`acc-tab-${t}`);
          const s = document.getElementById(`acc-sec-${t}`);
          if (b && s) {
            if (t === tabName) {
              b.className = 'btn btn-primary btn-sm acc-tab';
              s.style.display = 'block';
            } else {
              b.className = 'btn btn-secondary btn-sm acc-tab';
              s.style.display = 'none';
            }
          }
        });
      };
    }
  });

  // Toggle New Address Form
  const btnToggleAddr = document.getElementById('btn-toggle-add-address');
  const btnCancelAddr = document.getElementById('btn-cancel-address');
  const cardAddAddr = document.getElementById('card-add-address');
  if (btnToggleAddr && cardAddAddr) {
    btnToggleAddr.onclick = () => { cardAddAddr.style.display = 'block'; };
  }
  if (btnCancelAddr && cardAddAddr) {
    btnCancelAddr.onclick = () => { cardAddAddr.style.display = 'none'; };
  }

  // Add Address Form Submit
  const formAddAddr = document.getElementById('form-add-address');
  if (formAddAddr) {
    formAddAddr.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        address_1: document.getElementById('addr-1').value,
        address_2: document.getElementById('addr-2').value,
        city: document.getElementById('addr-city').value,
        state: document.getElementById('addr-state').value,
        postcode: document.getElementById('addr-zip').value
      };
      const res = await api.createAddress(payload);
      if (res.success) {
        cart.showToast('Address saved successfully!');
        window.location.reload();
      } else {
        alert('Failed to save address.');
      }
    };
  }

  // Update Profile Submit
  const formProfile = document.getElementById('form-update-profile');
  if (formProfile) {
    formProfile.onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-save-profile');
      btn.disabled = true;
      btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Saving...`;

      const user = await api.getUserProfile();
      if (user && user.id) {
        const payload = {
          first_name: document.getElementById('prof-fname').value,
          last_name: document.getElementById('prof-lname').value,
          email: document.getElementById('prof-email').value,
          telephone: document.getElementById('prof-phone').value
        };
        const res = await api.updateProfile(payload);
        if (res.success) {
          cart.showToast('Profile updated!');
        } else {
          cart.showToast('Profile update submitted', 'info');
        }
      }
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    };
  }

  // View Order Detail Modal
  const orderModal = document.getElementById('order-detail-modal');
  const orderModalBody = document.getElementById('order-detail-body');
  document.querySelectorAll('.btn-view-order').forEach(btn => {
    btn.onclick = async () => {
      const orderId = btn.getAttribute('data-id');
      orderModal.style.display = 'flex';
      orderModalBody.innerHTML = `<div style="text-align:center;padding:2rem;"><i class="ri-loader-4-line ri-spin" style="font-size:2.5rem;color:var(--accent-gold);"></i><p style="margin-top:1rem;color:var(--text-secondary);">Fetching order #${orderId} details...</p></div>`;

      const order = await api.getOrder(orderId);
      if (order) {
        orderModalBody.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;border-bottom:1px solid var(--border-color);padding-bottom:1rem;">
            <div>
              <h2 style="font-size:1.5rem;margin-bottom:0.25rem;">Order #${order.id}</h2>
              <span class="badge" style="background:${order.status_color}22;color:${order.status_color};border:1px solid ${order.status_color}55;">
                ${order.status_name}
              </span>
            </div>
            <button id="btn-close-order-modal" class="btn btn-outline btn-sm"><i class="ri-close-line"></i> Close</button>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;font-size:0.9rem;color:var(--text-secondary);">
            <div><strong>Customer:</strong> ${order.first_name} ${order.last_name}</div>
            <div><strong>Phone:</strong> ${order.telephone || 'N/A'}</div>
            <div><strong>Payment:</strong> ${order.payment_name}</div>
            <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</div>
            ${order.delivery_address ? `<div style="grid-column:1 / -1;"><strong>Delivery Address:</strong> ${order.delivery_address}</div>` : ''}
          </div>

          <h3 style="font-size:1.1rem;margin-bottom:1rem;">Order Items</h3>
          <div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1.5rem;">
            ${(order.order_menus || []).map(item => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:var(--bg-tertiary);border-radius:var(--radius-sm);">
                <div>
                  <div style="font-weight:600;">${item.qty || 1}x ${item.name || item.menu_name}</div>
                  ${item.subtotal ? `<div style="font-size:0.85rem;color:var(--text-secondary);">$${parseFloat(item.price || 0).toFixed(2)} each</div>` : ''}
                </div>
                <div style="font-weight:600;color:var(--accent-gold);">$${parseFloat(item.subtotal || item.price * (item.qty || 1) || 0).toFixed(2)}</div>
              </div>
            `).join('')}
          </div>

          <div style="border-top:1px solid var(--border-color);padding-top:1rem;">
            ${(order.order_totals || []).map(t => `
              <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;font-size:${t.code === 'total' ? '1.15rem' : '0.95rem'};font-weight:${t.code === 'total' ? '700' : '400'};color:${t.code === 'total' ? 'var(--accent-gold)' : 'var(--text-secondary)'}">
                <span>${t.title}</span>
                <span>$${parseFloat(t.value).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        `;

        document.getElementById('btn-close-order-modal').onclick = () => {
          orderModal.style.display = 'none';
        };
      } else {
        orderModalBody.innerHTML = `<p style="color:var(--text-secondary);text-align:center;padding:2rem;">Could not load details for Order #${orderId}.</p><div style="text-align:center;"><button id="btn-close-order-modal" class="btn btn-primary btn-sm">Close</button></div>`;
        document.getElementById('btn-close-order-modal').onclick = () => {
          orderModal.style.display = 'none';
        };
      }
    };
  });

  if (orderModal) {
    orderModal.onclick = (e) => {
      if (e.target === orderModal) {
        orderModal.style.display = 'none';
      }
    };
  }
}

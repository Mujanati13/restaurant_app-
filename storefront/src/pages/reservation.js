import { api } from '../api.js';
import { analytics } from '../analytics.js';
import { cart } from '../store.js';

export async function renderReservationPage() {
  const [locations, storefrontConfig] = await Promise.all([
    api.getLocations(),
    api.getStorefrontConfig(),
  ]);

  return `
    <main class="section reservation-page">
      <div class="container" style="max-width:800px;">
        <div style="text-align:center;margin-bottom:2.5rem;">
          <span class="badge badge-gold" style="margin-bottom:0.75rem;">Exclusive Dining</span>
          <h1 style="font-size:2.4rem;margin-bottom:0.5rem;">Table Reservation</h1>
          <p style="color:var(--text-secondary);">Reserve your culinary experience at one of our fine dining rooms.</p>
        </div>

        <form id="reservation-form" class="glass-card reservation-card" style="padding:2.5rem;" data-reservation-status-id="${storefrontConfig.default_reservation_status_id}">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" id="res-name" class="form-control" required placeholder="Jane Smith" />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" id="res-email" class="form-control" required placeholder="jane@example.com" />
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
            <div class="form-group">
              <label class="form-label">Phone Number *</label>
              <input type="tel" id="res-phone" class="form-control" required placeholder="+1 (555) 019-2831" />
            </div>

            <div class="form-group">
              <label class="form-label">Number of Guests *</label>
              <select id="res-guests" class="form-control" required>
                <option value="2">2 Guests (Table for Two)</option>
                <option value="4" selected>4 Guests (Family Table)</option>
                <option value="6">6 Guests (Party)</option>
                <option value="8">8+ Guests (VIP Booth)</option>
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
            <div class="form-group">
              <label class="form-label">Reservation Date *</label>
              <input type="date" id="res-date" class="form-control" required value="${new Date().toISOString().split('T')[0]}" />
            </div>

            <div class="form-group">
              <label class="form-label">Time Slot *</label>
              <select id="res-time" class="form-control" required>
                <option value="17:30">05:30 PM</option>
                <option value="18:30" selected>06:30 PM</option>
                <option value="19:30">07:30 PM</option>
                <option value="20:30">08:30 PM</option>
                <option value="21:30">09:30 PM</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Select Branch *</label>
            <select id="res-location" class="form-control" required>
              ${locations.map(loc => `<option value="${loc.id}">${loc.name} — ${loc.address}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Preferred Table <span style="color:var(--text-muted);font-weight:400;">(optional)</span></label>
            <select id="res-table" class="form-control">
              <option value="">No preference — assign the best available table</option>
            </select>
            <p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.4rem;">Only tables that fit your party will be available to select.</p>
          </div>

          <div class="form-group">
            <label class="form-label">Special Seating Requests</label>
            <textarea id="res-notes" class="form-control" rows="3" placeholder="Window table, quiet area, birthday celebration..."></textarea>
          </div>

          <button type="submit" id="btn-submit-res" class="btn btn-primary btn-lg" style="width:100%;margin-top:1rem;">
            Confirm Table Reservation <i class="ri-calendar-check-line"></i>
          </button>
        </form>
      </div>
    </main>
  `;
}

export function setupReservationEvents() {
  const form = document.getElementById('reservation-form');
  if (!form) return;

  const guestSelect = document.getElementById('res-guests');
  const tableSelect = document.getElementById('res-table');
  const locationSelect = document.getElementById('res-location');
  const dateInput = document.getElementById('res-date');
  const timeSelect = document.getElementById('res-time');
  const refreshAvailableTables = async () => {
    if (!guestSelect || !tableSelect || !locationSelect || !dateInput || !timeSelect) return;
    tableSelect.disabled = true;
    tableSelect.innerHTML = '<option value="">Checking table availability...</option>';
    try {
      const tables = await api.getAvailableTables({
        locationId: locationSelect.value,
        date: dateInput.value,
        time: timeSelect.value,
        guestNum: guestSelect.value,
      });
      tableSelect.innerHTML = [
        '<option value="">No preference — assign the best available table</option>',
        ...tables.map(table => `<option value="${table.id}">${table.name} · seats ${table.minCapacity}–${table.maxCapacity}</option>`),
      ].join('');
    } catch (error) {
      tableSelect.innerHTML = '<option value="">No tables are currently available</option>';
      cart.showToast(error.message || 'Unable to check table availability.');
    } finally {
      tableSelect.disabled = false;
    }
  };
  [guestSelect, locationSelect, dateInput, timeSelect].forEach(control => {
    control?.addEventListener('change', refreshAvailableTables);
  });
  refreshAvailableTables();

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!api.isAuthenticated()) {
      cart.showToast('Please sign in before making a reservation.');
      window.location.hash = '#/login';
      return;
    }
    const btn = document.getElementById('btn-submit-res');
    btn.disabled = true;
    btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Processing Request...`;

    const nameParts = document.getElementById('res-name').value.trim().split(/\s+/);
    const payload = {
      first_name: nameParts.shift(),
      last_name: nameParts.join(' ') || '-',
      telephone: document.getElementById('res-phone').value,
      guest_num: document.getElementById('res-guests').value,
      reserve_date: document.getElementById('res-date').value,
      reserve_time: document.getElementById('res-time').value,
      location_id: document.getElementById('res-location').value,
      comment: document.getElementById('res-notes').value
    };
    const tableId = document.getElementById('res-table').value;
    if (tableId) payload.table_id = Number(tableId);

    const res = await api.createReservation(payload);

    if (res.success) {
      analytics.track('reservation_completed', {reservation_id: res.reservationId, guests: Number(payload.guest_num)});
      cart.showToast(`Table for ${payload.guest_num} reserved successfully!`);
      form.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;">
          <div style="width:70px;height:70px;background:var(--accent-amber-glow);color:var(--accent-gold);border-radius:var(--radius-full);display:flex;align-items:center;justify-content:center;font-size:2.5rem;margin:0 auto 1.5rem;">
            <i class="ri-restaurant-2-fill"></i>
          </div>
          <h2 style="font-size:2rem;margin-bottom:0.5rem;">Reservation Confirmed!</h2>
          <p style="color:var(--text-secondary);font-size:1rem;margin-bottom:1.5rem;">
            We look forward to welcoming you on <strong>${payload.reserve_date}</strong> at <strong>${payload.reserve_time}</strong>.
          </p>
          <a href="#/menu" class="btn btn-primary btn-md">Explore Menu Ahead</a>
        </div>
      `;
    } else {
      btn.disabled = false;
      btn.textContent = 'Retry Reservation';
    }
  };
}

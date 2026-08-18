import { api } from '../api.js';

export async function renderLocationsPage() {
  const locations = await api.getLocations();

  return `
    <main class="section locations-page">
      <div class="container">
        <div class="page-intro centered-page-intro" style="text-align:center;max-width:600px;margin:0 auto 3rem;">
          <span class="badge badge-gold" style="margin-bottom:0.75rem;">Find Us</span>
          <h1 style="font-size:2.4rem;margin-bottom:0.5rem;">Our Restaurant Locations</h1>
          <p style="color:var(--text-secondary);">Visit our dining rooms or order delivery from your nearest branch.</p>
        </div>

        <div class="locations-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:2rem;">
          ${locations.map(loc => `
            <div class="glass-card location-card" style="padding:2rem;">
              <div style="width:48px;height:48px;background:var(--accent-amber-glow);color:var(--accent-gold);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin-bottom:1.25rem;">
                <i class="ri-map-pin-2-line"></i>
              </div>
              <h2 style="font-size:1.4rem;margin-bottom:0.75rem;">${loc.name}</h2>

              <div style="display:flex;flex-direction:column;gap:0.75rem;color:var(--text-secondary);font-size:0.95rem;margin-bottom:1.5rem;">
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <i class="ri-building-line text-gold"></i> ${loc.address}
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <i class="ri-phone-line text-gold"></i> ${loc.phone}
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <i class="ri-mail-line text-gold"></i> ${loc.email}
                </div>
                <div style="display:flex;align-items:flex-start;gap:0.5rem;">
                  <i class="ri-time-line text-gold" style="margin-top:0.2rem;"></i> 
                  <div>
                    ${loc.workingHours && loc.workingHours.length > 0 
                      ? loc.workingHours.map(h => `<div><strong>${h.day}:</strong> ${h.open} - ${h.close} (${h.type || 'Opening'})</div>`).join('') 
                      : '<div>Mon - Sun: 11:00 AM - 11:00 PM</div>'}
                  </div>
                </div>
              </div>

              <div style="display:flex;gap:0.75rem;">
                <a href="#/menu" class="btn btn-primary btn-sm" style="flex:1;">Order Online</a>
                <a href="#/reservations" class="btn btn-outline btn-sm">Reservations</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </main>
  `;
}

export function setupLocationsPageEvents() {}

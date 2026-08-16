const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const state = {
  mode: localStorage.getItem('vondo_admin_mode') || 'owner',
  token: null,
  refreshToken: null,
  refreshPromise: null,
  view: null,
  restaurant: null,
  ownerBootstrap: null,
  selectedRestaurant: null,
  page: 1,
  restaurantHint: new URLSearchParams(location.search).get('restaurant'),
};

const tokenKey = () => `vondo:${location.host}:${state.mode}:admin_token`;
const refreshKey = () => `vondo:${location.host}:${state.mode}:admin_refresh_token`;
state.token = localStorage.getItem(tokenKey());
state.refreshToken = localStorage.getItem(refreshKey());
const esc = (value = '') => String(value ?? '').replace(/[&<>'"]/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[char]));
const money = (value, currency = state.restaurant?.currency_code || 'USD') => new Intl.NumberFormat(undefined, {style: 'currency', currency}).format(Number(value || 0));
const date = value => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, {dateStyle: 'medium'}).format(parsed);
};
const qs = values => new URLSearchParams(Object.entries(values).filter(([, value]) => value !== '' && value !== null && value !== undefined)).toString();

function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function notify(message, kind = 'info') {
  toast.textContent = message;
  toast.dataset.kind = kind;
  toast.classList.add('show');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

async function request(path, {method = 'GET', body, form = false, idempotent = false, retried = false} = {}) {
  const headers = {Accept: 'application/json'};
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  if (state.restaurantHint) headers['X-Vondo-Restaurant'] = state.restaurantHint;
  if (!form && body !== undefined) headers['Content-Type'] = 'application/json';
  if (idempotent) headers['Idempotency-Key'] = uuid();
  let response;
  try {
    response = await fetch(path, {method, headers, body: body === undefined ? undefined : (form ? body : JSON.stringify(body))});
  } catch {
    throw new Error('The server is unreachable. Check Docker and try again.');
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && !retried && state.refreshToken && !path.endsWith('/refresh')) {
      await refreshSession();
      return request(path, {method, body, form, idempotent, retried: true});
    }
    if (response.status === 401) {
      clearSession();
      renderLogin('Your session expired. Please sign in again.');
    }
    const details = data.errors ? Object.values(data.errors).flat().join(' ') : '';
    const error = new Error(details || data.message || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function refreshSession() {
  if (!state.refreshPromise) {
    const endpoint = state.mode === 'owner' ? '/api/v1/owner/refresh' : '/api/v1/platform/refresh';
    state.refreshPromise = fetch(endpoint, {
      method: 'POST',
      headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
      body: JSON.stringify({refresh_token: state.refreshToken}),
    }).then(async response => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Your session expired.');
      saveSession(data);
      return data;
    }).catch(error => {
      clearSession();
      throw error;
    }).finally(() => { state.refreshPromise = null; });
  }
  return state.refreshPromise;
}

function saveSession(session) {
  state.token = session.token;
  state.refreshToken = session.refresh_token || null;
  localStorage.setItem(tokenKey(), state.token);
  if (state.refreshToken) localStorage.setItem(refreshKey(), state.refreshToken); else localStorage.removeItem(refreshKey());
}

function clearSession() {
  localStorage.removeItem(tokenKey());
  localStorage.removeItem(refreshKey());
  state.token = null;
  state.refreshToken = null;
  state.restaurant = null;
  state.ownerBootstrap = null;
  state.selectedRestaurant = null;
}

async function logout() {
  const endpoint = state.mode === 'owner' ? '/api/v1/owner/session' : '/api/v1/platform/session';
  try { await request(endpoint, {method: 'DELETE'}); } catch (_) {}
  clearSession();
  renderLogin();
}

function setMode(mode) {
  clearSession();
  state.mode = mode;
  localStorage.setItem('vondo_admin_mode', mode);
  state.token = localStorage.getItem(tokenKey());
  state.refreshToken = localStorage.getItem(refreshKey());
  renderLogin();
}

function renderLogin(message = '') {
  app.innerHTML = `<main class="login">
    <section class="card login-card">
      <div class="login-head"><span class="brand-mark">V</span><span class="eyebrow">Restaurant platform</span><h1>Vondo Control</h1><p>One secure workspace for every restaurant operation.</p></div>
      <div class="segmented" aria-label="Workspace type">
        <button data-mode="owner" class="${state.mode === 'owner' ? 'active' : ''}">Restaurant owner</button>
        <button data-mode="platform" class="${state.mode === 'platform' ? 'active' : ''}">Super Admin</button>
      </div>
      ${message ? `<div class="notice error">${esc(message)}</div>` : ''}
      ${state.mode === 'owner' ? '<div class="notice">Use the restaurant domain when signing into a non-default tenant.</div>' : '<div class="notice secure">Platform access is restricted to Super Admin accounts.</div>'}
      <form id="login-form" class="form-grid">
        <div class="field full"><label for="email">Email</label><input id="email" type="email" autocomplete="username" required></div>
        <div class="field full"><label for="password">Password</label><input id="password" type="password" autocomplete="current-password" required minlength="8"></div>
        ${state.mode === 'platform' ? '<div class="field full"><label for="mfa-code">Authenticator or recovery code</label><input id="mfa-code" autocomplete="one-time-code" inputmode="numeric" maxlength="32" placeholder="Required when MFA is enabled"></div>' : ''}
        <button class="btn primary full" type="submit">Sign in securely</button>
      </form>
      ${state.mode === 'owner' ? '<div class="quick-actions"><button class="btn" id="register-owner" type="button">Create restaurant account</button><button class="btn ghost" id="forgot-password" type="button">Forgot password</button><button class="btn ghost" id="resend-verification" type="button">Resend verification</button></div>' : ''}
    </section>
  </main>`;
  document.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => setMode(button.dataset.mode));
  document.querySelector('#login-form').onsubmit = login;
  document.querySelector('#register-owner')?.addEventListener('click', renderOwnerRegistration);
  document.querySelector('#forgot-password')?.addEventListener('click', () => renderOwnerAccountForm('forgot-password'));
  document.querySelector('#resend-verification')?.addEventListener('click', () => renderOwnerAccountForm('resend-verification'));
}

function renderOwnerRegistration() {
  app.innerHTML = `<main class="login"><section class="card login-card">
    <div class="login-head"><span class="brand-mark">V</span><span class="eyebrow">Start with Vondo</span><h1>Create your restaurant</h1><p>Your isolated dashboard, storefront, and mobile configuration are provisioned together.</p></div>
    <form id="registration-form" class="form-grid">
      <div class="field"><label>Your name</label><input name="owner_name" required maxlength="80" autocomplete="name"></div>
      <div class="field"><label>Restaurant name</label><input name="restaurant_name" required maxlength="80"></div>
      <div class="field full"><label>Email</label><input name="email" type="email" required autocomplete="email"></div>
      <div class="field"><label>Password</label><input name="password" type="password" required minlength="10" autocomplete="new-password"></div>
      <div class="field"><label>Confirm password</label><input name="password_confirmation" type="password" required minlength="10" autocomplete="new-password"></div>
      <div class="field"><label>Timezone</label><input name="timezone" value="Africa/Casablanca" required></div>
      <div class="field"><label>Currency</label><input name="currency_code" value="MAD" minlength="3" maxlength="3" required></div>
      <button class="btn primary full" type="submit">Create restaurant</button><button class="btn full" id="back-login" type="button">Back to sign in</button>
    </form>
  </section></main>`;
  document.querySelector('#back-login').onclick = () => renderLogin();
  document.querySelector('#registration-form').onsubmit = async event => {
    event.preventDefault(); const button = event.submitter; button.disabled = true;
    try {
      const result = await request('/api/v1/owner/register', {method: 'POST', body: Object.fromEntries(new FormData(event.currentTarget)), idempotent: true});
      state.restaurantHint = result.data.restaurant_id;
      renderLogin('Restaurant created. Check your email to verify the owner account before signing in.');
    } catch (error) { notify(error.message, 'error'); button.disabled = false; }
  };
}

function renderOwnerAccountForm(action, token = '', message = '') {
  const reset = action === 'reset-password';
  const title = reset ? 'Choose a new password' : action === 'resend-verification' ? 'Resend verification' : 'Reset your password';
  app.innerHTML = `<main class="login"><section class="card login-card">
    <div class="login-head"><span class="brand-mark">V</span><span class="eyebrow">Restaurant owner</span><h1>${esc(title)}</h1><p>${reset ? 'Use a strong password you do not use elsewhere.' : 'Enter the email address for this restaurant.'}</p></div>
    ${message ? `<div class="notice">${esc(message)}</div>` : ''}
    <form id="account-form" class="form-grid">
      ${reset ? `<input type="hidden" name="token" value="${esc(token)}"><div class="field full"><label>New password</label><input name="password" type="password" autocomplete="new-password" minlength="10" required></div><div class="field full"><label>Confirm password</label><input name="password_confirmation" type="password" autocomplete="new-password" minlength="10" required></div>` : '<div class="field full"><label>Email</label><input name="email" type="email" autocomplete="email" required></div>'}
      <button class="btn primary full" type="submit">${reset ? 'Update password' : 'Send email'}</button>
      <button class="btn full" id="back-login" type="button">Back to sign in</button>
    </form>
  </section></main>`;
  document.querySelector('#back-login').onclick = () => renderLogin();
  document.querySelector('#account-form').onsubmit = async event => {
    event.preventDefault();
    const button = event.submitter; button.disabled = true;
    const endpoints = { 'forgot-password': '/api/v1/owner/password/forgot', 'resend-verification': '/api/v1/owner/email/resend', 'reset-password': '/api/v1/owner/password/reset' };
    try {
      const result = await request(endpoints[action], {method: 'POST', body: Object.fromEntries(new FormData(event.currentTarget))});
      history.replaceState({}, '', location.pathname);
      renderLogin(result.message);
    } catch (error) { notify(error.message, 'error'); button.disabled = false; }
  };
}

function renderStaffInvitation(token, invitationId) {
  app.innerHTML = `<main class="login"><section class="card login-card">
    <div class="login-head"><span class="brand-mark">V</span><span class="eyebrow">Team invitation</span><h1>Join the restaurant</h1><p>Create a password to accept this one-time invitation.</p></div>
    <form id="invitation-form" class="form-grid">
      <div class="field full"><label>New password</label><input name="password" type="password" autocomplete="new-password" minlength="10" required></div>
      <div class="field full"><label>Confirm password</label><input name="password_confirmation" type="password" autocomplete="new-password" minlength="10" required></div>
      <button class="btn primary full" type="submit">Accept invitation</button>
    </form>
  </section></main>`;
  document.querySelector('#invitation-form').onsubmit = async event => {
    event.preventDefault(); const button = event.submitter; button.disabled = true;
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      body.token = token; body.invitation_id = invitationId;
      await request('/api/v1/owner/invitations/accept', {method: 'POST', body});
      history.replaceState({}, '', location.pathname);
      renderLogin('Invitation accepted. Sign in with your email and new password.');
    } catch (error) { notify(error.message, 'error'); button.disabled = false; }
  };
}

async function handleOwnerAccountAction() {
  const params = new URLSearchParams(location.search);
  const action = params.get('action');
  const token = params.get('token') || '';
  if (action === 'reset-password' && token) {
    renderOwnerAccountForm(action, token);
    return true;
  }
  if (action === 'verify-email' && token) {
    try {
      const result = await request('/api/v1/owner/email/verify', {method: 'POST', body: {token}});
      history.replaceState({}, '', location.pathname);
      renderLogin(result.message);
    } catch (error) { renderLogin(error.message); }
    return true;
  }
  if (action === 'accept-invite' && token && params.get('invitation')) {
    renderStaffInvitation(token, params.get('invitation'));
    return true;
  }
  return false;
}

async function login(event) {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  try {
    const body = {email: document.querySelector('#email').value, password: document.querySelector('#password').value, device_name: `Vondo ${state.mode} portal`};
    if (state.mode === 'platform' && document.querySelector('#mfa-code')?.value) body.mfa_code = document.querySelector('#mfa-code').value;
    const endpoint = state.mode === 'owner' ? '/api/v1/owner/token' : '/api/v1/platform/token';
    const result = await request(endpoint, {method: 'POST', body});
    saveSession(result);
    await start();
  } catch (error) {
    notify(error.message, 'error');
    button.disabled = false;
  }
}

const ownerNav = [
  ['dashboard', 'Dashboard'], ['orders', 'Orders'], ['reservations', 'Reservations'], ['menus', 'Menu availability'],
  ['customers', 'Customers'], ['locations', 'Locations'], ['team', 'Team'], ['restaurant', 'Restaurant settings'],
  ['brand', 'Brand & storefront'], ['domains', 'Domains'], ['subscription', 'Subscription'], ['builds', 'App builds'],
];
const platformNav = [['overview', 'Overview'], ['restaurants', 'Restaurants'], ['templates', 'Templates'], ['operations', 'Operations'], ['reports', 'Reports'], ['platform-builds', 'App builds'], ['audit', 'Audit log'], ['plans', 'Plans'], ['security', 'Security']];

function shell(content, title, subtitle = '') {
  const nav = state.mode === 'owner' ? ownerNav : platformNav;
  const workspace = state.mode === 'owner' ? (state.restaurant?.name || 'Restaurant owner') : 'Super Admin';
  app.innerHTML = `<div class="shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">V</span><div><strong>Vondo</strong><small>${esc(workspace)}</small></div></div>
      <nav class="nav" aria-label="Main navigation">${nav.map(([key, label]) => `<button data-view="${key}" class="${state.view === key ? 'active' : ''}">${esc(label)}</button>`).join('')}</nav>
      <div class="sidebar-foot"><button class="btn ghost" id="logout">Sign out</button></div>
    </aside>
    <main class="main">${state.ownerBootstrap?.support_impersonation ? `<div class="support-banner" role="status"><strong>Support mode:</strong> ${esc(state.ownerBootstrap.support_impersonation.administrator)} is viewing this restaurant for “${esc(state.ownerBootstrap.support_impersonation.reason)}” until ${date(state.ownerBootstrap.support_impersonation.expires_at)}.<button class="btn small" id="return-platform">Return to Super Admin</button></div>` : ''}<header class="topbar"><div><span class="eyebrow">${state.mode === 'owner' ? 'Restaurant workspace' : 'Platform workspace'}</span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><button class="btn mobile-logout" id="mobile-logout">Sign out</button></header><div id="content">${content}</div></main>
  </div>`;
  document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => navigate(button.dataset.view));
  document.querySelector('#logout').onclick = logout;
  document.querySelector('#mobile-logout').onclick = logout;
  document.querySelector('#return-platform')?.addEventListener('click', () => { clearSession(); state.mode = 'platform'; localStorage.setItem('vondo_admin_mode', 'platform'); state.token = localStorage.getItem(tokenKey()); state.refreshToken = localStorage.getItem(refreshKey()); history.replaceState({}, '', location.pathname); start().catch(error => renderLogin(error.message)); });
}

function loading(title = 'Loading') {
  shell('<div class="loading"><div class="spinner"></div><p>Loading current data…</p></div>', title);
}

function errorState(error, retryView) {
  const label = error.status === 403 ? 'Access denied' : error.status === 404 ? 'Not found' : 'Unable to load';
  const message = error instanceof Error && error.message ? error.message : 'An unexpected browser error occurred.';
  console.error(`[Vondo Admin] ${retryView} failed`, error);
  shell(`<section class="card empty"><h2>${label}</h2><p>${esc(message)}</p><button class="btn primary" id="retry">Try again</button></section>`, label, 'The request could not be completed.');
  document.querySelector('#retry').onclick = () => navigate(retryView);
}

async function start() {
  if (state.mode === 'owner') {
    const [restaurant, bootstrap] = await Promise.all([request('/api/v1/owner/restaurant'), request('/api/v1/owner/bootstrap')]);
    state.restaurant = restaurant.data;
    state.ownerBootstrap = bootstrap.data;
    state.view = 'dashboard';
  } else state.view = 'overview';
  await navigate(state.view);
}

async function navigate(view) {
  state.view = view;
  state.page = 1;
  loading();
  try {
    if (state.mode === 'owner') await ownerView(view);
    else await platformView(view);
  } catch (error) {
    errorState(error, view);
  }
}

async function ownerView(view) {
  if (view === 'dashboard') return renderOwnerDashboard((await request('/api/v1/owner/dashboard')).data);
  if (view === 'orders') return loadOrders();
  if (view === 'reservations') return loadReservations();
  if (view === 'menus') return loadMenus();
  if (view === 'customers') return loadCustomers();
  if (view === 'locations') return renderLocations((await request('/api/v1/owner/locations')).data);
  if (view === 'team') {
    const [members, access] = await Promise.all([request('/api/v1/owner/team'), request('/api/v1/owner/team-access')]);
    return renderTeamAccess(members.data, access.data, access.meta.available_permissions);
  }
  if (view === 'restaurant') return renderRestaurant();
  if (view === 'brand') return renderBrand((await request('/api/v1/owner/brand-revisions')).data);
  if (view === 'domains') return renderDomains();
  if (view === 'subscription') return renderSubscription();
  if (view === 'builds') return renderBuilds((await request('/api/v1/owner/app-builds')).data);
}

function metric(label, value, note = '') {
  return `<article class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></article>`;
}

function renderOwnerDashboard(data) {
  const onboarding = state.ownerBootstrap.onboarding;
  const completed = onboarding.checks.filter(item => item.complete).length;
  shell(`<div class="metrics">${metric('Sales today', money(data.sales_today))}${metric('Orders today', data.orders_today)}${metric('Waiting orders', data.orders_waiting)}${metric('Reservations today', data.reservations_today)}${metric('Customers', data.customers)}${metric('Menu items', data.menu_items)}</div>
    <div class="grid section-gap"><section class="card span-8"><div class="section-head"><div><h2>Getting ready</h2><p>${completed} of ${onboarding.checks.length} setup tasks complete</p></div><span class="progress-label">${Math.round(completed / onboarding.checks.length * 100)}%</span></div><div class="progress"><span style="width:${completed / onboarding.checks.length * 100}%"></span></div><div class="checklist">${onboarding.checks.map(item => `<div class="check ${item.complete ? 'done' : ''}"><span>${item.complete ? '✓' : '○'}</span>${esc(item.label)}</div>`).join('')}</div></section>
    <aside class="card span-4"><h2>Quick actions</h2><div class="quick-actions"><button class="btn primary" data-go="orders">Manage orders</button><button class="btn" data-go="brand">Edit storefront</button><button class="btn" data-go="team">Add team member</button></div></aside></div>`, 'Good service starts here', `Live operations for ${state.restaurant.name}.`);
  document.querySelectorAll('[data-go]').forEach(button => button.onclick = () => navigate(button.dataset.go));
}

function filterBar(id, fields) {
  return `<form id="${id}" class="filter-bar">${fields}<button class="btn primary">Apply filters</button><button type="button" class="btn" data-reset>Reset</button></form>`;
}

function pager(meta, loader) {
  if (!meta || meta.last_page <= 1) return '';
  setTimeout(() => document.querySelectorAll('[data-page]').forEach(button => button.onclick = () => loader(Number(button.dataset.page))), 0);
  return `<div class="pager"><button class="btn" data-page="${meta.page - 1}" ${meta.page <= 1 ? 'disabled' : ''}>Previous</button><span>Page ${meta.page} of ${meta.last_page} · ${meta.total} results</span><button class="btn" data-page="${meta.page + 1}" ${meta.page >= meta.last_page ? 'disabled' : ''}>Next</button></div>`;
}

function statusOptions(statuses, selected) {
  return (Array.isArray(statuses) ? statuses : []).map(status => `<option value="${status.id}" ${Number(status.id) === Number(selected) ? 'selected' : ''}>${esc(status.name)}</option>`).join('');
}

async function loadOrders(page = 1) {
  const form = document.querySelector('#orders-filter');
  const values = form ? Object.fromEntries(new FormData(form)) : {};
  const result = await request(`/api/v1/owner/orders?${qs({...values, page, limit: 25})}`);
  const locations = Array.isArray(state.ownerBootstrap?.locations) ? state.ownerBootstrap.locations : [];
  const orders = Array.isArray(result?.data) ? result.data : [];
  const locationOptions = locations.map(item => `<option value="${item.id}">${esc(item.name)}</option>`).join('');
  shell(`${filterBar('orders-filter', `<input name="search" aria-label="Search orders" placeholder="Order, customer or email" value="${esc(values.search)}"><select name="location_id" aria-label="Location"><option value="">All locations</option>${locationOptions}</select><select name="status_id" aria-label="Status"><option value="">All statuses</option>${statusOptions(state.ownerBootstrap.order_statuses, values.status_id)}</select>`)}
    <section class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Order</th><th>Customer</th><th>Location</th><th>Schedule</th><th>Total</th><th>Status</th></tr></thead><tbody>${orders.map(order => `<tr><td><strong>${esc(order.number)}</strong><small>${esc(order.type || '')} · ${Number(order.items_count || 0)} items</small></td><td>${esc(order.customer_name)}<small>${esc(order.customer_phone || '')}</small></td><td>${esc(order.location_name || '—')}</td><td>${date(order.scheduled_for)}</td><td>${money(order.total)}</td><td><select data-order-status="${order.id}">${statusOptions(state.ownerBootstrap.order_statuses, order.status_id)}</select></td></tr>`).join('') || emptyRow(6, 'No orders match these filters.')}</tbody></table></div>${pager(result.meta, loadOrders)}</section>`, 'Orders', 'Search and update orders across every restaurant location.');
  wireFilters('orders-filter', () => loadOrders(1));
  document.querySelectorAll('[data-order-status]').forEach(select => select.onchange = async () => {
    try { await request(`/api/v1/owner/orders/${select.dataset.orderStatus}/status`, {method: 'PATCH', body: {status_id: Number(select.value), notify: true}}); notify('Order status updated.'); } catch (error) { notify(error.message, 'error'); await loadOrders(page); }
  });
}

async function loadReservations(page = 1) {
  const form = document.querySelector('#reservations-filter');
  const values = form ? Object.fromEntries(new FormData(form)) : {};
  const result = await request(`/api/v1/owner/reservations?${qs({...values, page, limit: 25})}`);
  shell(`${filterBar('reservations-filter', `<input name="search" aria-label="Search reservations" placeholder="Guest, email or phone" value="${esc(values.search)}"><input name="from_date" type="date" aria-label="From date" value="${esc(values.from_date)}"><input name="to_date" type="date" aria-label="To date" value="${esc(values.to_date)}"><select name="status_id" aria-label="Status"><option value="">All statuses</option>${statusOptions(state.ownerBootstrap.reservation_statuses, values.status_id)}</select>`)}
    <section class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Guest</th><th>When</th><th>Location</th><th>Guests</th><th>Phone</th><th>Status</th></tr></thead><tbody>${result.data.map(item => `<tr><td><strong>${esc(item.guest_name)}</strong></td><td>${esc(item.date)}<small>${esc(item.time)}</small></td><td>${esc(item.location_name || '—')}</td><td>${item.guests}</td><td>${esc(item.telephone || '—')}</td><td><select data-reservation-status="${item.id}">${statusOptions(state.ownerBootstrap.reservation_statuses, item.status_id)}</select></td></tr>`).join('') || emptyRow(6, 'No reservations match these filters.')}</tbody></table></div>${pager(result.meta, loadReservations)}</section>`, 'Reservations', 'Manage guest bookings and confirmation status.');
  wireFilters('reservations-filter', () => loadReservations(1));
  document.querySelectorAll('[data-reservation-status]').forEach(select => select.onchange = async () => {
    try { await request(`/api/v1/owner/reservations/${select.dataset.reservationStatus}/status`, {method: 'PATCH', body: {status_id: Number(select.value), notify: true}}); notify('Reservation status updated.'); } catch (error) { notify(error.message, 'error'); await loadReservations(page); }
  });
}

async function loadMenus(page = 1) {
  const form = document.querySelector('#menus-filter');
  const values = form ? Object.fromEntries(new FormData(form)) : {};
  const result = await request(`/api/v1/owner/menus?${qs({...values, page, limit: 25})}`);
  const categories = state.ownerBootstrap.categories || [];
  shell(`<div class="section-actions"><button class="btn" id="manage-categories">Manage categories</button><button class="btn primary" id="create-menu">Add menu item</button></div>${filterBar('menus-filter', `<input name="search" aria-label="Search menu" placeholder="Search menu items" value="${esc(values.search)}">`)}
    <section class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Item</th><th>Categories</th><th>Description</th><th>Price</th><th>Available</th><th></th></tr></thead><tbody>${result.data.map(item => `<tr><td><strong>${esc(item.name)}</strong></td><td>${item.category_ids.map(id => esc(categories.find(category => category.id === id)?.name || '—')).join(', ')}</td><td class="truncate">${esc(item.description || '—')}</td><td>${money(item.price)}</td><td><label class="switch"><input type="checkbox" data-menu="${item.id}" ${item.is_available ? 'checked' : ''}><span></span><em>${item.is_available ? 'Available' : 'Unavailable'}</em></label></td><td><button class="btn small" data-edit-menu="${item.id}">Edit</button></td></tr>`).join('') || emptyRow(6, 'No menu items found.')}</tbody></table></div>${pager(result.meta, loadMenus)}</section>`, 'Menu management', 'Create dishes, organize categories, update prices, and control availability.');
  wireFilters('menus-filter', () => loadMenus(1));
  document.querySelector('#create-menu').onclick = () => showMenuEditor();
  document.querySelector('#manage-categories').onclick = showCategoryManager;
  document.querySelectorAll('[data-edit-menu]').forEach(button => button.onclick = () => showMenuEditor(result.data.find(item => item.id === Number(button.dataset.editMenu))));
  document.querySelectorAll('[data-menu]').forEach(input => input.onchange = async () => {
    try { await request(`/api/v1/owner/menus/${input.dataset.menu}`, {method: 'PATCH', body: {is_available: input.checked}}); input.nextElementSibling.nextElementSibling.textContent = input.checked ? 'Available' : 'Unavailable'; notify('Menu availability saved.'); } catch (error) { input.checked = !input.checked; notify(error.message, 'error'); }
  });
}

function menuForm(item = {}) {
  const categories = state.ownerBootstrap.categories || [];
  return `<form id="menu-editor-form" class="form-grid"><div class="field full"><label>Name</label><input name="name" value="${esc(item.name)}" required maxlength="128"></div><div class="field full"><label>Description</label><textarea name="description" rows="4" maxlength="4000">${esc(item.description)}</textarea></div><div class="field"><label>Price</label><input name="price" type="number" min="0" step="0.01" value="${esc(item.price ?? 0)}" required></div><label class="check-control"><input name="is_available" type="checkbox" ${item.id === undefined || item.is_available ? 'checked' : ''}> Available</label><fieldset class="field full"><legend>Categories</legend>${categories.map(category => `<label class="check-control"><input type="checkbox" name="category_ids" value="${category.id}" ${item.category_ids?.includes(category.id) || (!item.id && category.is_active) ? 'checked' : ''}> ${esc(category.name)}</label>`).join('') || '<p>Create a category first.</p>'}</fieldset><button class="btn primary full" ${categories.length ? '' : 'disabled'}>${item.id ? 'Save menu item' : 'Create menu item'}</button></form>`;
}

function showMenuEditor(item) {
  openDialog(item ? 'Edit menu item' : 'Add menu item', menuForm(item));
  document.querySelector('#menu-editor-form').onsubmit = async event => {
    event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    data.price = Number(data.price); data.is_available = form.is_available.checked;
    data.category_ids = [...form.querySelectorAll('[name="category_ids"]:checked')].map(input => Number(input.value));
    try { await request(item ? `/api/v1/owner/menus/${item.id}` : '/api/v1/owner/menus', {method: item ? 'PATCH' : 'POST', body: data}); closeDialog(); notify(item ? 'Menu item updated.' : 'Menu item created.'); await refreshRestaurant(); await loadMenus(); } catch (error) { notify(error.message, 'error'); }
  };
}

function showCategoryManager() {
  const categories = state.ownerBootstrap.categories || [];
  openDialog('Menu categories', `<div class="list compact">${categories.map(category => `<div class="list-row"><div><strong>${esc(category.name)}</strong><small>${category.is_active ? 'Active' : 'Disabled'}</small></div><button class="btn small" data-edit-category="${category.id}">Edit</button></div>`).join('') || '<p class="empty">No categories.</p>'}</div><hr><form id="category-form" class="form-grid"><div class="field full"><label>New category name</label><input name="name" required maxlength="128"></div><div class="field full"><label>Description</label><textarea name="description" rows="2"></textarea></div><label class="check-control full"><input name="is_active" type="checkbox" checked> Active</label><button class="btn primary full">Create category</button></form>`);
  document.querySelector('#category-form').onsubmit = async event => { event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)); data.is_active = form.is_active.checked; try { await request('/api/v1/owner/categories', {method: 'POST', body: data}); closeDialog(); await refreshRestaurant(); notify('Category created.'); await loadMenus(); } catch (error) { notify(error.message, 'error'); } };
  document.querySelectorAll('[data-edit-category]').forEach(button => button.onclick = () => showCategoryEditor(categories.find(category => category.id === Number(button.dataset.editCategory))));
}

function showCategoryEditor(category) {
  openDialog('Edit category', `<form id="category-edit-form" class="form-grid"><div class="field full"><label>Name</label><input name="name" value="${esc(category.name)}" required maxlength="128"></div><div class="field full"><label>Description</label><textarea name="description" rows="3">${esc(category.description)}</textarea></div><label class="check-control full"><input name="is_active" type="checkbox" ${category.is_active ? 'checked' : ''}> Active</label><button class="btn primary full">Save category</button></form>`);
  document.querySelector('#category-edit-form').onsubmit = async event => { event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)); data.is_active = form.is_active.checked; try { await request(`/api/v1/owner/categories/${category.id}`, {method: 'PATCH', body: data}); closeDialog(); await refreshRestaurant(); notify('Category updated.'); await loadMenus(); } catch (error) { notify(error.message, 'error'); } };
}

async function loadCustomers(page = 1) {
  const form = document.querySelector('#customers-filter');
  const values = form ? Object.fromEntries(new FormData(form)) : {};
  const result = await request(`/api/v1/owner/customers?${qs({...values, page, limit: 25})}`);
  shell(`${filterBar('customers-filter', `<input name="search" aria-label="Search customers" placeholder="Name or email" value="${esc(values.search)}">`)}
    <section class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Customer</th><th>Email</th><th>Telephone</th><th>Status</th><th>Joined</th></tr></thead><tbody>${result.data.map(item => `<tr><td><strong>${esc(item.name)}</strong></td><td>${esc(item.email)}</td><td>${esc(item.telephone || '—')}</td><td><span class="pill ${item.status ? 'active' : 'archived'}">${item.status ? 'Active' : 'Disabled'}</span></td><td>${date(item.created_at)}</td></tr>`).join('') || emptyRow(5, 'No customers found.')}</tbody></table></div>${pager(result.meta, loadCustomers)}</section>`, 'Customers', 'Tenant-scoped customer directory.');
  wireFilters('customers-filter', () => loadCustomers(1));
}

function wireFilters(id, loader) {
  const form = document.querySelector(`#${id}`);
  form.onsubmit = event => { event.preventDefault(); loader(); };
  form.querySelector('[data-reset]').onclick = () => { form.reset(); loader(); };
}

function emptyRow(columns, message) { return `<tr><td colspan="${columns}" class="empty-cell">${esc(message)}</td></tr>`; }

function renderLocations(locations) {
  shell(`<div class="grid"><section class="card span-8"><div class="section-head"><div><h2>Restaurant locations</h2><p>${locations.length} configured locations</p></div></div><div class="list">${locations.map(item => `<article class="list-row"><div><strong>${esc(item.name)}</strong><small>${esc([item.address, item.city, item.postcode].filter(Boolean).join(', ') || 'Address not set')}</small><small>${esc(item.email)} · ${esc(item.telephone || 'No phone')}</small></div><div><span class="pill ${item.is_active ? 'active' : 'archived'}">${item.is_active ? 'Active' : 'Disabled'}</span>${item.is_default ? '<span class="pill">Default</span>' : ''}<button class="btn" data-edit-location="${item.id}">Edit</button></div></article>`).join('') || '<p class="empty">No locations.</p>'}</div></section>
    <aside class="card span-4"><h2>Add location</h2>${locationForm()}</aside></div>`, 'Locations', 'Manage branches inside this restaurant tenant.');
  document.querySelector('#location-form').onsubmit = createLocation;
  document.querySelectorAll('[data-edit-location]').forEach(button => button.onclick = () => editLocation(locations.find(item => item.id === Number(button.dataset.editLocation))));
}

function locationForm(item = {}) {
  return `<form id="location-form" class="form-grid"><div class="field full"><label>Name</label><input name="location_name" value="${esc(item.name)}" required></div><div class="field full"><label>Email</label><input name="location_email" type="email" value="${esc(item.email)}" required></div><div class="field full"><label>Telephone</label><input name="location_telephone" value="${esc(item.telephone)}"></div><div class="field full"><label>Address</label><input name="location_address_1" value="${esc(item.address)}"></div><div class="field"><label>City</label><input name="location_city" value="${esc(item.city)}"></div><div class="field"><label>Postcode</label><input name="location_postcode" value="${esc(item.postcode)}"></div><label class="check-control full"><input name="location_status" type="checkbox" ${item.id === undefined || item.is_active ? 'checked' : ''}> Active location</label><button class="btn primary full">${item.id ? 'Save location' : 'Add location'}</button></form>`;
}

async function createLocation(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  data.location_status = event.currentTarget.location_status.checked;
  try { await request('/api/v1/owner/locations', {method: 'POST', body: data}); notify('Location created.'); await navigate('locations'); } catch (error) { notify(error.message, 'error'); }
}

function editLocation(item) {
  openDialog('Edit location', locationForm(item));
  const form = document.querySelector('#modal location-form, #modal #location-form');
  const servicesButton = document.createElement('button');
  servicesButton.type = 'button'; servicesButton.className = 'btn full'; servicesButton.textContent = 'Configure services';
  servicesButton.onclick = () => editLocationServices(item);
  form.appendChild(servicesButton);
  form.onsubmit = async event => {
    event.preventDefault(); const data = Object.fromEntries(new FormData(form)); data.location_status = form.location_status.checked;
    try { await request(`/api/v1/owner/locations/${item.id}`, {method: 'PATCH', body: data}); closeDialog(); notify('Location updated.'); await navigate('locations'); } catch (error) { notify(error.message, 'error'); }
  };
}

async function editLocationServices(item) {
  try {
    const settings = (await request(`/api/v1/owner/locations/${item.id}/settings`)).data;
    const toggle = (key, label) => `<label class="check-control full"><input type="checkbox" name="${key}" ${settings[key] !== false ? 'checked' : ''}> ${label}</label>`;
    openDialog(`${item.name} services`, `<form id="location-services-form" class="form-grid"><p class="full">Override restaurant service defaults for this location.</p>${toggle('orders_enabled','Online ordering')}${toggle('collection_enabled','Collection')}${toggle('delivery_enabled','Delivery')}${toggle('reservations_enabled','Reservations')}<button class="btn primary full">Save services</button></form>`);
    document.querySelector('#location-services-form').onsubmit = async event => {
      event.preventDefault(); const form = event.currentTarget; const data = {};
      ['orders_enabled','collection_enabled','delivery_enabled','reservations_enabled'].forEach(key => { data[key] = form.elements[key].checked; });
      try { await request(`/api/v1/owner/locations/${item.id}/settings`, {method:'PUT', body:data}); closeDialog(); notify('Location services saved.'); } catch (error) { notify(error.message, 'error'); }
    };
  } catch (error) { notify(error.message, 'error'); }
}

function renderTeam(members) {
  const locations = state.ownerBootstrap.locations;
  shell(`<div class="grid"><section class="card span-8"><h2>Team members</h2><div class="list">${members.map(member => `<article class="list-row"><div><strong>${esc(member.name || 'Unnamed staff')}</strong><small>${esc(member.email)} · ${esc(member.role)}</small><small>${member.location_ids.length} assigned locations</small></div><div><span class="pill ${member.status === 'active' ? 'active' : 'archived'}">${esc(member.status)}</span>${member.role !== 'owner' ? `<button class="btn" data-team-edit="${member.id}">Manage</button>` : ''}</div></article>`).join('')}</div></section>
    <aside class="card span-4"><h2>Add team member</h2><form id="team-form" class="form-grid"><div class="field full"><label>Name</label><input name="name" required maxlength="80"></div><div class="field full"><label>Email</label><input name="email" type="email" required></div><div class="field full"><label>Temporary password</label><input name="password" type="password" required minlength="10"></div><div class="field full"><label>Role</label><select name="role"><option value="manager">Manager</option><option value="staff">Staff</option></select></div><fieldset class="field full"><legend>Locations</legend>${locations.map(location => `<label class="check-control"><input type="checkbox" name="location_ids" value="${location.id}" checked> ${esc(location.name)}</label>`).join('')}</fieldset><button class="btn primary full">Create staff account</button></form></aside></div>`, 'Team', 'Create accounts and control restaurant/location access.');
  document.querySelector('#team-form').onsubmit = createTeamMember;
  document.querySelectorAll('[data-team-edit]').forEach(button => button.onclick = () => manageTeamMember(members.find(member => member.id === Number(button.dataset.teamEdit))));
}

async function createTeamMember(event) {
  event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
  data.location_ids = [...form.querySelectorAll('[name="location_ids"]:checked')].map(input => Number(input.value));
  try { await request('/api/v1/owner/team', {method: 'POST', body: data}); notify('Team member created.'); await navigate('team'); } catch (error) { notify(error.message, 'error'); }
}

function renderTeamAccess(members, access, permissions) {
  const locations = state.ownerBootstrap.locations;
  const roleOptions = `<option value="base:manager">Manager</option><option value="base:staff">Staff</option>${access.roles.map(role => `<option value="custom:${role.id}">${esc(role.name)}</option>`).join('')}`;
  shell(`<div class="grid"><section class="card span-8"><h2>Team members</h2><div class="list">${members.map(member => `<article class="list-row"><div><strong>${esc(member.name || 'Unnamed staff')}</strong><small>${esc(member.email)} · ${esc(member.custom_role?.name || member.role)}</small><small>${member.location_ids.length} assigned locations</small></div><div><span class="pill ${member.status === 'active' ? 'active' : 'archived'}">${esc(member.status)}</span>${member.role !== 'owner' ? `<button class="btn" data-team-edit="${member.id}">Manage</button>` : ''}</div></article>`).join('')}</div></section>
    <aside class="card span-4"><h2>Invite team member</h2><form id="invite-form" class="form-grid"><div class="field full"><label>Name</label><input name="name" required maxlength="80"></div><div class="field full"><label>Email</label><input name="email" type="email" required></div><div class="field full"><label>Role</label><select name="role_choice">${roleOptions}</select></div><fieldset class="field full"><legend>Locations</legend>${locations.map(location => `<label class="check-control"><input type="checkbox" name="location_ids" value="${location.id}" checked> ${esc(location.name)}</label>`).join('')}</fieldset><button class="btn primary full">Send secure invitation</button></form></aside>
    <section class="card span-6"><h2>Pending invitations</h2><div class="list">${access.invitations.map(invite => `<article class="list-row"><div><strong>${esc(invite.name)}</strong><small>${esc(invite.email)} · ${esc(invite.role?.name || invite.base_role)}</small><small>Expires ${date(invite.expires_at)}</small></div><button class="btn danger" data-cancel-invite="${invite.id}">Cancel</button></article>`).join('') || '<p class="empty">No pending invitations.</p>'}</div></section>
    <section class="card span-6"><h2>Custom permission templates</h2><div class="list">${access.roles.map(role => `<article class="list-row"><div><strong>${esc(role.name)}</strong><small>${esc(role.base_role)} · ${role.permissions.length} permissions</small></div><button class="btn danger" data-delete-role="${role.id}">Delete</button></article>`).join('') || '<p class="empty">No custom roles.</p>'}</div><form id="role-form" class="form-grid"><div class="field"><label>Role name</label><input name="name" required maxlength="80"></div><div class="field"><label>Base access</label><select name="base_role"><option value="staff">Staff</option><option value="manager">Manager</option></select></div><fieldset class="field full"><legend>Permissions</legend>${permissions.map(permission => `<label class="check-control"><input type="checkbox" name="permissions" value="${esc(permission)}"> ${esc(permission)}</label>`).join('')}</fieldset><button class="btn primary">Create role</button></form></section></div>`, 'Team', 'Invite staff, assign locations, and manage reusable permission templates.');
  document.querySelector('#invite-form').onsubmit = createTeamInvitation;
  document.querySelector('#role-form').onsubmit = createTeamRole;
  document.querySelectorAll('[data-team-edit]').forEach(button => button.onclick = () => manageTeamMember(members.find(member => member.id === Number(button.dataset.teamEdit))));
  document.querySelectorAll('[data-cancel-invite]').forEach(button => button.onclick = async () => { try { await request(`/api/v1/owner/team-access/invitations/${button.dataset.cancelInvite}`, {method: 'DELETE'}); notify('Invitation cancelled.'); await navigate('team'); } catch (error) { notify(error.message, 'error'); } });
  document.querySelectorAll('[data-delete-role]').forEach(button => button.onclick = async () => { try { await request(`/api/v1/owner/team-access/roles/${button.dataset.deleteRole}`, {method: 'DELETE'}); notify('Role deleted.'); await navigate('team'); } catch (error) { notify(error.message, 'error'); } });
}

async function createTeamInvitation(event) {
  event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
  data.location_ids = [...form.querySelectorAll('[name="location_ids"]:checked')].map(input => Number(input.value));
  const [kind, value] = data.role_choice.split(':'); delete data.role_choice;
  if (kind === 'custom') data.restaurant_role_id = Number(value); else data.base_role = value;
  try { await request('/api/v1/owner/team-access/invitations', {method: 'POST', body: data}); notify('Invitation sent.'); await navigate('team'); } catch (error) { notify(error.message, 'error'); }
}

async function createTeamRole(event) {
  event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
  data.permissions = [...form.querySelectorAll('[name="permissions"]:checked')].map(input => input.value);
  try { await request('/api/v1/owner/team-access/roles', {method: 'POST', body: data}); notify('Custom role created.'); await navigate('team'); } catch (error) { notify(error.message, 'error'); }
}

function manageTeamMember(member) {
  const locations = state.ownerBootstrap.locations;
  openDialog('Manage team member', `<form id="team-edit-form" class="form-grid"><p class="full"><strong>${esc(member.name)}</strong><br><small>${esc(member.email)}</small></p><div class="field"><label>Role</label><select name="role"><option value="manager" ${member.role === 'manager' ? 'selected' : ''}>Manager</option><option value="staff" ${member.role === 'staff' ? 'selected' : ''}>Staff</option></select></div><div class="field"><label>Status</label><select name="status"><option value="active" ${member.status === 'active' ? 'selected' : ''}>Active</option><option value="disabled" ${member.status === 'disabled' ? 'selected' : ''}>Disabled</option></select></div><fieldset class="field full"><legend>Locations</legend>${locations.map(location => `<label class="check-control"><input type="checkbox" name="location_ids" value="${location.id}" ${member.location_ids.map(Number).includes(location.id) ? 'checked' : ''}> ${esc(location.name)}</label>`).join('')}</fieldset><button class="btn primary full">Save access</button></form>`);
  document.querySelector('#team-edit-form').onsubmit = async event => {
    event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)); data.location_ids = [...form.querySelectorAll('[name="location_ids"]:checked')].map(input => Number(input.value));
    try { await request(`/api/v1/owner/team/${member.id}`, {method: 'PATCH', body: data}); closeDialog(); notify('Team access updated.'); await navigate('team'); } catch (error) { notify(error.message, 'error'); }
  };
}

function renderRestaurant() {
  const r = state.restaurant;
  shell(`<div class="grid"><section class="card span-8"><h2>Restaurant profile</h2><form id="settings" class="form-grid"><div class="field full"><label>Name</label><input name="name" value="${esc(r.name)}" required maxlength="80"></div><div class="field"><label>Timezone</label><input name="timezone" value="${esc(r.timezone)}" required></div><div class="field"><label>Currency</label><input name="currency_code" value="${esc(r.currency_code)}" required minlength="3" maxlength="3"></div><button class="btn primary">Save settings</button></form></section><aside class="card span-4"><h2>Account</h2><dl class="details"><div><dt>Status</dt><dd><span class="pill ${esc(r.status)}">${esc(r.status)}</span></dd></div><div><dt>Store code</dt><dd>${esc(r.slug)}</dd></div><div><dt>Team</dt><dd>${r.members.length}</dd></div></dl></aside></div>`, 'Restaurant settings', 'Core identity and regional configuration.');
  document.querySelector('#settings').onsubmit = async event => { event.preventDefault(); try { state.restaurant = (await request('/api/v1/owner/restaurant', {method: 'PATCH', body: Object.fromEntries(new FormData(event.currentTarget))})).data; notify('Restaurant settings saved.'); renderRestaurant(); } catch (error) { notify(error.message, 'error'); } };
}

const sectionTypes = [['hero', 'Hero'], ['categories', 'Categories'], ['featured_dishes', 'Featured dishes'], ['reservation_cta', 'Reservation call-to-action'], ['about', 'About'], ['locations', 'Locations'], ['gallery', 'Gallery'], ['contact', 'Contact'], ['custom_text', 'Custom text']];
function renderBrand(revisions) {
  const latest = revisions[0]; const config = latest?.configuration || {}; const identity = config.identity || {}; const theme = config.theme || {}; const content = config.content || {}; const sections = config.sections || [];
  const navigation = config.navigation?.length ? config.navigation : [{label:'Home',href:'#/'},{label:'Menu',href:'#/menu'},{label:'Reserve Table',href:'#/reservations'},{label:'Locations',href:'#/locations'}];
  shell(`<div class="grid"><section class="card span-8"><div class="section-head"><div><h2>Theme and storefront</h2><p>Save a draft, review the preview, then publish it.</p></div><a class="btn" href="/" target="_blank" rel="noopener">Open storefront</a></div><form id="brand-form" class="form-grid brand-form">
    <h3 class="full">Identity</h3><div class="field"><label>Public name</label><input name="identity.name" value="${esc(identity.name || state.restaurant.name)}" required></div><div class="field"><label>Tagline</label><input name="identity.tagline" value="${esc(identity.tagline)}" maxlength="160"></div><div class="field full"><label>Logo URL</label><div class="inline"><input id="logo-url" name="identity.logo_url" type="url" value="${esc(identity.logo_url)}"><label class="btn upload">Upload logo<input id="logo-file" type="file" accept="image/jpeg,image/png,image/webp"></label></div></div>
    <h3 class="full">Colors and shape</h3>${['primary', 'secondary', 'accent', 'background', 'surface', 'text'].map(key => `<div class="field color-field"><label>${key[0].toUpperCase() + key.slice(1)}</label><input name="theme.${key}" type="color" value="${esc(theme[key] || ({primary:'#c95028',secondary:'#29231f',accent:'#f6a623',background:'#fffaf6',surface:'#ffffff',text:'#29231f'}[key]))}"></div>`).join('')}<div class="field"><label>Corner radius: <output id="radius-value">${Number(theme.radius ?? 16)}px</output></label><input id="radius" name="theme.radius" type="range" min="0" max="32" value="${Number(theme.radius ?? 16)}"></div>
    <h3 class="full">Homepage copy</h3><div class="field full"><label>Hero title</label><input name="content.hero_title" value="${esc(content.hero_title)}" maxlength="120" required></div><div class="field full"><label>Hero description</label><textarea name="content.hero_subtitle" rows="3" maxlength="300">${esc(content.hero_subtitle)}</textarea></div><div class="field full"><label>Hero image URL</label><input name="content.hero_image_url" type="url" value="${esc(content.hero_image_url)}"></div><div class="field full"><label>Footer text</label><input name="content.footer_text" value="${esc(content.footer_text)}" maxlength="240"></div>
    <h3 class="full">Navigation</h3>${navigation.map((item, index) => `<div class="field"><label>Link ${index + 1} label</label><input name="navigation.${index}.label" value="${esc(item.label)}" maxlength="40" required><input type="hidden" name="navigation.${index}.href" value="${esc(item.href)}"></div>`).join('')}
    <h3 class="full">Homepage sections</h3><div class="section-editor full">${sectionTypes.map(([type, label], index) => { const existing = sections.find(item => item.type === type); return `<div class="section-control"><label class="check-control"><input type="checkbox" data-section-visible="${type}" ${existing?.visible ? 'checked' : ''}> ${esc(label)}</label><label>Position <input type="number" data-section-position="${type}" min="0" max="1000" value="${existing?.position ?? (index + 1) * 10}"></label></div>`; }).join('')}</div>
    <div class="actions full"><button class="btn primary">Save draft</button></div></form></section>
    <aside class="span-4 stack"><section class="card"><h2>Live draft preview</h2><div id="brand-preview" class="brand-preview"><small>Preview</small><h3></h3><p></p><button>Order online</button></div></section><section class="card"><h2>Revision history</h2><div class="list compact">${revisions.map(revision => `<div class="list-row"><div><strong>Version ${revision.version}</strong><small>${revision.published_at ? `Published ${date(revision.published_at)}` : 'Draft'}</small></div><div><button class="btn small" data-publish="${revision.id}">Publish</button><button class="btn small" data-rollback="${revision.id}">Restore</button></div></div>`).join('') || '<p class="empty">No revisions.</p>'}</div></section></aside></div>`, 'Brand & storefront', 'Control the shared appearance of web and mobile experiences.');
  const form = document.querySelector('#brand-form');
  const updatePreview = () => { const values = Object.fromEntries(new FormData(form)); const preview = document.querySelector('#brand-preview'); preview.style.setProperty('--preview-primary', values['theme.primary']); preview.style.setProperty('--preview-bg', values['theme.background']); preview.style.setProperty('--preview-text', values['theme.text']); preview.style.borderRadius = `${values['theme.radius']}px`; preview.querySelector('h3').textContent = values['content.hero_title']; preview.querySelector('p').textContent = values['content.hero_subtitle']; };
  form.oninput = updatePreview; updatePreview();
  document.querySelector('#radius').oninput = event => { document.querySelector('#radius-value').textContent = `${event.target.value}px`; updatePreview(); };
  document.querySelector('#logo-file').onchange = uploadLogo;
  form.onsubmit = event => saveBrand(event, revisions);
  document.querySelectorAll('[data-publish]').forEach(button => button.onclick = () => brandAction(button.dataset.publish, 'publish'));
  document.querySelectorAll('[data-rollback]').forEach(button => button.onclick = () => brandAction(button.dataset.rollback, 'rollback'));
}

function brandPayload(form, revisions) {
  const values = Object.fromEntries(new FormData(form)); const current = revisions[0]?.configuration || {};
  const navigation = Object.keys(values).filter(key => key.startsWith('navigation.') && key.endsWith('.label')).map(key => {
    const index = key.split('.')[1]; return {label: values[key], href: values[`navigation.${index}.href`]};
  });
  return {identity: {name: values['identity.name'], tagline: values['identity.tagline'], logo_url: values['identity.logo_url'] || null}, theme: {primary: values['theme.primary'], secondary: values['theme.secondary'], accent: values['theme.accent'], background: values['theme.background'], surface: values['theme.surface'], text: values['theme.text'], radius: Number(values['theme.radius'])}, content: {hero_title: values['content.hero_title'], hero_subtitle: values['content.hero_subtitle'], hero_image_url: values['content.hero_image_url'] || null, footer_text: values['content.footer_text']}, navigation, sections: sectionTypes.map(([type], index) => ({id: current.sections?.find(item => item.type === type)?.id || type.replace('_dishes', ''), type, visible: form.querySelector(`[data-section-visible="${type}"]`).checked, position: Number(form.querySelector(`[data-section-position="${type}"]`).value || (index + 1) * 10) }))};
}

async function saveBrand(event, revisions) { event.preventDefault(); try { await request('/api/v1/owner/brand-revisions', {method: 'POST', body: brandPayload(event.currentTarget, revisions)}); notify('Draft revision created.'); await navigate('brand'); } catch (error) { notify(error.message, 'error'); } }
async function brandAction(id, action) { if (action === 'rollback' && !confirm('Restore and publish this earlier version?')) return; try { await request(`/api/v1/owner/brand-revisions/${id}/${action}`, {method: 'POST', body: {}}); notify(action === 'publish' ? 'Brand published.' : 'Earlier version restored.'); await navigate('brand'); } catch (error) { notify(error.message, 'error'); } }
async function uploadLogo(event) { const file = event.target.files[0]; if (!file) return; const form = new FormData(); form.append('image', file); try { const result = await request('/api/v1/owner/media', {method: 'POST', body: form, form: true}); document.querySelector('#logo-url').value = new URL(result.data.url, location.origin).href; notify('Logo uploaded. Save the draft to use it.'); } catch (error) { notify(error.message, 'error'); } }

function renderDomains() {
  const domains = state.restaurant.domains;
  shell(`<div class="grid"><section class="card span-8"><h2>Connected domains</h2><div class="list">${domains.map(domain => `<article class="list-row"><div><strong>${esc(domain.host)}</strong><small>${domain.verified_at ? 'Domain verified' : `DNS TXT: ${esc(domain.verification?.name || '')}`}</small>${domain.verification ? `<code>${esc(domain.verification.value)}</code>` : ''}</div><div><span class="pill ${domain.verified_at ? 'active' : 'trial'}">${domain.verified_at ? 'Verified' : 'Pending'}</span>${domain.is_primary ? '<span class="pill">Primary</span>' : `<button class="btn danger" data-delete-domain="${domain.id}">Remove</button>`}</div></article>`).join('')}</div></section><aside class="card span-4"><h2>Add custom domain</h2><form id="domain-form" class="form-grid"><div class="field full"><label>Domain</label><input name="host" placeholder="orders.example.com" required></div><button class="btn primary">Add domain</button></form></aside></div>`, 'Domains', 'Connect custom storefront domains using DNS ownership verification.');
  document.querySelector('#domain-form').onsubmit = async event => { event.preventDefault(); try { await request('/api/v1/owner/domains', {method: 'POST', body: Object.fromEntries(new FormData(event.currentTarget))}); await refreshRestaurant(); notify('Domain added.'); renderDomains(); } catch (error) { notify(error.message, 'error'); } };
  document.querySelectorAll('[data-delete-domain]').forEach(button => button.onclick = async () => { if (!confirm('Remove this domain?')) return; try { await request(`/api/v1/owner/domains/${button.dataset.deleteDomain}`, {method: 'DELETE'}); await refreshRestaurant(); renderDomains(); } catch (error) { notify(error.message, 'error'); } });
}

function renderSubscription() {
  const subscription = state.ownerBootstrap.subscription;
  shell(subscription ? `<div class="grid"><section class="card span-8 plan-card"><span class="pill active">${esc(subscription.status)}</span><h2>${esc(subscription.plan?.name || 'Custom plan')}</h2><p class="plan-price">${money((subscription.plan?.price_minor || 0) / 100, subscription.plan?.currency_code || 'USD')}<small>/month</small></p><h3>Included features</h3><div class="feature-grid">${(subscription.plan?.features || []).map(feature => `<div class="check done"><span>✓</span>${esc(String(feature).replaceAll('_', ' '))}</div>`).join('')}</div></section><aside class="card span-4"><h2>Billing period</h2><dl class="details"><div><dt>Status</dt><dd>${esc(subscription.status)}</dd></div><div><dt>Trial ends</dt><dd>${date(subscription.trial_ends_at)}</dd></div><div><dt>Renews/ends</dt><dd>${date(subscription.current_period_ends_at)}</dd></div></dl><p class="muted">Contact the platform administrator to change plans.</p></aside></div>` : '<section class="card empty"><h2>No subscription assigned</h2><p>Ask the platform administrator to assign a plan.</p></section>', 'Subscription', 'Current plan, billing state, and included platform features.');
}

function renderBuilds(builds) {
  shell(`<div class="grid"><section class="card span-8"><h2>Build requests</h2><div class="list">${builds.map(build => `<article class="list-row"><div><strong>${esc(build.configuration.app_name)} · ${esc(build.platform)}</strong><small>${esc(build.configuration.bundle_id)} · ${esc(build.status)} · ${build.attempts} attempts</small>${build.failure_message ? `<small class="danger-text">${esc(build.failure_message)}</small>` : ''}</div><div>${['failed', 'cancelled'].includes(build.status) ? `<button class="btn" data-build-action="retry" data-build-id="${build.id}">Retry</button>` : ''}${['queued', 'preparing', 'configuration_ready'].includes(build.status) ? `<button class="btn danger" data-build-action="cancel" data-build-id="${build.id}">Cancel</button>` : ''}</div></article>`).join('') || '<p class="empty">No app build requests yet.</p>'}</div></section><aside class="card span-4"><h2>Request white-label app</h2><form id="build-form" class="form-grid"><div class="field full"><label>Platform</label><select name="platform"><option value="android">Android</option><option value="ios">iOS</option></select></div><div class="field full"><label>App name</label><input name="app_name" required maxlength="30"></div><div class="field full"><label>Bundle ID</label><input name="bundle_id" placeholder="com.company.restaurant" required></div><div class="field full"><label>Icon URL (optional)</label><input name="icon_url" type="url"></div><div class="field full"><label>Splash URL (optional)</label><input name="splash_url" type="url"></div><button class="btn primary">Queue build</button></form></aside></div>`, 'App builds', 'Prepare and track restaurant-specific mobile build configurations.');
  document.querySelector('#build-form').onsubmit = async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); Object.keys(data).forEach(key => data[key] === '' && delete data[key]); try { await request('/api/v1/owner/app-builds', {method: 'POST', body: data, idempotent: true}); notify('Build request queued.'); await navigate('builds'); } catch (error) { notify(error.message, 'error'); } };
  document.querySelectorAll('[data-build-action]').forEach(button => button.onclick = async () => { try { await request(`/api/v1/owner/app-builds/${button.dataset.buildId}/${button.dataset.buildAction}`, {method: 'POST', body: {}}); await navigate('builds'); } catch (error) { notify(error.message, 'error'); } });
}

async function refreshRestaurant() { state.restaurant = (await request('/api/v1/owner/restaurant')).data; state.ownerBootstrap = (await request('/api/v1/owner/bootstrap')).data; }

async function platformView(view) {
  if (view === 'overview') return renderPlatformOverview((await request('/api/v1/platform/overview')).data);
  if (view === 'restaurants') return loadRestaurants();
  if (view === 'reports') return loadReports();
  if (view === 'restaurant-detail') return loadRestaurantDetail(state.selectedRestaurant);
  if (view === 'platform-builds') return loadPlatformBuilds();
  if (view === 'audit') return loadAudit();
  if (view === 'plans') return renderPlans((await request('/api/v1/platform/subscription-plans')).data);
  if (view === 'templates') return loadTemplates();
  if (view === 'operations') return loadOperations();
  if (view === 'security') return renderPlatformSecurity((await request('/api/v1/platform/security/mfa')).data);
}

function renderPlatformSecurity(mfa) {
  shell(`<div class="grid"><section class="card span-7"><h2>Multi-factor authentication</h2><p>${mfa.enabled ? `Enabled since ${date(mfa.confirmed_at)}. ${mfa.recovery_codes_remaining} recovery codes remain.` : 'Protect privileged platform access with a TOTP authenticator.'}</p><div class="section-actions">${mfa.enabled ? '<button class="btn danger" id="disable-mfa">Disable MFA</button>' : '<button class="btn primary" id="setup-mfa">Set up MFA</button>'}</div></section></div>`, 'Security', 'Stronger authentication for cross-tenant platform operations.');
  document.querySelector('#setup-mfa')?.addEventListener('click', async () => {
    try {
      const setup = (await request('/api/v1/platform/security/mfa/setup', {method: 'POST', body: {}})).data;
      openDialog('Set up authenticator', `<p>Add this manual key to your authenticator:</p><p><code>${esc(setup.secret)}</code></p><p>Save these one-time recovery codes:</p><pre>${esc(setup.recovery_codes.join('\n'))}</pre><form id="confirm-mfa" class="form-grid"><div class="field full"><label>Six-digit code</label><input name="code" inputmode="numeric" pattern="[0-9]{6}" required></div><button class="btn primary full">Enable MFA</button></form>`);
      document.querySelector('#confirm-mfa').onsubmit = async event => { event.preventDefault(); try { await request('/api/v1/platform/security/mfa/confirm', {method: 'POST', body: Object.fromEntries(new FormData(event.currentTarget))}); closeDialog(); notify('MFA enabled.'); await navigate('security'); } catch (error) { notify(error.message, 'error'); } };
    } catch (error) { notify(error.message, 'error'); }
  });
  document.querySelector('#disable-mfa')?.addEventListener('click', () => {
    openDialog('Disable MFA', '<form id="disable-mfa-form" class="form-grid"><div class="field full"><label>Password</label><input name="password" type="password" required></div><div class="field full"><label>Authenticator or recovery code</label><input name="code" required maxlength="32"></div><button class="btn danger full">Disable MFA</button></form>');
    document.querySelector('#disable-mfa-form').onsubmit = async event => { event.preventDefault(); try { await request('/api/v1/platform/security/mfa', {method: 'DELETE', body: Object.fromEntries(new FormData(event.currentTarget))}); closeDialog(); notify('MFA disabled.'); await navigate('security'); } catch (error) { notify(error.message, 'error'); } };
  });
}

async function loadReports() {
  const form = document.querySelector('#reports-filter');
  const values = form ? Object.fromEntries(new FormData(form)) : {
    from: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  };
  const result = await request(`/api/v1/platform/reports?${qs(values)}`);
  const totals = result.data.reduce((sum, row) => ({
    orders: sum.orders + row.orders, revenue: sum.revenue + row.revenue,
    reservations: sum.reservations + row.reservations, restaurants: sum.restaurants + row.new_restaurants,
  }), {orders: 0, revenue: 0, reservations: 0, restaurants: 0});
  shell(`<form id="reports-filter" class="filter-bar"><input name="from" type="date" aria-label="From date" value="${esc(values.from)}" required><input name="to" type="date" aria-label="To date" value="${esc(values.to)}" required><button class="btn primary">Run report</button><button class="btn" type="button" id="export-report">Export CSV</button></form>
    <div class="metrics">${metric('Orders', totals.orders)}${metric('Revenue', money(totals.revenue))}${metric('Reservations', totals.reservations)}${metric('New restaurants', totals.restaurants)}</div>
    <section class="card table-card section-gap"><div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Orders</th><th>Revenue</th><th>Reservations</th><th>New restaurants</th></tr></thead><tbody>${result.data.map(row => `<tr><td>${esc(row.date)}</td><td>${row.orders}</td><td>${money(row.revenue)}</td><td>${row.reservations}</td><td>${row.new_restaurants}</td></tr>`).join('') || emptyRow(5, 'No report data.')}</tbody></table></div></section>`, 'Platform reports', 'Tenant-safe daily activity with a bounded CSV export.');
  document.querySelector('#reports-filter').onsubmit = event => { event.preventDefault(); loadReports(); };
  document.querySelector('#export-report').onclick = async () => {
    const headers = {Accept: 'text/csv', Authorization: `Bearer ${state.token}`};
    try {
      const response = await fetch(`/api/v1/platform/reports/export?${qs(values)}`, {headers});
      if (!response.ok) throw new Error('The report export could not be generated.');
      const blob = await response.blob(); const link = document.createElement('a');
      link.href = URL.createObjectURL(blob); link.download = `vondo-report-${values.from}-${values.to}.csv`; link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 0);
    } catch (error) { notify(error.message, 'error'); }
  };
}

function renderPlatformOverview(data) {
  shell(`<div class="metrics">${metric('Restaurants', data.restaurants)}${metric('Active', data.active_restaurants)}${metric('Trials', data.trial_restaurants)}${metric('Suspended', data.suspended_restaurants)}${metric('Customers', data.customers)}${metric('Orders', data.orders)}</div><div class="grid section-gap"><section class="card span-8"><h2>Platform health</h2><div class="health-grid"><div><span class="health-dot good"></span><strong>API and database</strong><small>Responding</small></div><div><span class="health-dot ${data.builds_waiting ? 'warn' : 'good'}"></span><strong>Build queue</strong><small>${data.builds_waiting} waiting</small></div><div><span class="health-dot ${data.suspended_restaurants ? 'warn' : 'good'}"></span><strong>Restaurant access</strong><small>${data.suspended_restaurants} suspended</small></div></div></section><aside class="card span-4"><h2>Quick actions</h2><div class="quick-actions"><button class="btn primary" data-go="restaurants">Create restaurant</button><button class="btn" data-go="audit">Review audit log</button><button class="btn" data-go="platform-builds">Check builds</button></div></aside></div>`, 'Platform overview', 'Tenant health and activity across Vondo.');
  document.querySelectorAll('[data-go]').forEach(button => button.onclick = () => navigate(button.dataset.go));
}

async function loadRestaurants(page = 1) {
  const form = document.querySelector('#restaurants-filter'); const values = form ? Object.fromEntries(new FormData(form)) : {};
  const result = await request(`/api/v1/platform/restaurants?${qs({...values, page, limit: 25})}`);
  shell(`<div class="section-actions"><button class="btn primary" id="create-restaurant">Create restaurant & owner</button></div>${filterBar('restaurants-filter', `<input name="search" aria-label="Search restaurants" placeholder="Name or store code" value="${esc(values.search)}"><select name="status" aria-label="Status"><option value="">All statuses</option>${['draft','trial','active','suspended','archived'].map(status => `<option value="${status}" ${values.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select>`)}<section class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Restaurant</th><th>Status</th><th>Members</th><th>Domains</th><th>Created</th><th></th></tr></thead><tbody>${result.data.map(item => `<tr><td><strong>${esc(item.name)}</strong><small>${esc(item.slug)}</small></td><td><span class="pill ${esc(item.status)}">${esc(item.status)}</span></td><td>${item.memberships_count}</td><td>${item.domains_count}</td><td>${date(item.created_at)}</td><td><button class="btn" data-restaurant="${item.id}">Manage</button></td></tr>`).join('') || emptyRow(6, 'No restaurants match these filters.')}</tbody></table></div>${pager(result.meta, loadRestaurants)}</section>`, 'Restaurants', 'Provision owners and manage each tenant lifecycle.');
  wireFilters('restaurants-filter', () => loadRestaurants(1));
  document.querySelector('#create-restaurant').onclick = showCreateRestaurant;
  document.querySelectorAll('[data-restaurant]').forEach(button => button.onclick = () => { state.selectedRestaurant = button.dataset.restaurant; navigate('restaurant-detail'); });
}

function showCreateRestaurant() {
  openDialog('Create restaurant & owner', `<form id="create-restaurant-form" class="form-grid"><div class="field"><label>Restaurant name</label><input name="restaurant_name" required maxlength="80"></div><div class="field"><label>Owner name</label><input name="owner_name" required maxlength="80"></div><div class="field full"><label>Owner email</label><input name="email" type="email" required></div><div class="field"><label>Temporary password</label><input name="password" type="password" minlength="10" required></div><div class="field"><label>Confirm password</label><input name="password_confirmation" type="password" minlength="10" required></div><div class="field"><label>Timezone</label><input name="timezone" value="Africa/Casablanca" required></div><div class="field"><label>Currency</label><input name="currency_code" value="MAD" minlength="3" maxlength="3" required></div><button class="btn primary full">Create tenant</button></form>`);
  document.querySelector('#create-restaurant-form').onsubmit = async event => { event.preventDefault(); try { const result = await request('/api/v1/platform/restaurants', {method: 'POST', body: Object.fromEntries(new FormData(event.currentTarget))}); closeDialog(); notify('Restaurant and owner created.'); state.selectedRestaurant = result.data.id; await navigate('restaurant-detail'); } catch (error) { notify(error.message, 'error'); } };
}

async function loadRestaurantDetail(id) {
  const restaurant = (await request(`/api/v1/platform/restaurants/${id}`)).data;
  const plans = (await request('/api/v1/platform/subscription-plans')).data;
  const featureDefaults = ['online_ordering', 'reservations', 'custom_domain', 'customer_app', 'vendor_app', 'white_label_builds'];
  const features = [...new Set([...featureDefaults, ...restaurant.features.map(item => item.key)])];
  shell(`<div class="section-actions"><button class="btn back" id="back-restaurants">← All restaurants</button><button class="btn primary" id="start-support">Open audited support session</button></div><div class="metrics">${metric('Locations', restaurant.usage.locations)}${metric('Menu items', restaurant.usage.menus)}${metric('Customers', restaurant.usage.customers)}${metric('Orders', restaurant.usage.orders)}${metric('Reservations', restaurant.usage.reservations)}</div><div class="grid section-gap">
    <section class="card span-8"><div class="section-head"><div><h2>${esc(restaurant.name)}</h2><p>${esc(restaurant.slug)} · ${esc(restaurant.currency_code)} · ${esc(restaurant.timezone)}</p></div><span class="pill ${esc(restaurant.status)}">${esc(restaurant.status)}</span></div><form id="status-form" class="form-grid"><div class="field"><label>Lifecycle status</label><select name="status">${['draft','trial','active','suspended','archived'].map(status => `<option value="${status}" ${restaurant.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></div><div class="field"><label>Reason</label><input name="reason" required maxlength="500" placeholder="Required for audit"></div><button class="btn primary">Update status</button></form></section>
    <aside class="card span-4"><h2>Subscription</h2><form id="subscription-form" class="form-grid"><div class="field full"><label>Plan</label><select name="plan_id" required><option value="">Select plan</option>${plans.map(plan => `<option value="${plan.id}" ${restaurant.subscription?.plan?.id === plan.id ? 'selected' : ''}>${esc(plan.name)}</option>`).join('')}</select></div><div class="field full"><label>Status</label><select name="status"><option value="trial">Trial</option><option value="active" ${restaurant.subscription?.status === 'active' ? 'selected' : ''}>Active</option><option value="past_due">Past due</option><option value="cancelled">Cancelled</option></select></div><div class="field full"><label>Period end</label><input name="current_period_ends_at" type="date" value="${esc((restaurant.subscription?.current_period_ends_at || '').slice(0,10))}"></div><div class="field full"><label>Reason</label><input name="reason" required placeholder="Required for audit"></div><button class="btn primary">Assign plan</button></form></aside>
    <section class="card span-6"><h2>Domains</h2><div class="list">${restaurant.domains.map(domain => `<div class="list-row"><div><strong>${esc(domain.host)}</strong><small>${domain.is_primary ? 'Primary' : 'Custom'} domain</small></div><button class="btn ${domain.verified_at ? 'danger' : 'primary'}" data-domain="${domain.id}" data-verified="${domain.verified_at ? '1' : '0'}">${domain.verified_at ? 'Unverify' : 'Verify'}</button></div>`).join('') || '<p class="empty">No domains.</p>'}</div></section>
    <section class="card span-6"><h2>Features</h2><div class="list">${features.map(key => { const item = restaurant.features.find(feature => feature.key === key); return `<div class="list-row"><div><strong>${esc(key.replaceAll('_',' '))}</strong><small>${item?.enabled ? 'Enabled' : 'Disabled'}</small></div><label class="switch"><input type="checkbox" data-feature="${esc(key)}" ${item?.enabled ? 'checked' : ''}><span></span></label></div>`; }).join('')}</div></section>
    <section class="card span-12"><h2>Team members</h2><div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead><tbody>${restaurant.members.map(member => `<tr><td>${esc(member.name || '—')}</td><td>${esc(member.email || '—')}</td><td>${esc(member.role)}</td><td><span class="pill ${member.status === 'active' ? 'active' : 'archived'}">${esc(member.status)}</span></td></tr>`).join('') || emptyRow(4, 'No members.')}</tbody></table></div></section></div>`, restaurant.name, 'Tenant detail, access, usage, features, domains, and subscription.');
  document.querySelector('#back-restaurants').onclick = () => navigate('restaurants');
  document.querySelector('#start-support').onclick = () => openSupportSession(id, restaurant.name);
  document.querySelector('#status-form').onsubmit = async event => { event.preventDefault(); try { await request(`/api/v1/platform/restaurants/${id}/status`, {method: 'PATCH', body: Object.fromEntries(new FormData(event.currentTarget))}); notify('Restaurant status updated.'); await loadRestaurantDetail(id); } catch (error) { notify(error.message, 'error'); } };
  document.querySelector('#subscription-form').onsubmit = async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); if (!data.current_period_ends_at) delete data.current_period_ends_at; data.plan_id = Number(data.plan_id); try { await request(`/api/v1/platform/restaurants/${id}/subscription`, {method: 'PUT', body: data}); notify('Subscription updated.'); await loadRestaurantDetail(id); } catch (error) { notify(error.message, 'error'); } };
  document.querySelectorAll('[data-domain]').forEach(button => button.onclick = async () => { const verified = button.dataset.verified !== '1'; const reason = prompt(`Reason to ${verified ? 'verify' : 'unverify'} this domain:`); if (!reason) return; try { await request(`/api/v1/platform/restaurants/${id}/domains/${button.dataset.domain}/verification`, {method: 'PATCH', body: {verified, reason}}); notify('Domain verification updated.'); await loadRestaurantDetail(id); } catch (error) { notify(error.message, 'error'); } });
  document.querySelectorAll('[data-feature]').forEach(input => input.onchange = async () => { const reason = prompt(`Reason to ${input.checked ? 'enable' : 'disable'} ${input.dataset.feature}:`); if (!reason) { input.checked = !input.checked; return; } try { await request(`/api/v1/platform/restaurants/${id}/features/${input.dataset.feature}`, {method: 'PUT', body: {enabled: input.checked, reason}}); notify('Feature updated.'); } catch (error) { input.checked = !input.checked; notify(error.message, 'error'); } });
}

async function loadPlatformBuilds(page = 1) {
  const result = await request(`/api/v1/platform/app-builds?${qs({page, limit: 30})}`);
  shell(`<section class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Restaurant</th><th>Platform</th><th>Status</th><th>Attempts</th><th>Failure</th><th>Requested</th><th></th></tr></thead><tbody>${result.data.map(item => `<tr><td><strong>${esc(item.restaurant.name)}</strong></td><td>${esc(item.platform)}</td><td><span class="pill ${esc(item.status)}">${esc(item.status)}</span></td><td>${item.attempts}</td><td>${esc(item.failure_message || '—')}</td><td>${date(item.created_at)}</td><td><button class="btn small" data-build-detail="${item.id}">Details</button>${['failed','cancelled'].includes(item.status) ? `<button class="btn small" data-platform-build-action="retry" data-build-id="${item.id}">Retry</button>` : ''}${['queued','preparing','configuration_ready'].includes(item.status) ? `<button class="btn danger small" data-platform-build-action="cancel" data-build-id="${item.id}">Cancel</button>` : ''}</td></tr>`).join('') || emptyRow(7, 'No app builds.')}</tbody></table></div>${pager(result.meta, loadPlatformBuilds)}</section>`, 'App builds', 'Cross-tenant build queue, logs, artifacts, retries, and cancellation.');
  document.querySelectorAll('[data-build-detail]').forEach(button => button.onclick = async () => {
    try {
      const build = (await request(`/api/v1/platform/app-builds/${button.dataset.buildDetail}`)).data;
      openDialog('Build history', `<p><strong>${esc(build.restaurant.name)} · ${esc(build.platform)} · ${esc(build.status)}</strong></p><h3>Events</h3><div class="list compact">${build.events.map(event => `<div class="list-row"><div><strong>${esc(event.event)}</strong><small>${esc(event.message)} · ${date(event.created_at)}</small></div></div>`).join('') || '<p>No events.</p>'}</div><h3>Artifacts</h3><div class="list compact">${build.artifacts.map(artifact => `<div class="list-row"><div><strong>${esc(artifact.kind)}</strong><small>${artifact.size_bytes} bytes · SHA-256 ${esc(artifact.sha256)} · expires ${date(artifact.expires_at)}</small></div></div>`).join('') || '<p>No artifacts.</p>'}</div>`);
    } catch (error) { notify(error.message, 'error'); }
  });
  document.querySelectorAll('[data-platform-build-action]').forEach(button => button.onclick = async () => {
    const reason = prompt(`Reason to ${button.dataset.platformBuildAction} this build:`); if (!reason) return;
    try { await request(`/api/v1/platform/app-builds/${button.dataset.buildId}/${button.dataset.platformBuildAction}`, {method: 'POST', body: {reason}}); notify('Build updated.'); await loadPlatformBuilds(page); } catch (error) { notify(error.message, 'error'); }
  });
}

async function loadAudit(page = 1) {
  const result = await request(`/api/v1/platform/audit-logs?${qs({page, limit: 40})}`);
  shell(`<section class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Restaurant ID</th><th>Subject</th><th>Details</th></tr></thead><tbody>${result.data.map(item => `<tr><td>${date(item.created_at)}</td><td>${esc(item.actor_type)} #${esc(item.actor_id || '—')}</td><td><strong>${esc(item.action)}</strong></td><td>${esc(item.restaurant_id || 'Platform')}</td><td>${esc(item.subject_type || '—')} ${esc(item.subject_id || '')}</td><td><code>${esc(JSON.stringify(item.metadata || {}))}</code></td></tr>`).join('') || emptyRow(6, 'No audited activity yet.')}</tbody></table></div>${pager(result.meta, loadAudit)}</section>`, 'Audit log', 'Recorded owner and Super Admin changes across tenants.');
}

function renderPlans(plans) {
  shell(`<div class="grid"><section class="card span-8"><h2>Subscription plans</h2><div class="list">${plans.map(plan => `<article class="list-row"><div><strong>${esc(plan.name)}</strong><small>${esc(plan.code)} · ${money(plan.price_minor / 100, plan.currency_code)}/month · ${plan.features.length} features</small></div><div><span class="pill ${plan.active ? 'active' : 'archived'}">${plan.active ? 'Active' : 'Hidden'}</span></div></article>`).join('') || '<p class="empty">No plans configured.</p>'}</div></section><aside class="card span-4"><h2>Create plan</h2><form id="plan-form" class="form-grid"><div class="field full"><label>Name</label><input name="name" required></div><div class="field"><label>Code</label><input name="code" required pattern="[A-Za-z0-9_-]+"></div><div class="field"><label>Price (minor units)</label><input name="price_minor" type="number" min="0" value="0" required></div><div class="field"><label>Currency</label><input name="currency_code" value="USD" minlength="3" maxlength="3" required></div><div class="field full"><label>Features (comma separated)</label><textarea name="features" rows="3" placeholder="online_ordering, reservations"></textarea></div><label class="check-control full"><input name="active" type="checkbox" checked> Active plan</label><button class="btn primary">Create plan</button></form></aside></div>`, 'Plans', 'Define reusable subscription packages for restaurants.');
  document.querySelector('#plan-form').onsubmit = async event => { event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)); data.price_minor = Number(data.price_minor); data.features = data.features.split(',').map(value => value.trim()).filter(Boolean); data.active = form.active.checked; try { await request('/api/v1/platform/subscription-plans', {method: 'POST', body: data}); notify('Plan created.'); await navigate('plans'); } catch (error) { notify(error.message, 'error'); } };
}

function openSupportSession(restaurantId, restaurantName) {
  openDialog('Open audited support session', `<p>You will enter ${esc(restaurantName)} as an owner. A visible banner and permanent audit trail protect the tenant.</p><form id="support-form" class="form-grid"><div class="field full"><label>Reason</label><textarea name="reason" required minlength="10" maxlength="500"></textarea></div><div class="field full"><label>Duration</label><select name="duration_minutes"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option></select></div><button class="btn primary full">Start support session</button></form>`);
  document.querySelector('#support-form').onsubmit = async event => {
    event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); body.duration_minutes = Number(body.duration_minutes);
    try {
      const created = (await request(`/api/v1/platform/restaurants/${restaurantId}/support-sessions`, {method: 'POST', body})).data;
      const response = await fetch('/api/v1/owner/support-session/exchange', {method: 'POST', headers: {Accept: 'application/json', 'Content-Type': 'application/json', 'X-Vondo-Restaurant': restaurantId}, body: JSON.stringify({exchange_token: created.exchange_token})});
      const session = await response.json(); if (!response.ok) throw new Error(session.message || 'Support session could not be exchanged.');
      localStorage.setItem(`vondo:${location.host}:owner:admin_token`, session.token); localStorage.removeItem(`vondo:${location.host}:owner:admin_refresh_token`);
      localStorage.setItem('vondo_admin_mode', 'owner'); location.assign(`${location.pathname}?restaurant=${encodeURIComponent(restaurantId)}&support=1`);
    } catch (error) { notify(error.message, 'error'); }
  };
}

async function loadTemplates() {
  const templates = (await request('/api/v1/platform/templates')).data;
  const defaultConfig = JSON.stringify(templates[0]?.configuration || {}, null, 2);
  shell(`<div class="grid"><section class="card span-7"><h2>Restaurant templates</h2><div class="list">${templates.map(item => `<article class="list-row"><div><strong>${esc(item.name)}</strong><small>${esc(item.code)} · version ${item.version}</small><small>${esc(item.description || '')}</small></div><div><span class="pill ${item.is_default ? 'active' : 'archived'}">${item.is_default ? 'Default' : item.active ? 'Active' : 'Hidden'}</span><button class="btn small" data-edit-template="${item.id}">Edit</button></div></article>`).join('') || '<p class="empty">No templates configured.</p>'}</div></section><aside class="card span-5"><h2>Create template</h2><form id="template-form" class="form-grid"><div class="field"><label>Name</label><input name="name" required maxlength="120"></div><div class="field"><label>Code</label><input name="code" required pattern="[A-Za-z0-9_-]+"></div><div class="field full"><label>Description</label><textarea name="description" maxlength="1000"></textarea></div><div class="field full"><label>Brand configuration (JSON)</label><textarea name="configuration" rows="12" required>${esc(defaultConfig)}</textarea></div><label class="check-control"><input name="active" type="checkbox" checked> Active</label><label class="check-control"><input name="is_default" type="checkbox"> Default</label><button class="btn primary full">Create template</button></form></aside></div>`, 'Platform templates', 'Versioned defaults applied atomically to newly provisioned restaurants.');
  document.querySelector('#template-form').onsubmit = async event => { event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)); try { data.configuration = JSON.parse(data.configuration); data.active = form.active.checked; data.is_default = form.is_default.checked; await request('/api/v1/platform/templates', {method: 'POST', body: data}); notify('Template created.'); await loadTemplates(); } catch (error) { notify(error.message, 'error'); } };
  document.querySelectorAll('[data-edit-template]').forEach(button => button.onclick = () => editTemplate(templates.find(item => item.id === button.dataset.editTemplate)));
}

function editTemplate(item) {
  openDialog('Edit template', `<form id="edit-template-form" class="form-grid"><div class="field full"><label>Name</label><input name="name" value="${esc(item.name)}" required></div><div class="field full"><label>Description</label><textarea name="description">${esc(item.description || '')}</textarea></div><div class="field full"><label>Configuration (JSON)</label><textarea name="configuration" rows="14" required>${esc(JSON.stringify(item.configuration, null, 2))}</textarea></div><label class="check-control"><input name="active" type="checkbox" ${item.active ? 'checked' : ''}> Active</label><label class="check-control"><input name="is_default" type="checkbox" ${item.is_default ? 'checked' : ''}> Default</label><button class="btn primary full">Save version</button></form>`);
  document.querySelector('#edit-template-form').onsubmit = async event => { event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)); try { data.configuration = JSON.parse(data.configuration); data.active = form.active.checked; data.is_default = form.is_default.checked; await request(`/api/v1/platform/templates/${item.id}`, {method: 'PUT', body: data}); closeDialog(); notify('Template updated.'); await loadTemplates(); } catch (error) { notify(error.message, 'error'); } };
}

async function loadOperations(page = 1) {
  const [health, alerts] = await Promise.all([request('/api/v1/platform/health'), request(`/api/v1/platform/alerts?${qs({status: 'open', page, limit: 30})}`)]);
  shell(`<section class="card"><div class="section-head"><div><h2>Dependency health</h2><p>Last checked ${date(health.data.checked_at)}</p></div><span class="pill ${health.data.status === 'healthy' ? 'active' : 'suspended'}">${esc(health.data.status)}</span></div><div class="health-grid">${Object.entries(health.data.checks).map(([name, check]) => `<div><span class="health-dot ${check.ok ? 'good' : 'warn'}"></span><strong>${esc(name.replaceAll('_', ' '))}</strong><small>${check.ok ? `${check.latency_ms ?? 0} ms` : esc(check.error || `${check.stalled || check.failed_last_hour || 0} issue(s)`)}</small></div>`).join('')}</div></section><section class="card table-card section-gap"><div class="section-head"><div><h2>Open alerts</h2><p>Jobs, tenant health, domains, payments, storage, storefront, and builds.</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Severity</th><th>Type</th><th>Restaurant</th><th>Message</th><th>Last seen</th><th></th></tr></thead><tbody>${alerts.data.map(item => `<tr><td><span class="pill ${item.severity === 'critical' ? 'suspended' : 'trial'}">${esc(item.severity)}</span></td><td>${esc(item.type)}</td><td>${esc(item.restaurant?.name || 'Platform')}</td><td>${esc(item.message)}</td><td>${date(item.last_seen_at)}</td><td><button class="btn small" data-ack-alert="${item.id}">Acknowledge</button></td></tr>`).join('') || emptyRow(6, 'No open operational alerts.')}</tbody></table></div>${pager(alerts.meta, loadOperations)}</section>`, 'Platform operations', 'Live health probes and actionable cross-tenant alerts.');
  document.querySelectorAll('[data-ack-alert]').forEach(button => button.onclick = async () => { const reason = prompt('Acknowledgement note:'); if (!reason) return; try { await request(`/api/v1/platform/alerts/${button.dataset.ackAlert}/acknowledge`, {method: 'POST', body: {reason}}); await loadOperations(page); } catch (error) { notify(error.message, 'error'); } });
}

function openDialog(title, content) {
  let modal = document.querySelector('#modal');
  if (!modal) { modal = document.createElement('dialog'); modal.id = 'modal'; document.body.append(modal); }
  modal.innerHTML = `<div class="dialog-head"><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="Close">×</button></div>${content}`;
  modal.querySelector('[data-close]').onclick = closeDialog;
  modal.oncancel = event => { event.preventDefault(); closeDialog(); };
  modal.showModal();
}
function closeDialog() { document.querySelector('#modal')?.close(); }

handleOwnerAccountAction().then(handled => {
  if (handled) return;
  if (state.token) start().catch(error => { clearSession(); renderLogin(error.message); }); else renderLogin();
});

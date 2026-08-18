import { api } from './api.js';
import { tenant } from './tenant.js';

function sessionId() {
  const key = `vondo:${tenant.restaurant.id}:analytics_session`;
  let value = sessionStorage.getItem(key);
  if (!value) {
    value = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
    sessionStorage.setItem(key, value);
  }
  return value;
}

export const analytics = {
  track(event, properties = {}) {
    return api.request('/v1/storefront/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId(), event,
        path: window.location.hash.slice(1) || '/', properties,
      }),
    }).catch(() => null);
  },
};

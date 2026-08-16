import { api } from './api.js';
import { cart } from './store.js';

const fallback = {
  restaurant: { id: 'default', name: 'Restaurant', slug: 'default' },
  brand: {
    identity: { name: 'Restaurant', tagline: 'Made fresh for your table', logo_url: null },
    theme: { primary: '#c95028', secondary: '#29231f', accent: '#f6a623', background: '#1c1a17', surface: '#27231e', text: '#fffaf1', radius: 16 },
    content: { hero_title: 'Restaurant-quality food, on your schedule.', hero_subtitle: 'Order freshly prepared favourites or reserve a table.', hero_image_url: null, footer_text: 'All rights reserved.' },
    navigation: [{label: 'Home', href: '#/'}, {label: 'Menu', href: '#/menu'}, {label: 'Reserve Table', href: '#/reservations'}, {label: 'Locations', href: '#/locations'}],
    sections: [],
  },
  currency: { code: 'USD', symbol: '$', decimal_position: 2 },
  defaults: {},
};

export const tenant = { ...fallback };

export async function initializeTenant() {
  const payload = await api.getStorefrontConfig();
  Object.assign(tenant, payload);
  api.setTenant(payload.restaurant.id);
  cart.setTenant(payload.restaurant.id);
  applyTheme(payload.brand.theme);
  document.title = payload.brand.identity.name;
  return tenant;
}

function applyTheme(theme = {}) {
  const background = normalizeHex(theme.background, '#fffaf6');
  const surface = normalizeHex(theme.surface, '#ffffff');
  const primary = normalizeHex(theme.primary, '#c95028');
  const secondary = normalizeHex(theme.secondary, '#29231f');
  const accent = normalizeHex(theme.accent, '#f6a623');
  const text = normalizeHex(theme.text, '#29231f');
  const lightBackground = luminance(background) > 0.45;
  const root = document.documentElement.style;
  root.setProperty('--brand-primary', primary);
  root.setProperty('--brand-secondary', secondary);
  root.setProperty('--brand-accent', accent);
  root.setProperty('--on-brand', contrastColor(primary));
  root.setProperty('--accent-orange', primary);
  root.setProperty('--accent-amber', primary);
  root.setProperty('--accent-gold', lightBackground ? mixHex(primary, '#000000', 0.78) : accent);
  root.setProperty('--accent-amber-glow', hexToRgba(primary, lightBackground ? 0.12 : 0.22));
  root.setProperty('--bg-primary', background);
  root.setProperty('--bg-secondary', mixHex(primary, background, lightBackground ? 0.055 : 0.12));
  root.setProperty('--bg-tertiary', mixHex(primary, surface, lightBackground ? 0.1 : 0.2));
  root.setProperty('--bg-card', surface);
  root.setProperty('--bg-card-hover', mixHex(primary, surface, lightBackground ? 0.06 : 0.14));
  root.setProperty('--bg-glass', hexToRgba(background, 0.92));
  root.setProperty('--text-primary', text);
  root.setProperty('--text-secondary', mixHex(text, background, lightBackground ? 0.72 : 0.78));
  root.setProperty('--text-muted', mixHex(text, background, lightBackground ? 0.52 : 0.58));
  root.setProperty('--border-subtle', hexToRgba(text, lightBackground ? 0.12 : 0.16));
  root.setProperty('--border-glow', hexToRgba(primary, lightBackground ? 0.32 : 0.4));
  root.setProperty('--footer-bg', secondary);
  root.setProperty('--footer-text', contrastColor(secondary));
  root.setProperty('--radius-md', `${theme.radius}px`);
  root.setProperty('--radius-lg', `${Math.min(Number(theme.radius) + 8, 40)}px`);
}

function normalizeHex(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
}

function toRgb(hex) {
  const value = normalizeHex(hex, '#000000').slice(1);
  return [0, 2, 4].map(offset => parseInt(value.slice(offset, offset + 2), 16));
}

function mixHex(foreground, background, weight) {
  const fg = toRgb(foreground);
  const bg = toRgb(background);
  const channel = index => Math.round(fg[index] * weight + bg[index] * (1 - weight)).toString(16).padStart(2, '0');
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

function hexToRgba(hex, alpha) {
  const [red, green, blue] = toRgb(hex);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function luminance(hex) {
  const channels = toRgb(hex).map(value => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastColor(background) {
  return luminance(background) > 0.42 ? '#211a16' : '#ffffff';
}

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

export function safeImageUrl(value, fallbackUrl = '') {
  if (!value) return fallbackUrl;
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? escapeHtml(url.href) : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
}

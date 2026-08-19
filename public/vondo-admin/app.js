/**
 * Vondo Control Center - React & Material UI (MUI)
 * Complete implementation for Restaurant Owner, Vendor / Staff, and Super Admin Platform.
 */

// Grab React and Material UI from global scope
const { createElement: h, useState, useEffect, useCallback, useMemo, useRef } = window.React || {};
const MUI = window.MaterialUI || {};

const {
  ThemeProvider, createTheme, CssBaseline,
  Box, Container, Grid, Paper, Typography, Button, IconButton,
  TextField, FormControl, FormControlLabel, FormGroup, InputLabel, Select, MenuItem, Checkbox, Switch, Slider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Card, CardHeader, CardContent, CardActions,
  AppBar, Toolbar, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Snackbar, Alert, Chip, Avatar, Tooltip, CircularProgress, LinearProgress, Tab, Tabs, Stack
} = MUI;

// Define Vondo Brand Theme for MUI
const theme = createTheme({
  palette: {
    primary: {
      main: '#b84f2e',
      dark: '#86351f',
      light: '#d96c4b',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#29221e',
      dark: '#1c1714',
      light: '#403631',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fffaf4',
      paper: '#ffffff',
    },
    text: {
      primary: '#27211d',
      secondary: '#746a62',
    },
    success: {
      main: '#2e7d32',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ed6c02',
    },
  },
  typography: {
    fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { color: '#746a62' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(67, 45, 31, 0.06)',
          border: '1px solid #eadfd4',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
  },
});

// Helper utilities
const esc = (value = '') => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const money = (value, currency = 'USD') => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value || 0));
const date = value => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parsed);
};
const qs = values => new URLSearchParams(Object.entries(values).filter(([, v]) => v !== '' && v !== null && v !== undefined)).toString();

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

// Icon component using Google Material Icons font
function Icon({ name, sx = {}, color }) {
  return h('span', {
    className: 'material-icons',
    style: {
      fontSize: 20,
      verticalAlign: 'middle',
      color: color || 'inherit',
      ...sx
    }
  }, name);
}

// Navigation structures preserved for contracts and features
const ownerNavItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'orders', label: 'Orders', icon: 'receipt_long', endpoint: '/api/v1/owner/orders' },
  { key: 'reservations', label: 'Reservations', icon: 'event_seat' },
  { key: 'menus', label: 'Menu availability', icon: 'restaurant_menu', endpoint: '/api/v1/owner/menus' },
  { key: 'customers', label: 'Customers', icon: 'people' },
  { key: 'locations', label: 'Locations', icon: 'storefront' },
  { key: 'team', label: 'Team', icon: 'badge', endpoint: '/api/v1/owner/team' },
  { key: 'payments', label: 'Payment settings', icon: 'payments' },
  { key: 'restaurant', label: 'Restaurant settings', icon: 'settings' },
  { key: 'brand', label: 'Brand & storefront', icon: 'palette' },
  { key: 'pages', label: 'Pages', icon: 'article' },
  { key: 'media', label: 'Media gallery', icon: 'photo_library' },
  { key: 'domains', label: 'Domains', icon: 'language' },
  { key: 'subscription', label: 'Subscription', icon: 'credit_card' },
  { key: 'builds', label: 'App builds', icon: 'smartphone' },
];

const vendorNavItems = [
  { key: 'vendor-dashboard', label: 'Vendor Dashboard', icon: 'storefront' },
  { key: 'vendor-orders', label: 'Live Orders', icon: 'receipt_long' },
  { key: 'vendor-reservations', label: 'Reservations', icon: 'event_seat' },
  { key: 'vendor-menus', label: 'Menu & Stock', icon: 'restaurant_menu' },
];

const platformNavItems = [
  { key: 'overview', label: 'Overview', icon: 'insights' },
  { key: 'restaurants', label: 'Restaurants', icon: 'store' },
  { key: 'templates', label: 'Templates', icon: 'content_copy' },
  { key: 'operations', label: 'Operations', icon: 'health_and_safety' },
  { key: 'reports', label: 'Reports', icon: 'bar_chart' },
  { key: 'platform-builds', label: 'App builds', icon: 'build_circle' },
  { key: 'audit', label: 'Audit log', icon: 'history' },
  { key: 'plans', label: 'Plans', icon: 'loyalty' },
  { key: 'security', label: 'Security', icon: 'security' },
];

function getViewFromHash(currentMode) {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (!hash) return null;
  const validKeys = (currentMode === 'owner' ? ownerNavItems : currentMode === 'vendor' ? vendorNavItems : platformNavItems).map(i => i.key);
  if (currentMode === 'platform') validKeys.push('restaurant-detail');
  return validKeys.includes(hash) ? hash : null;
}

// Main React App Component
function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('vondo_admin_mode') || 'owner');
  const tokenKey = useCallback((m = mode) => `vondo:${window.location.host}:${m}:admin_token`, [mode]);
  const refreshKey = useCallback((m = mode) => `vondo:${window.location.host}:${m}:admin_refresh_token`, [mode]);

  const [token, setToken] = useState(() => localStorage.getItem(tokenKey()));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(refreshKey()));
  const [restaurantHint, setRestaurantHint] = useState(() => new URLSearchParams(window.location.search).get('restaurant'));

  const [currentView, setCurrentView] = useState(() => (
    getViewFromHash(mode) || (mode === 'owner' ? 'dashboard' : mode === 'vendor' ? 'vendor-dashboard' : 'overview')
  ));
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Synchronize active view with URL hash
  useEffect(() => {
    const targetHash = `#/${currentView}`;
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash);
    }
  }, [currentView]);

  // Listen to browser Back / Forward and URL hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hashView = getViewFromHash(mode);
      if (hashView && hashView !== currentView) {
        setViewData(null);
        setCurrentView(hashView);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [mode, currentView]);

  // Vendor Specific State
  const [vendorBootstrap, setVendorBootstrap] = useState(null);
  const [vendorLocationId, setVendorLocationId] = useState(null);

  // Global State
  const [restaurant, setRestaurant] = useState(null);
  const [ownerBootstrap, setOwnerBootstrap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Toast / Notification State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const notify = useCallback((message, severity = 'info') => {
    setToast({ open: true, message, severity: severity === 'error' ? 'error' : severity === 'success' ? 'success' : 'info' });
  }, []);

  // Auth & Account Flow States
  const [authAction, setAuthAction] = useState(null); // 'login', 'register', 'forgot-password', 'reset-password', 'resend-verification', 'accept-invite'
  const [authMessage, setAuthMessage] = useState('');
  const [urlToken, setUrlToken] = useState('');
  const [invitationId, setInvitationId] = useState('');

  // Save / Clear Session Helpers
  const saveSession = useCallback((session, explicitMode = mode) => {
    setToken(session.token);
    localStorage.setItem(tokenKey(explicitMode), session.token);
    if (session.refresh_token) {
      setRefreshToken(session.refresh_token);
      localStorage.setItem(refreshKey(explicitMode), session.refresh_token);
    } else {
      setRefreshToken(null);
      localStorage.removeItem(refreshKey(explicitMode));
    }
  }, [mode, tokenKey, refreshKey]);

  const clearSession = useCallback((explicitMode = mode) => {
    localStorage.removeItem(tokenKey(explicitMode));
    localStorage.removeItem(refreshKey(explicitMode));
    setToken(null);
    setRefreshToken(null);
    setRestaurant(null);
    setOwnerBootstrap(null);
    setVendorBootstrap(null);
    setSelectedRestaurant(null);
    setViewData(null);
  }, [mode, tokenKey, refreshKey]);

  // Request Handler with Token Injection and Auto-Refresh
  const request = useCallback(async (path, { method = 'GET', body, form = false, idempotent = false, retried = false } = {}) => {
    const headers = { Accept: 'application/json' };
    const currentToken = localStorage.getItem(tokenKey());
    if (currentToken) headers.Authorization = `Bearer ${currentToken}`;
    if (restaurantHint) headers['X-Vondo-Restaurant'] = restaurantHint;
    if (!form && body !== undefined) headers['Content-Type'] = 'application/json';
    if (idempotent) headers['Idempotency-Key'] = uuid();

    let response;
    try {
      response = await fetch(path, {
        method,
        headers,
        body: body === undefined ? undefined : (form ? body : JSON.stringify(body)),
      });
    } catch (err) {
      throw new Error('The server is unreachable. Check Docker and try again.');
    }

    if (response.status === 204) return null;
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && !retried && refreshToken && !path.endsWith('/refresh')) {
        const refreshEndpoint = mode === 'owner' ? '/api/v1/owner/refresh' : mode === 'vendor' ? '/api/v1/vendor/refresh' : '/api/v1/platform/refresh';
        try {
          const res = await fetch(refreshEndpoint, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          const refreshData = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(refreshData.message || 'Your session expired.');
          saveSession(refreshData);
          return request(path, { method, body, form, idempotent, retried: true });
        } catch (refreshErr) {
          clearSession();
          notify('Your session expired. Please sign in again.', 'error');
          throw refreshErr;
        }
      }

      if (response.status === 401) {
        clearSession();
        setAuthMessage('Your session expired. Please sign in again.');
      }

      const details = data.errors ? Object.values(data.errors).flat().join(' ') : '';
      const error = new Error(details || data.message || `Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return data;
  }, [tokenKey, restaurantHint, refreshToken, mode, saveSession, clearSession, notify]);

  // Handle Initial URL Actions
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const tok = params.get('token') || '';
    const inv = params.get('invitation') || '';

    if (action === 'reset-password' && tok) {
      setAuthAction('reset-password');
      setUrlToken(tok);
    } else if (action === 'verify-email' && tok) {
      request('/api/v1/owner/email/verify', { method: 'POST', body: { token: tok } })
        .then(res => {
          window.history.replaceState({}, '', window.location.pathname);
          setAuthMessage(res.message || 'Email verified. Please sign in.');
          setAuthAction('login');
        })
        .catch(err => {
          setAuthMessage(err.message);
          setAuthAction('login');
        });
    } else if (action === 'accept-invite' && tok && inv) {
      setAuthAction('accept-invite');
      setUrlToken(tok);
      setInvitationId(inv);
    } else {
      setAuthAction(token ? 'authenticated' : 'login');
    }
  }, [token, request]);

  // Bootstrap Session Data
  const bootstrapSession = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (mode === 'owner') {
        const [restRes, bootRes] = await Promise.all([
          request('/api/v1/owner/restaurant'),
          request('/api/v1/owner/bootstrap')
        ]);
        setRestaurant(restRes.data);
        setOwnerBootstrap(bootRes.data);
      } else if (mode === 'vendor') {
        const vRes = await request('/api/v1/vendor/bootstrap');
        setVendorBootstrap(vRes.data);
        if (vRes.data?.locations?.length && !vendorLocationId) {
          setVendorLocationId(vRes.data.locations[0].id);
        }
      }
    } catch (err) {
      notify(err.message, 'error');
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [token, mode, vendorLocationId, request, notify, clearSession]);

  useEffect(() => {
    if (token) {
      bootstrapSession();
    }
  }, [token, bootstrapSession]);

  // Fetch Current View Data
  const loadView = useCallback(async (view = currentView, page = 1, filters = {}) => {
    if (!token) return;
    setLoading(true);
    try {
      let data = null;
      if (mode === 'owner') {
        if (view === 'dashboard') {
          const res = await request('/api/v1/owner/dashboard');
          data = res.data;
        } else if (view === 'orders') {
          const res = await request(`/api/v1/owner/orders?${qs({ ...filters, page, limit: 25 })}`);
          data = res;
        } else if (view === 'reservations') {
          const res = await request(`/api/v1/owner/reservations?${qs({ ...filters, page, limit: 25 })}`);
          data = res;
        } else if (view === 'menus') {
          const res = await request(`/api/v1/owner/menus?${qs({ ...filters, page, limit: 25 })}`);
          data = res;
        } else if (view === 'customers') {
          const res = await request(`/api/v1/owner/customers?${qs({ ...filters, page, limit: 25 })}`);
          data = res;
        } else if (view === 'locations') {
          const res = await request('/api/v1/owner/locations');
          data = res.data;
        } else if (view === 'team') {
          const [memRes, accRes] = await Promise.all([
            request('/api/v1/owner/team'),
            request('/api/v1/owner/team-access')
          ]);
          data = { members: memRes.data, access: accRes.data, permissions: accRes.meta?.available_permissions || [] };
        } else if (view === 'brand') {
          const res = await request('/api/v1/owner/brand-revisions');
          data = res.data;
        } else if (view === 'builds') {
          const res = await request('/api/v1/owner/app-builds');
          data = res.data;
        } else if (view === 'pages') {
          const res = await request('/api/v1/owner/pages');
          data = res.data;
        } else if (view === 'media') {
          const res = await request('/api/v1/owner/media');
          data = res.data;
        } else if (view === 'payments' || view === 'restaurant') {
          const res = await request('/api/v1/owner/restaurant');
          data = res.data;
        }
      } else if (mode === 'vendor') {
        const locParam = vendorLocationId ? { location_id: vendorLocationId } : {};
        if (view === 'vendor-dashboard') {
          const res = await request(`/api/v1/vendor/dashboard?${qs(locParam)}`);
          data = res.data;
        } else if (view === 'vendor-orders') {
          const res = await request(`/api/v1/vendor/orders?${qs({ ...locParam, ...filters, page, limit: 30 })}`);
          data = res;
        } else if (view === 'vendor-reservations') {
          const res = await request(`/api/v1/vendor/reservations?${qs({ ...locParam, ...filters, page, limit: 30 })}`);
          data = res;
        } else if (view === 'vendor-menus') {
          const res = await request(`/api/v1/vendor/menus?${qs(locParam)}`);
          data = res.data;
        }
      } else {
        // Platform Mode
        if (view === 'overview') {
          const res = await request('/api/v1/platform/overview');
          data = res.data;
        } else if (view === 'restaurants') {
          const res = await request(`/api/v1/platform/restaurants?${qs({ ...filters, page, limit: 25 })}`);
          data = res;
        } else if (view === 'restaurant-detail' && selectedRestaurant) {
          const [rRes, pRes] = await Promise.all([
            request(`/api/v1/platform/restaurants/${selectedRestaurant}`),
            request('/api/v1/platform/subscription-plans')
          ]);
          data = { restaurant: rRes.data, plans: pRes.data };
        } else if (view === 'operations') {
          const [hRes, aRes] = await Promise.all([
            request('/api/v1/platform/health'),
            request(`/api/v1/platform/alerts?${qs({ status: 'open', page, limit: 30 })}`)
          ]);
          data = { health: hRes.data, alerts: aRes };
        } else if (view === 'reports') {
          const res = await request(`/api/v1/platform/reports?${qs(filters)}`);
          data = res.data;
        } else if (view === 'platform-builds') {
          const res = await request(`/api/v1/platform/app-builds?${qs({ page, limit: 30 })}`);
          data = res;
        } else if (view === 'audit') {
          const res = await request(`/api/v1/platform/audit-logs?${qs({ page, limit: 40 })}`);
          data = res;
        } else if (view === 'plans') {
          const res = await request('/api/v1/platform/subscription-plans');
          data = res.data;
        } else if (view === 'templates') {
          const res = await request('/api/v1/platform/templates');
          data = res.data;
        } else if (view === 'security') {
          const res = await request('/api/v1/platform/security/mfa');
          data = res.data;
        }
      }
      setViewData(data);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, mode, currentView, selectedRestaurant, vendorLocationId, request, notify]);

  useEffect(() => {
    if (token) {
      loadView(currentView);
    }
  }, [token, mode, currentView, vendorLocationId, loadView]);

  const switchMode = useCallback((newMode) => {
    clearSession(newMode);
    setMode(newMode);
    localStorage.setItem('vondo_admin_mode', newMode);
    const defView = newMode === 'owner' ? 'dashboard' : newMode === 'vendor' ? 'vendor-dashboard' : 'overview';
    setViewData(null);
    setCurrentView(defView);
    window.location.hash = `#/${defView}`;
  }, [clearSession]);

  const handleLogout = useCallback(async () => {
    const endpoint = mode === 'owner' ? '/api/v1/owner/session' : mode === 'vendor' ? '/api/v1/vendor/session' : '/api/v1/platform/session';
    try {
      await request(endpoint, { method: 'DELETE' });
    } catch (_) {}
    clearSession();
    setAuthAction('login');
  }, [mode, request, clearSession]);

  // Auth Screen Renderer
  if (!token || authAction !== 'authenticated') {
    return h(ThemeProvider, { theme },
      h(CssBaseline, null),
      h(Box, {
        sx: {
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          background: 'radial-gradient(circle at 50% 0%, #f6d9c7 0%, transparent 40rem), #fffaf4',
        }
      },
        h(Card, { sx: { width: '100%', maxWidth: authAction === 'register' ? 560 : 480, p: 2, borderRadius: 4 } },
          h(CardContent, null,
            // Brand Logo Header
            h(Box, { sx: { textAlign: 'center', mb: 3 } },
              h(Avatar, {
                sx: {
                  bgcolor: 'primary.main',
                  width: 52,
                  height: 52,
                  mx: 'auto',
                  mb: 1.5,
                  fontWeight: 900,
                  fontSize: '1.5rem',
                  boxShadow: '0 4px 14px rgba(184, 79, 46, 0.3)'
                }
              }, 'V'),
              h(Typography, { variant: 'caption', color: 'primary.main', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' },
                mode === 'owner' ? 'Restaurant platform' : mode === 'vendor' ? 'Staff & vendor operations' : 'Platform administration'
              ),
              h(Typography, { variant: 'h5', sx: { mt: 0.5, fontWeight: 700 } },
                authAction === 'register' ? 'Create your restaurant' :
                authAction === 'forgot-password' ? 'Reset your password' :
                authAction === 'reset-password' ? 'Choose a new password' :
                authAction === 'resend-verification' ? 'Resend verification' :
                authAction === 'accept-invite' ? 'Join the restaurant' :
                'Vondo Control'
              ),
              h(Typography, { variant: 'body2', color: 'text.secondary', mt: 0.5 },
                authAction === 'register' ? 'Your isolated dashboard, storefront, and mobile configuration are provisioned together.' :
                authAction === 'accept-invite' ? 'Create a secure password to accept this one-time invitation.' :
                'One secure workspace for every restaurant operation.'
              )
            ),

            // Mode Selector (Tabs) for Login view: Owner vs Vendor vs Super Admin
            (authAction === 'login' || !authAction) && h(Box, { sx: { mb: 2.5 } },
              h(Tabs, {
                value: mode,
                onChange: (_, val) => switchMode(val),
                variant: 'fullWidth',
                sx: {
                  bgcolor: '#eee4dc',
                  borderRadius: 3,
                  p: 0.5,
                  '& .MuiTabs-indicator': { display: 'none' },
                  '& .MuiTab-root': {
                    borderRadius: 2.5,
                    minHeight: 38,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    '&.Mui-selected': { bgcolor: '#ffffff', color: '#27211d', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
                  }
                }
              },
                h(Tab, { value: 'owner', label: 'Owner' }),
                h(Tab, { value: 'vendor', label: 'Vendor / Staff' }),
                h(Tab, { value: 'platform', label: 'Super Admin' })
              )
            ),

            // Notice / Error Alert
            authMessage && h(Alert, { severity: 'info', sx: { mb: 2 } }, authMessage),

            // Mode Context Notice
            (authAction === 'login' || !authAction) && h(Alert, {
              severity: mode === 'owner' ? 'info' : mode === 'vendor' ? 'success' : 'warning',
              sx: { mb: 2, '& .MuiAlert-message': { fontSize: '0.85rem' } }
            },
              mode === 'owner'
                ? 'Sign in as a restaurant owner to access settings, branding, menus and operations.'
                : mode === 'vendor'
                ? 'Sign in as kitchen / front-of-house staff to manage live orders, reservations & stock.'
                : 'Platform access is strictly restricted to Super Admin accounts.'
            ),

            // Login Form
            (authAction === 'login' || !authAction) && h('form', {
              onSubmit: async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const email = form.email.value;
                const password = form.password.value;
                const mfa_code = form.mfa_code?.value;
                setLoading(true);
                try {
                  const endpoint = mode === 'owner' ? '/api/v1/owner/token' : mode === 'vendor' ? '/api/v1/vendor/token' : '/api/v1/platform/token';
                  const body = { email, password, device_name: `Vondo ${mode} React Portal` };
                  if (mode === 'platform' && mfa_code) body.mfa_code = mfa_code;
                  const res = await request(endpoint, { method: 'POST', body });
                  saveSession(res);
                  setAuthAction('authenticated');
                  notify('Signed in successfully.', 'success');
                } catch (err) {
                  notify(err.message, 'error');
                } finally {
                  setLoading(false);
                }
              }
            },
              h(Stack, { spacing: 2 },
                h(TextField, { label: 'Email address', name: 'email', type: 'email', required: true, fullWidth: true, size: 'small', autoFocus: true }),
                h(TextField, { label: 'Password', name: 'password', type: 'password', required: true, fullWidth: true, size: 'small' }),
                mode === 'platform' && h(TextField, {
                  label: 'Authenticator or recovery code',
                  name: 'mfa_code',
                  fullWidth: true,
                  size: 'small',
                  helperText: 'Required when MFA is enabled on your Super Admin account'
                }),
                h(Button, {
                  type: 'submit',
                  variant: 'contained',
                  color: 'primary',
                  fullWidth: true,
                  size: 'large',
                  disabled: loading,
                  sx: { mt: 1 }
                }, loading ? h(CircularProgress, { size: 24, color: 'inherit' }) : 'Sign in securely')
              )
            ),

            // Registration Form
            authAction === 'register' && h('form', {
              onSubmit: async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                setLoading(true);
                try {
                  const res = await request('/api/v1/owner/register', { method: 'POST', body: data, idempotent: true });
                  setRestaurantHint(res.data.restaurant_id);
                  setAuthAction('login');
                  setAuthMessage('Restaurant created successfully! Please sign in with your credentials.');
                  notify('Restaurant provisioned successfully.', 'success');
                } catch (err) {
                  notify(err.message, 'error');
                } finally {
                  setLoading(false);
                }
              }
            },
              h(Grid, { container: true, spacing: 2 },
                h(Grid, { item: true, xs: 12, sm: 6 }, h(TextField, { label: 'Your Name', name: 'owner_name', required: true, fullWidth: true, size: 'small' })),
                h(Grid, { item: true, xs: 12, sm: 6 }, h(TextField, { label: 'Restaurant Name', name: 'restaurant_name', required: true, fullWidth: true, size: 'small' })),
                h(Grid, { item: true, xs: 12 }, h(TextField, { label: 'Email Address', name: 'email', type: 'email', required: true, fullWidth: true, size: 'small' })),
                h(Grid, { item: true, xs: 12, sm: 6 }, h(TextField, { label: 'Password', name: 'password', type: 'password', required: true, fullWidth: true, size: 'small', helperText: 'Min 10 characters' })),
                h(Grid, { item: true, xs: 12, sm: 6 }, h(TextField, { label: 'Confirm Password', name: 'password_confirmation', type: 'password', required: true, fullWidth: true, size: 'small' })),
                h(Grid, { item: true, xs: 12, sm: 6 }, h(TextField, { label: 'Timezone', name: 'timezone', defaultValue: 'Africa/Casablanca', required: true, fullWidth: true, size: 'small' })),
                h(Grid, { item: true, xs: 12, sm: 6 }, h(TextField, { label: 'Currency', name: 'currency_code', defaultValue: 'MAD', required: true, fullWidth: true, size: 'small' })),
                h(Grid, { item: true, xs: 12 },
                  h(Button, { type: 'submit', variant: 'contained', color: 'primary', fullWidth: true, size: 'large', disabled: loading },
                    loading ? h(CircularProgress, { size: 24 }) : 'Create restaurant'
                  ),
                  h(Button, { variant: 'text', fullWidth: true, sx: { mt: 1 }, onClick: () => setAuthAction('login') }, 'Back to sign in')
                )
              )
            ),

            // Account Actions (Forgot / Reset Password / Resend Verification)
            (authAction === 'forgot-password' || authAction === 'resend-verification' || authAction === 'reset-password') && h('form', {
              onSubmit: async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                setLoading(true);
                try {
                  const endpoints = {
                    'forgot-password': '/api/v1/owner/password/forgot',
                    'resend-verification': '/api/v1/owner/email/resend',
                    'reset-password': '/api/v1/owner/password/reset'
                  };
                  const res = await request(endpoints[authAction], { method: 'POST', body: data });
                  window.history.replaceState({}, '', window.location.pathname);
                  setAuthAction('login');
                  setAuthMessage(res.message || 'Request completed successfully.');
                  notify(res.message || 'Success', 'success');
                } catch (err) {
                  notify(err.message, 'error');
                } finally {
                  setLoading(false);
                }
              }
            },
              h(Stack, { spacing: 2 },
                authAction === 'reset-password'
                  ? [
                      h('input', { type: 'hidden', name: 'token', value: urlToken, key: 'tok' }),
                      h(TextField, { label: 'New Password', name: 'password', type: 'password', required: true, fullWidth: true, size: 'small', key: 'p1' }),
                      h(TextField, { label: 'Confirm Password', name: 'password_confirmation', type: 'password', required: true, fullWidth: true, size: 'small', key: 'p2' })
                    ]
                  : h(TextField, { label: 'Email Address', name: 'email', type: 'email', required: true, fullWidth: true, size: 'small' }),
                h(Button, { type: 'submit', variant: 'contained', color: 'primary', fullWidth: true, size: 'large', disabled: loading },
                  loading ? h(CircularProgress, { size: 24 }) : (authAction === 'reset-password' ? 'Update password' : 'Submit request')
                ),
                h(Button, { variant: 'text', fullWidth: true, onClick: () => setAuthAction('login') }, 'Back to sign in')
              )
            ),

            // Staff Invitation Form
            authAction === 'accept-invite' && h('form', {
              onSubmit: async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                data.token = urlToken;
                data.invitation_id = invitationId;
                setLoading(true);
                try {
                  await request('/api/v1/owner/invitations/accept', { method: 'POST', body: data });
                  window.history.replaceState({}, '', window.location.pathname);
                  setAuthAction('login');
                  setAuthMessage('Invitation accepted. Sign in with your email and new password.');
                  notify('Invitation accepted.', 'success');
                } catch (err) {
                  notify(err.message, 'error');
                } finally {
                  setLoading(false);
                }
              }
            },
              h(Stack, { spacing: 2 },
                h(TextField, { label: 'New Password', name: 'password', type: 'password', required: true, fullWidth: true, size: 'small' }),
                h(TextField, { label: 'Confirm Password', name: 'password_confirmation', type: 'password', required: true, fullWidth: true, size: 'small' }),
                h(Button, { type: 'submit', variant: 'contained', color: 'primary', fullWidth: true, size: 'large', disabled: loading },
                  loading ? h(CircularProgress, { size: 24 }) : 'Accept invitation'
                )
              )
            ),

            // Auth Screen Footer Quick Links
            (authAction === 'login' || !authAction) && mode === 'owner' && h(Box, { sx: { mt: 3, pt: 2, borderTop: '1px solid #eadfd4', textAlign: 'center' } },
              h(Button, {
                variant: 'outlined',
                color: 'secondary',
                fullWidth: true,
                onClick: () => setAuthAction('register'),
                sx: { mb: 1.5 }
              }, 'Create restaurant account'),
              h(Stack, { direction: 'row', justifyContent: 'center', spacing: 1 },
                h(Button, { size: 'small', color: 'inherit', onClick: () => setAuthAction('forgot-password') }, 'Forgot password?'),
                h(Typography, { color: 'text.secondary', sx: { alignSelf: 'center' } }, '•'),
                h(Button, { size: 'small', color: 'inherit', onClick: () => setAuthAction('resend-verification') }, 'Resend verification')
              )
            )
          )
        )
      ),
      // Toast / Notification
      h(Snackbar, {
        open: toast.open,
        autoHideDuration: 4000,
        onClose: () => setToast(prev => ({ ...prev, open: false })),
        anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
      },
        h(Alert, { onClose: () => setToast(prev => ({ ...prev, open: false })), severity: toast.severity, sx: { width: '100%' } }, toast.message)
      )
    );
  }

  // Navigation Items according to active mode
  const currentNavItems = mode === 'owner' ? ownerNavItems : mode === 'vendor' ? vendorNavItems : platformNavItems;
  const currentWorkspaceLabel = mode === 'owner'
    ? (restaurant?.name || 'Restaurant workspace')
    : mode === 'vendor'
    ? (`${vendorBootstrap?.restaurant?.name || 'Vendor'} • Staff: ${vendorBootstrap?.staff?.name || 'Staff'}`)
    : 'Super Admin';

  // Support Session Impersonation state
  const impersonation = ownerBootstrap?.support_impersonation;

  return h(ThemeProvider, { theme },
    h(CssBaseline, null),
    h(Box, { sx: { display: 'flex', minHeight: '100vh', bgcolor: 'background.default' } },
      // Top AppBar
      h(AppBar, {
        position: 'fixed',
        sx: {
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: '#29221e',
          color: '#ffffff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
        }
      },
        h(Toolbar, { sx: { justifyContent: 'space-between' } },
          h(Stack, { direction: 'row', alignItems: 'center', spacing: 1.5 },
            h(IconButton, {
              color: 'inherit',
              edge: 'start',
              onClick: () => setMobileOpen(!mobileOpen),
              sx: { display: { md: 'none' } }
            }, h(Icon, { name: 'menu' })),
            h(Avatar, { sx: { bgcolor: 'primary.main', width: 34, height: 34, fontWeight: 800, fontSize: 16 } }, 'V'),
            h(Box, null,
              h(Typography, { variant: 'subtitle2', fontWeight: 700, lineHeight: 1.1 }, 'Vondo Control'),
              h(Typography, { variant: 'caption', color: 'rgba(255,255,255,0.7)', display: 'block' }, currentWorkspaceLabel)
            )
          ),
          h(Stack, { direction: 'row', alignItems: 'center', spacing: 1 },
            // If in vendor mode and multiple locations exist, provide location selector in appbar
            mode === 'vendor' && (vendorBootstrap?.locations?.length > 1) && h(FormControl, { size: 'small', sx: { minWidth: 160, mr: 1 } },
              h(Select, {
                value: vendorLocationId || '',
                onChange: (e) => setVendorLocationId(e.target.value),
                sx: { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)', '& .MuiSvgIcon-root': { color: '#ffffff' } }
              },
                vendorBootstrap.locations.map(loc => h(MenuItem, { key: loc.id, value: loc.id }, loc.name))
              )
            ),
            h(Chip, {
              label: mode === 'owner' ? 'Owner Mode' : mode === 'vendor' ? 'Vendor Portal' : 'Super Admin',
              size: 'small',
              color: mode === 'owner' ? 'primary' : mode === 'vendor' ? 'success' : 'warning',
              sx: { fontWeight: 700 }
            }),
            h(Button, {
              color: 'inherit',
              variant: 'outlined',
              size: 'small',
              onClick: handleLogout,
              startIcon: h(Icon, { name: 'logout' }),
              sx: { borderColor: 'rgba(255,255,255,0.2)', ml: 1 }
            }, 'Sign out')
          )
        )
      ),

      // Sidebar Navigation Drawer
      h(Drawer, {
        variant: 'permanent',
        sx: {
          display: { xs: 'none', md: 'block' },
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            bgcolor: '#29221e',
            color: '#ffffff',
            borderRight: 'none'
          },
        }
      },
        h(Toolbar, null),
        h(Box, { sx: { overflow: 'auto', p: 1.5 } },
          h(List, null,
            currentNavItems.map(item =>
              h(ListItem, { key: item.key, disablePadding: true, sx: { mb: 0.5 } },
                h(ListItemButton, {
                  selected: currentView === item.key,
                  onClick: () => {
                    setViewData(null);
                    setCurrentView(item.key);
                    if (item.key === 'restaurant-detail') setSelectedRestaurant(null);
                  },
                  sx: {
                    borderRadius: 2,
                    color: currentView === item.key ? '#ffffff' : '#d8cec8',
                    bgcolor: currentView === item.key ? '#403631 !important' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' }
                  }
                },
                  h(ListItemIcon, { sx: { color: currentView === item.key ? 'primary.light' : '#bfb3ab', minWidth: 36 } },
                    h(Icon, { name: item.icon })
                  ),
                  h(ListItemText, { primary: item.label, primaryTypographyProps: { fontSize: '0.9rem', fontWeight: currentView === item.key ? 700 : 500 } })
                )
              )
            )
          )
        )
      ),

      // Mobile Temporary Drawer
      h(Drawer, {
        variant: 'temporary',
        open: mobileOpen,
        onClose: () => setMobileOpen(false),
        ModalProps: { keepMounted: true },
        sx: {
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: 240, bgcolor: '#29221e', color: '#ffffff' }
        }
      },
        h(Toolbar, null),
        h(Box, { sx: { p: 1.5 } },
          h(List, null,
            currentNavItems.map(item =>
              h(ListItem, { key: item.key, disablePadding: true, sx: { mb: 0.5 } },
                h(ListItemButton, {
                  selected: currentView === item.key,
                  onClick: () => {
                    setViewData(null);
                    setCurrentView(item.key);
                    setMobileOpen(false);
                  },
                  sx: {
                    borderRadius: 2,
                    color: currentView === item.key ? '#ffffff' : '#d8cec8',
                    bgcolor: currentView === item.key ? '#403631 !important' : 'transparent',
                  }
                },
                  h(ListItemIcon, { sx: { color: currentView === item.key ? 'primary.light' : '#bfb3ab', minWidth: 36 } },
                    h(Icon, { name: item.icon })
                  ),
                  h(ListItemText, { primary: item.label })
                )
              )
            )
          )
        )
      ),

      // Main Content Area
      h(Box, { component: 'main', sx: { flexGrow: 1, p: { xs: 2, md: 3.5 }, width: { md: 'calc(100% - 240px)' } } },
        h(Toolbar, null),

        // Support Impersonation Banner (if active)
        impersonation && h(Alert, {
          severity: 'warning',
          variant: 'filled',
          sx: { mb: 3, borderRadius: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
          action: h(Button, {
            color: 'inherit',
            size: 'small',
            variant: 'outlined',
            onClick: () => {
              clearSession();
              switchMode('platform');
              window.history.replaceState({}, '', window.location.pathname);
            }
          }, 'Return to Super Admin')
        },
          h(Typography, { variant: 'body2', fontWeight: 600 },
            `Support mode: ${impersonation.administrator} is viewing this restaurant for "${impersonation.reason}" until ${date(impersonation.expires_at)}.`
          )
        ),

        // Dynamic Active View Component
        loading && !viewData
          ? h(Box, { sx: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 2 } },
              h(CircularProgress, { color: 'primary' }),
              h(Typography, { color: 'text.secondary' }, 'Loading data...')
            )
          : h(ViewContent, {
              mode,
              currentView,
              setCurrentView,
              data: viewData,
              restaurant,
              ownerBootstrap,
              vendorBootstrap,
              vendorLocationId,
              setVendorLocationId,
              selectedRestaurant,
              setSelectedRestaurant,
              request,
              notify,
              refreshView: (p = 1, f = {}) => loadView(currentView, p, f),
              bootstrapSession,
            })
      )
    ),

    // Global Feedback Snackbar
    h(Snackbar, {
      open: toast.open,
      autoHideDuration: 4000,
      onClose: () => setToast(prev => ({ ...prev, open: false })),
      anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
    },
      h(Alert, { onClose: () => setToast(prev => ({ ...prev, open: false })), severity: toast.severity, sx: { width: '100%' } }, toast.message)
    )
  );
}

// KPI Metric Card Component
function MetricCard({ label, value, note, icon, color = 'primary.main' }) {
  return h(Card, { sx: { height: '100%' } },
    h(CardContent, { sx: { p: 2.5, '&:last-child': { pb: 2.5 } } },
      h(Stack, { direction: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
        h(Box, null,
          h(Typography, { variant: 'caption', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }, label),
          h(Typography, { variant: 'h4', fontWeight: 700, sx: { my: 0.5, color: '#27211d' } }, value),
          note && h(Typography, { variant: 'caption', color: 'text.secondary' }, note)
        ),
        icon && h(Avatar, { sx: { bgcolor: `${color}15`, color: color, width: 44, height: 44 } },
          h(Icon, { name: icon })
        )
      )
    )
  );
}

// Subcomponent Router for All Owner, Vendor, and Platform Views
function ViewContent({
  mode, currentView, setCurrentView, data, restaurant, ownerBootstrap,
  vendorBootstrap, vendorLocationId, setVendorLocationId,
  selectedRestaurant, setSelectedRestaurant, request, notify, refreshView, bootstrapSession
}) {
  // Vendor / Staff Views
  if (mode === 'vendor') {
    if (currentView === 'vendor-dashboard') {
      return h(VendorDashboardView, {
        data,
        vendorBootstrap,
        vendorLocationId,
        setVendorLocationId,
        setCurrentView
      });
    }

    if (currentView === 'vendor-orders') {
      return h(VendorOrdersView, {
        data,
        vendorBootstrap,
        vendorLocationId,
        request,
        notify,
        refreshView
      });
    }

    if (currentView === 'vendor-reservations') {
      return h(VendorReservationsView, {
        data,
        vendorBootstrap,
        vendorLocationId,
        request,
        notify,
        refreshView
      });
    }

    if (currentView === 'vendor-menus') {
      return h(VendorMenusView, {
        data: data || [],
        vendorLocationId,
        request,
        notify,
        refreshView
      });
    }
  }

  // Owner Views
  if (mode === 'owner') {
    if (currentView === 'dashboard') {
      return h(OwnerDashboardView, { data, ownerBootstrap, restaurant, request, notify, refreshView, setCurrentView });
    }

    if (currentView === 'orders') {
      return h(OrdersView, { data, ownerBootstrap, restaurant, request, notify, refreshView });
    }

    if (currentView === 'reservations') {
      return h(ReservationsView, { data, ownerBootstrap, request, notify, refreshView });
    }

    if (currentView === 'menus') {
      return h(MenusView, { data, ownerBootstrap, restaurant, request, notify, refreshView, bootstrapSession });
    }

    if (currentView === 'customers') {
      return h(CustomersView, { data, restaurant, request, notify, refreshView });
    }

    if (currentView === 'locations') {
      return h(LocationsView, { data, restaurant, request, notify, refreshView });
    }

    if (currentView === 'team') {
      return h(TeamView, { data, ownerBootstrap, request, notify, refreshView });
    }

    if (currentView === 'payments') {
      return h(PaymentSettingsView, { restaurant: data || restaurant, request, notify, bootstrapSession, refreshView });
    }

    if (currentView === 'restaurant') {
      return h(RestaurantSettingsView, { restaurant, request, notify, bootstrapSession, refreshView, setCurrentView });
    }

    if (currentView === 'brand') {
      return h(BrandView, { revisions: data || [], restaurant, request, notify, refreshView });
    }

    if (currentView === 'domains') {
      return h(DomainsView, { restaurant, request, notify, bootstrapSession });
    }

    if (currentView === 'subscription') {
      return h(SubscriptionView, { subscription: ownerBootstrap?.subscription });
    }

    if (currentView === 'builds') {
      return h(BuildsView, { builds: data || [], request, notify, refreshView });
    }

    if (currentView === 'pages') {
      return h(PagesView, { pages: data || [], request, notify, refreshView });
    }

    if (currentView === 'media') {
      return h(MediaGalleryView, { assets: data || [], request, notify, refreshView });
    }
  }

  // Super Admin Platform Views
  if (mode === 'platform') {
    if (currentView === 'overview') {
      return h(PlatformOverviewView, { data, setCurrentView });
    }

    if (currentView === 'restaurants') {
      return h(PlatformRestaurantsView, { data, setSelectedRestaurant, setCurrentView, request, notify, refreshView });
    }

    if (currentView === 'restaurant-detail') {
      return h(PlatformRestaurantDetailView, {
        detail: data,
        selectedRestaurant,
        setCurrentView,
        request,
        notify,
        refreshView
      });
    }

    if (currentView === 'operations') {
      return h(PlatformOperationsView, { data, request, notify, refreshView });
    }

    if (currentView === 'reports') {
      return h(PlatformReportsView, { data, request, notify, refreshView });
    }

    if (currentView === 'platform-builds') {
      return h(PlatformBuildsView, { data, request, notify, refreshView });
    }

    if (currentView === 'audit') {
      return h(PlatformAuditView, { data, request, notify, refreshView });
    }

    if (currentView === 'plans') {
      return h(PlatformPlansView, { plans: data || [], request, notify, refreshView });
    }

    if (currentView === 'templates') {
      return h(PlatformTemplatesView, { templates: data || [], request, notify, refreshView });
    }

    if (currentView === 'security') {
      return h(PlatformSecurityView, { mfa: data || {}, request, notify, refreshView });
    }
  }

  return h(Typography, null, `View ${currentView} is loading.`);
}

// ----------------------------------------------------
// PRINTABLE RECEIPT & KITCHEN TICKET UTILITY
// ----------------------------------------------------

function printOrderReceipt(order, restaurant) {
  if (!order) return;
  const printWindow = window.open('', '_blank', 'width=450,height=700');
  if (!printWindow) return;
  const currency = restaurant?.currency_code || 'USD';
  const items = order.items || [];
  const itemsHtml = items.length ? items.map(item => `
    <tr style="border-bottom: 1px dashed #e0e0e0;">
      <td style="padding: 8px 0; vertical-align: top;">
        <div style="font-weight: 700; font-size: 14px;">${item.quantity}x ${esc(item.name)}</div>
        ${(item.options || []).map(o => `<div style="font-size: 12px; color: #555; padding-left: 10px;">+ ${o.quantity > 1 ? o.quantity + 'x ' : ''}${esc(o.name)}</div>`).join('')}
        ${item.comment ? `<div style="font-size: 12px; font-style: italic; color: #888; padding-left: 10px;">"${esc(item.comment)}"</div>` : ''}
      </td>
      <td style="padding: 8px 0; text-align: right; vertical-align: top; font-weight: 700; font-size: 14px;">
        ${money(item.subtotal || (item.price * item.quantity), currency)}
      </td>
    </tr>
  `).join('') : `<tr><td colspan="2" style="padding: 10px 0; text-align: center; color: #888;">Order items summary</td></tr>`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Receipt ${order.number}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Courier New', Courier, monospace; padding: 20px; font-size: 13px; color: #111; line-height: 1.4; max-width: 380px; margin: 0 auto; background: #fff; }
          .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 12px; margin-bottom: 12px; }
          .header h1 { margin: 0 0 4px 0; font-size: 20px; text-transform: uppercase; }
          .header .sub { font-size: 12px; color: #555; }
          .badge { display: inline-block; padding: 3px 8px; margin-top: 6px; font-weight: 800; text-transform: uppercase; background: #000; color: #fff; border-radius: 3px; }
          .meta { margin-bottom: 12px; font-size: 13px; border-bottom: 1px dashed #777; padding-bottom: 10px; }
          .meta div { margin-bottom: 3px; }
          .note-box { margin-top: 8px; padding: 6px; background: #f0f0f0; border-left: 3px solid #000; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          .totals { border-top: 2px dashed #333; border-bottom: 2px dashed #333; padding: 10px 0; margin-bottom: 14px; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; }
          .totals-row.grand { font-size: 17px; font-weight: 900; margin-top: 6px; padding-top: 6px; border-top: 1px dotted #888; }
          .footer { text-align: center; font-size: 12px; color: #555; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${esc(restaurant?.name || 'Vondo Kitchen')}</h1>
          <div class="sub">${esc(order.location_name || 'Restaurant')}</div>
          <div style="font-size: 18px; font-weight: 900; margin-top: 6px;">ORDER ${order.number}</div>
          <div class="badge">${esc(order.type || 'Standard')}</div>
        </div>
        <div class="meta">
          <div><strong>Date:</strong> ${date(order.created_at || order.scheduled_for)}</div>
          <div><strong>Customer:</strong> ${esc(order.customer_name)}</div>
          ${order.customer_phone ? `<div><strong>Phone:</strong> ${esc(order.customer_phone)}</div>` : ''}
          ${order.customer_email ? `<div><strong>Email:</strong> ${esc(order.customer_email)}</div>` : ''}
          ${order.delivery_address ? `<div><strong>Address:</strong> ${esc(order.delivery_address)}</div>` : ''}
          ${order.comment ? `<div class="note-box"><strong>NOTE:</strong> ${esc(order.comment)}</div>` : ''}
        </div>
        <table>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="totals">
          <div class="totals-row">
            <span>Items Count:</span>
            <span>${order.items_count || items.length}</span>
          </div>
          <div class="totals-row">
            <span>Payment Method:</span>
            <span style="text-transform: uppercase;">${esc(order.payment_method || 'COD')}</span>
          </div>
          <div class="totals-row">
            <span>Status:</span>
            <span>${esc(order.status_name || 'New')}</span>
          </div>
          <div class="totals-row grand">
            <span>TOTAL:</span>
            <span>${money(order.total, currency)}</span>
          </div>
        </div>
        <div class="footer">
          <div>Thank you for choosing ${esc(restaurant?.name || 'us')}!</div>
          <div style="margin-top: 4px; font-size: 10px;">Powered by Vondo Operations</div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// ----------------------------------------------------
// VENDOR / STAFF DASHBOARD & WORKSPACE COMPONENTS
// ----------------------------------------------------

function VendorDashboardView({ data, vendorBootstrap, vendorLocationId, setVendorLocationId, setCurrentView }) {
  const locations = vendorBootstrap?.locations || [];
  const activeLocation = locations.find(l => l.id === vendorLocationId) || locations[0];
  const capabilities = vendorBootstrap?.capabilities || { orders: true, reservations: true, menus: true };

  return h(Box, null,
    // Header & Location Selector
    h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 } },
      h(Box, null,
        h(Typography, { variant: 'h4' }, `Kitchen & Counter Dashboard`),
        h(Typography, { variant: 'subtitle1' }, `Staff view for ${activeLocation?.name || 'Location'}`)
      ),
      locations.length > 1 && h(FormControl, { size: 'small', sx: { minWidth: 200 } },
        h(InputLabel, null, 'Active Location'),
        h(Select, {
          value: vendorLocationId || '',
          label: 'Active Location',
          onChange: (e) => setVendorLocationId(e.target.value)
        },
          locations.map(loc => h(MenuItem, { key: loc.id, value: loc.id }, loc.name))
        )
      )
    ),

    // Live Metrics Grid
    h(Grid, { container: true, spacing: 2.5, sx: { mb: 3.5 } },
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 }, h(MetricCard, { label: 'Today sales', value: money(data?.today_sales ?? 0), icon: 'payments' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 }, h(MetricCard, { label: 'Orders today', value: data?.orders_today ?? 0, icon: 'receipt' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 }, h(MetricCard, { label: 'Orders waiting', value: data?.orders_waiting ?? 0, icon: 'schedule', color: 'warning.main' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 }, h(MetricCard, { label: 'Reservations today', value: data?.reservations_today ?? 0, icon: 'event_seat' }))
    ),

    // Capabilities and Fast Actions
    h(Grid, { container: true, spacing: 3 },
      h(Grid, { item: true, xs: 12, md: 8 },
        h(Card, null,
          h(CardHeader, { title: 'Assigned Capabilities & Boundaries' }),
          h(CardContent, null,
            h(Grid, { container: true, spacing: 2 },
              h(Grid, { item: true, xs: 12, sm: 4 },
                h(Paper, { variant: 'outlined', sx: { p: 2, borderLeft: `4px solid ${capabilities.orders ? '#2e7d32' : '#d32f2f'}` } },
                  h(Typography, { variant: 'subtitle2', fontWeight: 700 }, 'Orders Processing'),
                  h(Typography, { variant: 'caption', color: capabilities.orders ? 'success.main' : 'error.main' }, capabilities.orders ? 'Authorized' : 'Restricted')
                )
              ),
              h(Grid, { item: true, xs: 12, sm: 4 },
                h(Paper, { variant: 'outlined', sx: { p: 2, borderLeft: `4px solid ${capabilities.reservations ? '#2e7d32' : '#d32f2f'}` } },
                  h(Typography, { variant: 'subtitle2', fontWeight: 700 }, 'Reservations'),
                  h(Typography, { variant: 'caption', color: capabilities.reservations ? 'success.main' : 'error.main' }, capabilities.reservations ? 'Authorized' : 'Restricted')
                )
              ),
              h(Grid, { item: true, xs: 12, sm: 4 },
                h(Paper, { variant: 'outlined', sx: { p: 2, borderLeft: `4px solid ${capabilities.menus ? '#2e7d32' : '#d32f2f'}` } },
                  h(Typography, { variant: 'subtitle2', fontWeight: 700 }, 'Menu & 86ing'),
                  h(Typography, { variant: 'caption', color: capabilities.menus ? 'success.main' : 'error.main' }, capabilities.menus ? 'Authorized' : 'Restricted')
                )
              )
            )
          )
        )
      ),
      h(Grid, { item: true, xs: 12, md: 4 },
        h(Card, null,
          h(CardHeader, { title: 'Staff actions' }),
          h(CardContent, null,
            h(Stack, { spacing: 1.5 },
              h(Button, { variant: 'contained', color: 'primary', fullWidth: true, onClick: () => setCurrentView('vendor-orders') }, 'View live orders'),
              h(Button, { variant: 'outlined', color: 'secondary', fullWidth: true, onClick: () => setCurrentView('vendor-reservations') }, 'Check bookings'),
              h(Button, { variant: 'outlined', color: 'secondary', fullWidth: true, onClick: () => setCurrentView('vendor-menus') }, 'Toggle 86 / availability')
            )
          )
        )
      )
    )
  );
}

function VendorOrdersView({ data, vendorBootstrap, vendorLocationId, request, notify, refreshView }) {
  const [statusId, setStatusId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [statusComment, setStatusComment] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const orders = data?.data || [];
  const meta = data?.meta || { total: orders.length, limit: 30 };
  const statuses = vendorBootstrap?.order_statuses || [];

  // Live Auto-Refresh polling (every 15s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refreshView(page + 1, { status_id: statusId, search });
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, page, statusId, search, refreshView]);

  const handleApplyFilter = () => {
    setPage(0);
    refreshView(1, { status_id: statusId, search });
  };

  const handleClearFilter = () => {
    setStatusId('');
    setSearch('');
    setPage(0);
    refreshView(1, {});
  };

  const handleUpdateStatus = async (orderId, newStatus, comment = statusComment, notifyCust = notifyCustomer) => {
    try {
      const res = await request(`/api/v1/vendor/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status_id: Number(newStatus), location_id: vendorLocationId, comment: comment || undefined, notify: notifyCust }
      });
      notify('Order status updated.', 'success');
      if (selectedOrder && selectedOrder.id === orderId && res.data) {
        setSelectedOrder(res.data);
      }
      setStatusComment('');
      refreshView(page + 1, { status_id: statusId, search });
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // KPI calculations
  const totalVolume = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const waitingCount = orders.filter(o => o.status_id === 1 || o.status_name?.toLowerCase().includes('received') || o.status_name?.toLowerCase().includes('pending')).length;
  const preparingCount = orders.filter(o => o.status_name?.toLowerCase().includes('prep') || o.status_name?.toLowerCase().includes('cook')).length;

  return h(Box, null,
    // Header & Auto-Refresh Toggle
    h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 } },
      h(Box, null,
        h(Typography, { variant: 'h4' }, 'Live Kitchen Orders'),
        h(Typography, { variant: 'subtitle1' }, 'Live counter & kitchen order stream with instant status workflows.')
      ),
      h(Stack, { direction: 'row', spacing: 2, alignItems: 'center' },
        h(Paper, { variant: 'outlined', sx: { px: 2, py: 0.5, display: 'flex', alignItems: 'center', gap: 1, bgcolor: autoRefresh ? '#f0f8f4' : 'transparent' } },
          h(Box, {
            sx: {
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: autoRefresh ? 'success.main' : 'text.disabled',
              animation: autoRefresh ? 'pulse 2s infinite' : 'none'
            }
          }),
          h(Typography, { variant: 'body2', fontWeight: 600, color: autoRefresh ? 'success.dark' : 'text.secondary' },
            autoRefresh ? 'Live stream active (15s)' : 'Auto-refresh paused'
          ),
          h(Switch, {
            size: 'small',
            checked: autoRefresh,
            onChange: (e) => setAutoRefresh(e.target.checked),
            color: 'success'
          })
        ),
        h(Button, { variant: 'outlined', onClick: () => refreshView(page + 1, { status_id: statusId, search }) }, 'Refresh now')
      )
    ),

    // KPI Metrics Cards
    h(Grid, { container: true, spacing: 2, sx: { mb: 3 } },
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Orders in view', value: orders.length, icon: 'receipt_long' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'New / Waiting', value: waitingCount, icon: 'schedule', color: 'warning.main' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'In Kitchen', value: preparingCount, icon: 'soup_kitchen', color: 'primary.main' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Visible Volume', value: money(totalVolume), icon: 'payments', color: 'success.main' })
      )
    ),

    // Filter Bar
    h(Card, { sx: { mb: 3 } },
      h(CardContent, { sx: { p: 2, '&:last-child': { pb: 2 } } },
        h(Grid, { container: true, spacing: 2, alignItems: 'center' },
          h(Grid, { item: true, xs: 12, sm: 5 },
            h(TextField, {
              placeholder: 'Search order #, customer name, phone, or dish',
              value: search,
              onChange: (e) => setSearch(e.target.value),
              onKeyDown: (e) => e.key === 'Enter' && handleApplyFilter(),
              size: 'small',
              fullWidth: true
            })
          ),
          h(Grid, { item: true, xs: 12, sm: 4 },
            h(FormControl, { size: 'small', fullWidth: true },
              h(InputLabel, null, 'Status filter'),
              h(Select, { value: statusId, label: 'Status filter', onChange: (e) => setStatusId(e.target.value) },
                h(MenuItem, { value: '' }, 'All statuses'),
                statuses.map(s => h(MenuItem, { key: s.id, value: s.id }, s.name))
              )
            )
          ),
          h(Grid, { item: true, xs: 12, sm: 3 },
            h(Stack, { direction: 'row', spacing: 1 },
              h(Button, { variant: 'contained', color: 'primary', fullWidth: true, onClick: handleApplyFilter }, 'Apply'),
              (search || statusId) && h(Button, { variant: 'outlined', color: 'secondary', onClick: handleClearFilter }, 'Clear')
            )
          )
        )
      )
    ),

    // Orders Table
    h(Card, null,
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Order #'),
              h(TableCell, null, 'Customer'),
              h(TableCell, null, 'Type'),
              h(TableCell, null, 'Items Summary'),
              h(TableCell, null, 'Time'),
              h(TableCell, null, 'Total'),
              h(TableCell, null, 'Status'),
              h(TableCell, { align: 'right' }, 'Actions')
            )
          ),
          h(TableBody, null,
            orders.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 8, align: 'center', sx: { py: 5 } },
                  h(Box, { sx: { textAlign: 'center' } },
                    h(Icon, { name: 'receipt_long', sx: { fontSize: 44, color: '#c5b8b0', mb: 1 } }),
                    h(Typography, { color: 'text.secondary' }, 'No live orders matching these criteria.')
                  )
                ))
              : orders.map(order => {
                  const typeLabel = (order.type || 'Standard').toUpperCase();
                  const isDelivery = typeLabel.includes('DELIV');
                  return h(TableRow, { key: order.id, sx: { '&:hover': { bgcolor: '#fffaf6' } } },
                    h(TableCell, null,
                      h(Typography, { variant: 'body2', fontWeight: 800, color: 'primary.main' }, order.number),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, `${order.items_count || order.items?.length || 0} items`)
                    ),
                    h(TableCell, null,
                      h(Typography, { variant: 'body2', fontWeight: 700 }, order.customer_name),
                      order.customer_phone && h('a', { href: `tel:${order.customer_phone}`, style: { textDecoration: 'none', color: '#746a62', fontSize: 12, display: 'block' } }, order.customer_phone)
                    ),
                    h(TableCell, null,
                      h(Chip, {
                        label: isDelivery ? '🚚 Delivery' : '🛍️ Pickup',
                        size: 'small',
                        sx: { fontWeight: 700, bgcolor: isDelivery ? '#e3f2fd' : '#fff3e0', color: isDelivery ? '#0d47a1' : '#e65100' }
                      })
                    ),
                    h(TableCell, { sx: { maxWidth: 220 } },
                      h(Typography, { variant: 'body2', noWrap: true, color: 'text.secondary' },
                        (order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ') || `${order.items_count || 1} items`
                      )
                    ),
                    h(TableCell, null,
                      h(Typography, { variant: 'body2', fontWeight: 600 }, date(order.scheduled_for || order.created_at)),
                      order.scheduled_for && h(Typography, { variant: 'caption', color: 'text.secondary' }, new Date(order.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
                    ),
                    h(TableCell, null,
                      h(Typography, { variant: 'body2', fontWeight: 800 }, money(order.total))
                    ),
                    h(TableCell, null,
                      h(FormControl, { size: 'small', sx: { minWidth: 130 } },
                        h(Select, {
                          value: order.status_id,
                          onChange: (e) => handleUpdateStatus(order.id, e.target.value),
                          sx: { fontSize: '0.85rem', fontWeight: 600 }
                        },
                          statuses.map(s => h(MenuItem, { key: s.id, value: s.id }, s.name))
                        )
                      )
                    ),
                    h(TableCell, { align: 'right' },
                      h(Stack, { direction: 'row', spacing: 1, justifyContent: 'flex-end' },
                        h(Button, { size: 'small', variant: 'contained', color: 'secondary', onClick: () => setSelectedOrder(order) }, 'Inspect'),
                        h(IconButton, { size: 'small', color: 'primary', title: 'Print Ticket', onClick: () => printOrderReceipt(order, { name: order.location_name }) },
                          h(Icon, { name: 'print' })
                        )
                      )
                    )
                  );
                })
          )
        )
      ),
      h(TablePagination, {
        component: 'div',
        count: meta.total || orders.length,
        page: page,
        rowsPerPage: 30,
        rowsPerPageOptions: [30],
        onPageChange: (_, newPage) => {
          setPage(newPage);
          refreshView(newPage + 1, { status_id: statusId, search });
        }
      })
    ),

    // Comprehensive Order Inspection Modal
    selectedOrder && h(Dialog, { open: true, onClose: () => setSelectedOrder(null), maxWidth: 'md', fullWidth: true },
      h(DialogTitle, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 } },
        h(Box, null,
          h(Typography, { variant: 'h5', fontWeight: 800 }, `Order ${selectedOrder.number}`),
          h(Typography, { variant: 'caption', color: 'text.secondary' }, `Placed ${date(selectedOrder.created_at || selectedOrder.scheduled_for)} • Location: ${selectedOrder.location_name || 'Main'}`)
        ),
        h(Stack, { direction: 'row', spacing: 1, alignItems: 'center' },
          h(Chip, { label: selectedOrder.status_name || 'New', color: 'primary', sx: { fontWeight: 700 } }),
          h(Button, { size: 'small', variant: 'outlined', onClick: () => printOrderReceipt(selectedOrder, { name: selectedOrder.location_name }) }, 'Print Ticket')
        )
      ),
      h(DialogContent, { dividers: true },
        h(Grid, { container: true, spacing: 2.5 },
          // Customer & Delivery Details
          h(Grid, { item: true, xs: 12, md: 5 },
            h(Paper, { variant: 'outlined', sx: { p: 2, height: '100%' } },
              h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1 }, 'Customer & Fulfillment'),
              h(Typography, { variant: 'body1', fontWeight: 700 }, selectedOrder.customer_name),
              selectedOrder.customer_phone && h(Box, { sx: { mt: 0.5 } },
                h('a', { href: `tel:${selectedOrder.customer_phone}`, style: { color: '#b84f2e', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' } }, `📞 ${selectedOrder.customer_phone}`)
              ),
              selectedOrder.customer_email && h(Typography, { variant: 'caption', color: 'text.secondary', display: 'block' }, selectedOrder.customer_email),
              h(Divider, { sx: { my: 1.5 } }),
              h(Typography, { variant: 'caption', fontWeight: 700, color: 'text.secondary' }, 'TYPE & DESTINATION'),
              h(Typography, { variant: 'body2', fontWeight: 600, mt: 0.5 }, selectedOrder.type || 'Standard Service'),
              selectedOrder.delivery_address && h(Box, { sx: { mt: 0.5 } },
                h(Typography, { variant: 'body2' }, `📍 ${selectedOrder.delivery_address}`),
                h('a', {
                  href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.delivery_address)}`,
                  target: '_blank',
                  rel: 'noopener',
                  style: { fontSize: 12, color: '#b84f2e', fontWeight: 600 }
                }, 'Open in Google Maps')
              ),
              selectedOrder.comment && h(Alert, { severity: 'warning', sx: { mt: 2, '& .MuiAlert-message': { fontSize: '0.85rem' } } },
                h(Typography, { variant: 'caption', fontWeight: 700, display: 'block' }, 'KITCHEN NOTE:'),
                selectedOrder.comment
              )
            )
          ),

          // Items Breakdown & Options
          h(Grid, { item: true, xs: 12, md: 7 },
            h(Paper, { variant: 'outlined', sx: { p: 2 } },
              h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1 }, 'Order Items Breakdown'),
              h(List, { disablePadding: true },
                (selectedOrder.items || []).map((item, idx) =>
                  h(ListItem, { key: idx, divider: idx < selectedOrder.items.length - 1, sx: { px: 0, py: 1.5 } },
                    h(ListItemText, {
                      primary: h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                        h(Typography, { variant: 'body1', fontWeight: 700 }, `${item.quantity}x ${item.name}`),
                        h(Typography, { variant: 'body1', fontWeight: 700 }, money(item.subtotal || (item.price * item.quantity)))
                      ),
                      secondary: h(Box, { sx: { mt: 0.5 } },
                        (item.options || []).map((opt, optIdx) =>
                          h(Typography, { key: optIdx, variant: 'caption', display: 'block', color: 'text.secondary', pl: 1 },
                            `• ${opt.quantity > 1 ? opt.quantity + 'x ' : ''}${opt.name} ${opt.price ? `(+${money(opt.price)})` : ''}`
                          )
                        ),
                        item.comment && h(Typography, { variant: 'caption', fontStyle: 'italic', color: 'warning.dark', display: 'block', pl: 1, mt: 0.5 },
                          `"${item.comment}"`
                        )
                      )
                    })
                  )
                )
              ),
              h(Divider, { sx: { my: 1.5 } }),
              h(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 0.5 } },
                h(Typography, { variant: 'body2', color: 'text.secondary' }, 'Payment Method:'),
                h(Typography, { variant: 'body2', fontWeight: 600, textTransform: 'uppercase' }, selectedOrder.payment_method || 'COD')
              ),
              h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                h(Typography, { variant: 'h6', fontWeight: 800 }, 'Total Amount:'),
                h(Typography, { variant: 'h5', fontWeight: 800, color: 'primary.main' }, money(selectedOrder.total))
              )
            )
          ),

          // Status Transition with Notes Form
          h(Grid, { item: true, xs: 12 },
            h(Paper, { variant: 'outlined', sx: { p: 2, bgcolor: '#fffaf4' } },
              h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1.5 }, 'Update Order Status'),
              h(Grid, { container: true, spacing: 2, alignItems: 'center' },
                h(Grid, { item: true, xs: 12, sm: 4 },
                  h(FormControl, { size: 'small', fullWidth: true },
                    h(InputLabel, null, 'Change status to'),
                    h(Select, {
                      value: selectedOrder.status_id,
                      label: 'Change status to',
                      onChange: (e) => handleUpdateStatus(selectedOrder.id, e.target.value, statusComment, notifyCustomer)
                    },
                      statuses.map(s => h(MenuItem, { key: s.id, value: s.id }, s.name))
                    )
                  )
                ),
                h(Grid, { item: true, xs: 12, sm: 5 },
                  h(TextField, {
                    label: 'Status note / comment (optional)',
                    value: statusComment,
                    onChange: (e) => setStatusComment(e.target.value),
                    size: 'small',
                    fullWidth: true
                  })
                ),
                h(Grid, { item: true, xs: 12, sm: 3 },
                  h(FormControlLabel, {
                    control: h(Checkbox, { checked: notifyCustomer, onChange: (e) => setNotifyCustomer(e.target.checked) }),
                    label: 'Notify customer'
                  })
                )
              )
            )
          ),

          // Status Timeline History
          selectedOrder.timeline?.length > 0 && h(Grid, { item: true, xs: 12 },
            h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1 }, 'Status History Timeline'),
            h(Stack, { spacing: 1 },
              selectedOrder.timeline.map((hist, histIdx) =>
                h(Paper, { key: histIdx, variant: 'outlined', sx: { p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                  h(Box, null,
                    h(Chip, { label: hist.status, size: 'small', sx: { mr: 1, fontWeight: 700 } }),
                    hist.comment && h(Typography, { variant: 'body2', component: 'span', color: 'text.secondary' }, hist.comment)
                  ),
                  h(Typography, { variant: 'caption', color: 'text.secondary' }, date(hist.created_at))
                )
              )
            )
          )
        )
      ),
      h(DialogActions, { sx: { p: 2 } },
        h(Button, { onClick: () => setSelectedOrder(null) }, 'Close')
      )
    )
  );
}

function VendorReservationsView({ data, vendorBootstrap, vendorLocationId, request, notify, refreshView }) {
  const [statusId, setStatusId] = useState('');
  const reservations = data?.data || [];
  const meta = data?.meta || { total: reservations.length };
  const statuses = vendorBootstrap?.reservation_statuses || [];

  const handleUpdateStatus = async (resId, newStatus) => {
    try {
      await request(`/api/v1/vendor/reservations/${resId}/status`, {
        method: 'PATCH',
        body: { status_id: Number(newStatus), location_id: vendorLocationId, notify: true }
      });
      notify('Reservation status updated.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Live Reservations'),
      h(Typography, { variant: 'subtitle1' }, 'Table booking flow and guest seating status.')
    ),
    h(Card, { sx: { mb: 3 } },
      h(CardContent, { sx: { p: 2, '&:last-child': { pb: 2 } } },
        h(Grid, { container: true, spacing: 2, alignItems: 'center' },
          h(Grid, { item: true, xs: 12, sm: 4 },
            h(FormControl, { size: 'small', fullWidth: true },
              h(InputLabel, null, 'Status'),
              h(Select, { value: statusId, label: 'Status', onChange: (e) => setStatusId(e.target.value) },
                h(MenuItem, { value: '' }, 'All statuses'),
                statuses.map(s => h(MenuItem, { key: s.id, value: s.id }, s.name))
              )
            )
          ),
          h(Grid, { item: true, xs: 12, sm: 2 },
            h(Button, { variant: 'contained', color: 'primary', fullWidth: true, onClick: () => refreshView() }, 'Filter')
          )
        )
      )
    ),
    h(Card, null,
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Guest'),
              h(TableCell, null, 'When'),
              h(TableCell, null, 'Party Size'),
              h(TableCell, null, 'Phone'),
              h(TableCell, null, 'Status')
            )
          ),
          h(TableBody, null,
            reservations.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 5, align: 'center', sx: { py: 4 } }, 'No reservations found.'))
              : reservations.map(r =>
                  h(TableRow, { key: r.id },
                    h(TableCell, null, h(Typography, { variant: 'body2', fontWeight: 700 }, r.guest_name)),
                    h(TableCell, null,
                      h(Typography, { variant: 'body2' }, r.date),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, r.time)
                    ),
                    h(TableCell, null, `${r.guests} guests`),
                    h(TableCell, null, r.telephone || '—'),
                    h(TableCell, null,
                      h(FormControl, { size: 'small', sx: { minWidth: 140 } },
                        h(Select, { value: r.status_id, onChange: (e) => handleUpdateStatus(r.id, e.target.value) },
                          statuses.map(s => h(MenuItem, { key: s.id, value: s.id }, s.name))
                        )
                      )
                    )
                  )
                )
          )
        )
      )
    )
  );
}

function VendorMenusView({ data, vendorLocationId, request, notify, refreshView }) {
  const menus = data || [];

  const handleToggle = async (menuId, checked) => {
    try {
      await request(`/api/v1/vendor/menus/${menuId}/availability`, {
        method: 'PATCH',
        body: { is_available: checked, location_id: vendorLocationId }
      });
      notify('Menu availability updated.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Menu & Stock Switchboard'),
      h(Typography, { variant: 'subtitle1' }, 'Instantly 86 / toggle dish availability for ordering.')
    ),
    h(Card, null,
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Dish'),
              h(TableCell, null, 'Description'),
              h(TableCell, null, 'Price'),
              h(TableCell, { align: 'right' }, 'Availability')
            )
          ),
          h(TableBody, null,
            menus.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 4, align: 'center', sx: { py: 4 } }, 'No menu items.'))
              : menus.map(m =>
                  h(TableRow, { key: m.id },
                    h(TableCell, null, h(Typography, { variant: 'body2', fontWeight: 700 }, m.name)),
                    h(TableCell, { sx: { maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, m.description || '—'),
                    h(TableCell, null, money(m.price)),
                    h(TableCell, { align: 'right' },
                      h(FormControlLabel, {
                        control: h(Switch, {
                          checked: !!m.is_available,
                          onChange: (e) => handleToggle(m.id, e.target.checked),
                          color: 'success'
                        }),
                        label: m.is_available ? 'Available' : '86ed / Unavailable'
                      })
                    )
                  )
                )
          )
        )
      )
    )
  );
}

// ----------------------------------------------------
// OWNER VIEW COMPONENTS
// ----------------------------------------------------

function OwnerDashboardView({ data, ownerBootstrap, restaurant, request, notify, refreshView, setCurrentView }) {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const onboarding = ownerBootstrap?.onboarding || { checks: [] };
  const completed = onboarding.checks.filter(c => c.complete).length;
  const progressPercent = onboarding.checks.length ? Math.round((completed / onboarding.checks.length) * 100) : 0;

  // Auto-refresh interval (15s)
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      refreshView();
    }, 15000);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshView]);

  const salesTrend = data?.sales_trend || [];
  const maxSale = Math.max(...salesTrend.map(d => d.sales || 0), 1);
  const recentOrders = data?.recent_orders || [];
  const recentReservations = data?.recent_reservations || [];

  return h(Box, null,
    // Header & Actions
    h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 } },
      h(Box, null,
        h(Typography, { variant: 'h4' }, 'Good service starts here'),
        h(Typography, { variant: 'subtitle1' }, `Live operational overview for ${restaurant?.name || 'your restaurant'}.`)
      ),
      h(Stack, { direction: 'row', spacing: 1.5, alignItems: 'center' },
        h(FormControlLabel, {
          control: h(Switch, {
            checked: autoRefresh,
            onChange: (e) => setAutoRefresh(e.target.checked),
            color: 'primary'
          }),
          label: h(Stack, { direction: 'row', spacing: 0.8, alignItems: 'center' },
            autoRefresh && h(Box, {
              sx: {
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'success.main',
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(46, 125, 50, 0.7)' },
                  '70%': { transform: 'scale(1)', boxShadow: '0 0 0 6px rgba(46, 125, 50, 0)' },
                  '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(46, 125, 50, 0)' }
                }
              }
            }),
            h(Typography, { variant: 'body2', fontWeight: 600 }, 'Live stream (15s)')
          )
        }),
        h(Button, {
          variant: 'contained',
          color: 'primary',
          onClick: () => setCurrentView('orders')
        }, '📋 Live Orders'),
        h(Button, {
          variant: 'outlined',
          color: 'secondary',
          onClick: () => setCurrentView('menus')
        }, '+ Menu Items')
      )
    ),

    // Top Operational KPI Cards
    h(Grid, { container: true, spacing: 2, sx: { mb: 3.5 } },
      h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 },
        h(MetricCard, { label: 'Sales today', value: money(data?.sales_today, restaurant?.currency_code), icon: 'payments', color: 'success.main' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 },
        h(MetricCard, { label: 'Orders today', value: data?.orders_today ?? 0, icon: 'receipt_long', color: 'primary.main' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 },
        h(MetricCard, {
          label: 'Waiting confirmation',
          value: data?.orders_waiting ?? 0,
          icon: 'pending_actions',
          color: Number(data?.orders_waiting) > 0 ? 'error.main' : 'text.secondary'
        })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 },
        h(MetricCard, { label: 'Reservations today', value: data?.reservations_today ?? 0, icon: 'event_seat', color: 'secondary.main' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 },
        h(MetricCard, { label: 'Total Revenue', value: money(data?.total_revenue, restaurant?.currency_code), icon: 'paid' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 },
        h(MetricCard, { label: 'Customers', value: data?.customers ?? 0, icon: 'people' })
      )
    ),

    // 7-Day Revenue & Volume Breakdown Card
    salesTrend.length > 0 && h(Card, { sx: { mb: 3.5 } },
      h(CardHeader, {
        title: '7-Day Revenue & Order Trends',
        subheader: 'Recent daily revenue performance and order frequency',
        action: h(Typography, { variant: 'caption', color: 'text.secondary', fontWeight: 600 },
          `Total 7d Orders: ${salesTrend.reduce((sum, d) => sum + d.orders, 0)}`
        )
      }),
      h(CardContent, { sx: { pt: 0 } },
        h(Grid, { container: true, spacing: 2, alignItems: 'flex-end', sx: { minHeight: 140, pt: 2 } },
          salesTrend.map((day, idx) => {
            const heightPercent = Math.max(Math.round(((day.sales || 0) / maxSale) * 100), 12);
            return h(Grid, { item: true, xs: 12 / salesTrend.length, key: idx, sx: { textAlign: 'center' } },
              h(Typography, { variant: 'caption', fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 },
                money(day.sales, restaurant?.currency_code)
              ),
              h(Box, {
                sx: {
                  height: `${heightPercent}px`,
                  maxHeight: 100,
                  bgcolor: day.sales > 0 ? 'primary.main' : '#dfd7d0',
                  borderRadius: 1.5,
                  mx: 'auto',
                  width: '75%',
                  transition: 'height 0.3s ease',
                  '&:hover': { bgcolor: 'primary.dark' }
                }
              }),
              h(Typography, { variant: 'caption', fontWeight: 800, mt: 1, display: 'block' }, day.day),
              h(Chip, { label: `${day.orders} ord`, size: 'small', sx: { height: 18, fontSize: '0.65rem', mt: 0.5 } })
            );
          })
        )
      )
    ),

    // Main 2-Column Dashboard Layout
    h(Grid, { container: true, spacing: 3 },
      // Left Column (Recent Activity & Onboarding)
      h(Grid, { item: true, xs: 12, md: 8 },
        h(Stack, { spacing: 3 },
          // Recent Orders Card
          h(Card, null,
            h(CardHeader, {
              title: 'Live Order Stream',
              subheader: 'Most recent orders placed across your locations',
              action: h(Button, { size: 'small', onClick: () => setCurrentView('orders') }, 'View all orders →')
            }),
            h(TableContainer, null,
              h(Table, { size: 'small' },
                h(TableHead, null,
                  h(TableRow, null,
                    h(TableCell, null, 'Order'),
                    h(TableCell, null, 'Customer'),
                    h(TableCell, null, 'Type'),
                    h(TableCell, null, 'Status'),
                    h(TableCell, null, 'Placed'),
                    h(TableCell, { align: 'right' }, 'Total')
                  )
                ),
                h(TableBody, null,
                  recentOrders.length === 0
                    ? h(TableRow, null, h(TableCell, { colSpan: 6, align: 'center', sx: { py: 3 } }, 'No orders received yet today.'))
                    : recentOrders.map(o =>
                        h(TableRow, {
                          key: o.id,
                          sx: { cursor: 'pointer', '&:hover': { bgcolor: '#fffaf6' } },
                          onClick: () => setCurrentView('orders')
                        },
                          h(TableCell, null, h(Typography, { variant: 'body2', fontWeight: 800 }, o.number)),
                          h(TableCell, null, h(Typography, { variant: 'body2', fontWeight: 600 }, o.customer_name)),
                          h(TableCell, null, h(Chip, { label: o.type, size: 'small', variant: 'outlined' })),
                          h(TableCell, null, h(Chip, { label: o.status_name, size: 'small', color: 'primary', sx: { fontWeight: 600 } })),
                          h(TableCell, null, h(Typography, { variant: 'caption', color: 'text.secondary' }, date(o.created_at))),
                          h(TableCell, { align: 'right' }, h(Typography, { variant: 'body2', fontWeight: 800 }, money(o.total, restaurant?.currency_code)))
                        )
                      )
                )
              )
            )
          ),

          // Upcoming Table Reservations Card
          h(Card, null,
            h(CardHeader, {
              title: 'Upcoming Dining Reservations',
              subheader: 'Guests scheduled for dine-in tables',
              action: h(Button, { size: 'small', onClick: () => setCurrentView('reservations') }, 'View all bookings →')
            }),
            h(CardContent, { sx: { pt: 0 } },
              recentReservations.length === 0
                ? h(Typography, { color: 'text.secondary', py: 2, textAlign: 'center' }, 'No reservations booked yet.')
                : h(Stack, { spacing: 1.5 },
                    recentReservations.map(r =>
                      h(Paper, { key: r.id, variant: 'outlined', sx: { p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                        h(Box, null,
                          h(Typography, { variant: 'body2', fontWeight: 700 }, r.guest_name),
                          h(Typography, { variant: 'caption', color: 'text.secondary' }, `${r.date} at ${r.time} • ${r.guests} guests • ${r.telephone || 'No phone'}`)
                        ),
                        h(Chip, { label: r.status_name, size: 'small', color: 'default' })
                      )
                    )
                  )
            )
          ),

          // Onboarding Progress (if incomplete)
          progressPercent < 100 && h(Card, null,
            h(CardHeader, {
              title: 'Getting Ready Checklist',
              subheader: `${completed} of ${onboarding.checks.length} setup tasks completed`,
              action: h(Chip, { label: `${progressPercent}%`, color: 'primary', sx: { fontWeight: 700 } })
            }),
            h(CardContent, null,
              h(LinearProgress, { variant: 'determinate', value: progressPercent, sx: { height: 8, borderRadius: 4, mb: 3 } }),
              h(Grid, { container: true, spacing: 1.5 },
                onboarding.checks.map((chk, idx) =>
                  h(Grid, { item: true, xs: 12, sm: 6, key: idx },
                    h(Paper, {
                      variant: 'outlined',
                      sx: {
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        bgcolor: chk.complete ? '#f0f8f4' : 'transparent',
                        borderColor: chk.complete ? '#cce4d9' : 'divider'
                      }
                    },
                      h(Icon, { name: chk.complete ? 'check_circle' : 'radio_button_unchecked', color: chk.complete ? '#2e7d32' : '#746a62' }),
                      h(Typography, { variant: 'body2', fontWeight: 600, color: chk.complete ? 'success.dark' : 'text.primary' }, chk.label)
                    )
                  )
                )
              )
            )
          )
        )
      ),

      // Right Column (Shortcuts & Health)
      h(Grid, { item: true, xs: 12, md: 4 },
        h(Stack, { spacing: 3 },
          // Quick Shortcuts Card
          h(Card, null,
            h(CardHeader, { title: 'Quick Management Shortcuts' }),
            h(CardContent, { sx: { pt: 0 } },
              h(Stack, { spacing: 1.5 },
                h(Button, { variant: 'contained', color: 'primary', fullWidth: true, onClick: () => setCurrentView('orders') }, '📋 Manage Orders'),
                h(Button, { variant: 'outlined', color: 'secondary', fullWidth: true, onClick: () => setCurrentView('menus') }, '🍽️ Menu & Dishes'),
                h(Button, { variant: 'outlined', color: 'secondary', fullWidth: true, onClick: () => setCurrentView('customers') }, '👥 Customer Directory'),
                h(Button, { variant: 'outlined', color: 'secondary', fullWidth: true, onClick: () => setCurrentView('locations') }, '📍 Branches & Locations'),
                h(Button, { variant: 'outlined', color: 'secondary', fullWidth: true, onClick: () => setCurrentView('brand') }, '🎨 Storefront & Brand'),
                h(Button, { variant: 'outlined', color: 'secondary', fullWidth: true, onClick: () => setCurrentView('restaurant') }, '⚙️ Restaurant Settings')
              )
            )
          ),

          // Restaurant Status & Health Card
          h(Card, null,
            h(CardHeader, { title: 'System & Branch Health' }),
            h(CardContent, null,
              h(Stack, { spacing: 2 },
                h(Box, { sx: { display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #eadfd4' } },
                  h(Typography, { color: 'text.secondary' }, 'Operational Status'),
                  h(Chip, { label: 'Online / Accepting', size: 'small', color: 'success', sx: { fontWeight: 700 } })
                ),
                h(Box, { sx: { display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #eadfd4' } },
                  h(Typography, { color: 'text.secondary' }, 'Active Branches'),
                  h(Typography, { fontWeight: 700 }, `${data?.active_locations || 1} location(s)`)
                ),
                h(Box, { sx: { display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #eadfd4' } },
                  h(Typography, { color: 'text.secondary' }, 'Menu Items Catalog'),
                  h(Typography, { fontWeight: 700 }, `${data?.menu_items || 0} active dishes`)
                ),
                h(Box, { sx: { display: 'flex', justifyContent: 'space-between' } },
                  h(Typography, { color: 'text.secondary' }, 'Storefront Subdomain'),
                  h(Typography, { fontWeight: 700, color: 'primary.main' }, `${restaurant?.slug || 'store'}.vondo.app`)
                )
              )
            )
          )
        )
      )
    )
  );
}

function OrdersView({ data, ownerBootstrap, restaurant, request, notify, refreshView }) {
  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [page, setPage] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [statusComment, setStatusComment] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const orders = data?.data || [];
  const meta = data?.meta || { total: orders.length, per_page: 25 };
  const statuses = ownerBootstrap?.order_statuses || [];
  const locations = ownerBootstrap?.locations || [];

  // Live Auto-Refresh polling (every 15s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refreshView(page + 1, { search, location_id: locationId, status_id: statusId });
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, page, search, locationId, statusId, refreshView]);

  const handleApplyFilters = () => {
    setPage(0);
    refreshView(1, { search, location_id: locationId, status_id: statusId });
  };

  const handleClearFilters = () => {
    setSearch('');
    setLocationId('');
    setStatusId('');
    setPage(0);
    refreshView(1, {});
  };

  const handleStatusChange = async (orderId, newStatus, comment = statusComment, notifyCust = notifyCustomer) => {
    try {
      const res = await request(`/api/v1/owner/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status_id: Number(newStatus), comment: comment || undefined, notify: notifyCust }
      });
      notify('Order status updated.', 'success');
      if (selectedOrder && selectedOrder.id === orderId && res.data) {
        setSelectedOrder(res.data);
      }
      setStatusComment('');
      refreshView(page + 1, { search, location_id: locationId, status_id: statusId });
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // KPI Calculations
  const totalVolume = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const waitingCount = orders.filter(o => o.status_id === 1 || o.status_name?.toLowerCase().includes('received') || o.status_name?.toLowerCase().includes('pending') || o.status_name?.toLowerCase().includes('new')).length;
  const inPrepCount = orders.filter(o => o.status_name?.toLowerCase().includes('prep') || o.status_name?.toLowerCase().includes('cook') || o.status_name?.toLowerCase().includes('process')).length;
  const completedCount = orders.filter(o => o.status_name?.toLowerCase().includes('deliv') || o.status_name?.toLowerCase().includes('complete') || o.status_name?.toLowerCase().includes('done')).length;

  return h(Box, null,
    // Header & Auto-Refresh Bar
    h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 } },
      h(Box, null,
        h(Typography, { variant: 'h4' }, 'Orders Management'),
        h(Typography, { variant: 'subtitle1' }, 'Search, track, and fulfill orders across every restaurant location.')
      ),
      h(Stack, { direction: 'row', spacing: 2, alignItems: 'center' },
        h(Paper, { variant: 'outlined', sx: { px: 2, py: 0.5, display: 'flex', alignItems: 'center', gap: 1, bgcolor: autoRefresh ? '#f0f8f4' : 'transparent' } },
          h(Box, {
            sx: {
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: autoRefresh ? 'success.main' : 'text.disabled',
              animation: autoRefresh ? 'pulse 2s infinite' : 'none'
            }
          }),
          h(Typography, { variant: 'body2', fontWeight: 600, color: autoRefresh ? 'success.dark' : 'text.secondary' },
            autoRefresh ? 'Live refresh on (15s)' : 'Live refresh paused'
          ),
          h(Switch, {
            size: 'small',
            checked: autoRefresh,
            onChange: (e) => setAutoRefresh(e.target.checked),
            color: 'success'
          })
        ),
        h(Button, {
          variant: 'outlined',
          onClick: () => refreshView(page + 1, { search, location_id: locationId, status_id: statusId })
        }, 'Refresh')
      )
    ),

    // KPI Metrics Cards
    h(Grid, { container: true, spacing: 2, sx: { mb: 3 } },
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Orders in view', value: orders.length, icon: 'receipt_long' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'New / Waiting', value: waitingCount, icon: 'schedule', color: 'warning.main' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'In Preparation', value: inPrepCount, icon: 'restaurant', color: 'primary.main' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Total Volume', value: money(totalVolume, restaurant?.currency_code), icon: 'payments', color: 'success.main' })
      )
    ),

    // Filter Bar
    h(Card, { sx: { mb: 3 } },
      h(CardContent, { sx: { p: 2, '&:last-child': { pb: 2 } } },
        h(Grid, { container: true, spacing: 2, alignItems: 'center' },
          h(Grid, { item: true, xs: 12, sm: 4 },
            h(TextField, {
              placeholder: 'Search order #, customer, phone, or email',
              value: search,
              onChange: (e) => setSearch(e.target.value),
              onKeyDown: (e) => e.key === 'Enter' && handleApplyFilters(),
              size: 'small',
              fullWidth: true
            })
          ),
          h(Grid, { item: true, xs: 12, sm: 3 },
            h(FormControl, { size: 'small', fullWidth: true },
              h(InputLabel, null, 'Location'),
              h(Select, { value: locationId, label: 'Location', onChange: (e) => setLocationId(e.target.value) },
                h(MenuItem, { value: '' }, 'All locations'),
                locations.map(l => h(MenuItem, { key: l.id, value: l.id }, l.name))
              )
            )
          ),
          h(Grid, { item: true, xs: 12, sm: 3 },
            h(FormControl, { size: 'small', fullWidth: true },
              h(InputLabel, null, 'Status'),
              h(Select, { value: statusId, label: 'Status', onChange: (e) => setStatusId(e.target.value) },
                h(MenuItem, { value: '' }, 'All statuses'),
                statuses.map(s => h(MenuItem, { key: s.id, value: s.id }, s.name))
              )
            )
          ),
          h(Grid, { item: true, xs: 12, sm: 2 },
            h(Stack, { direction: 'row', spacing: 1 },
              h(Button, { variant: 'contained', color: 'primary', fullWidth: true, onClick: handleApplyFilters }, 'Filter'),
              (search || locationId || statusId) && h(Button, { variant: 'outlined', color: 'secondary', onClick: handleClearFilters }, 'Clear')
            )
          )
        )
      )
    ),

    // Orders Table
    h(Card, null,
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Order #'),
              h(TableCell, null, 'Customer'),
              h(TableCell, null, 'Type'),
              h(TableCell, null, 'Location'),
              h(TableCell, null, 'Items Summary'),
              h(TableCell, null, 'Schedule'),
              h(TableCell, null, 'Total'),
              h(TableCell, null, 'Status'),
              h(TableCell, { align: 'right' }, 'Actions')
            )
          ),
          h(TableBody, null,
            orders.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 9, align: 'center', sx: { py: 5 } },
                  h(Box, { sx: { textAlign: 'center' } },
                    h(Icon, { name: 'receipt_long', sx: { fontSize: 44, color: '#c5b8b0', mb: 1 } }),
                    h(Typography, { color: 'text.secondary' }, 'No orders match the selected filters.')
                  )
                ))
              : orders.map(order => {
                  const typeLabel = (order.type || 'Standard').toUpperCase();
                  const isDelivery = typeLabel.includes('DELIV');
                  return h(TableRow, { key: order.id, sx: { '&:hover': { bgcolor: '#fffaf6' } } },
                    h(TableCell, null,
                      h(Typography, { variant: 'body2', fontWeight: 800, color: 'primary.main' }, order.number),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, `${order.items_count || order.items?.length || 0} items`)
                    ),
                    h(TableCell, null,
                      h(Typography, { variant: 'body2', fontWeight: 700 }, order.customer_name),
                      order.customer_phone && h('a', { href: `tel:${order.customer_phone}`, style: { textDecoration: 'none', color: '#746a62', fontSize: 12, display: 'block' } }, order.customer_phone)
                    ),
                    h(TableCell, null,
                      h(Chip, {
                        label: isDelivery ? '🚚 Delivery' : '🛍️ Pickup',
                        size: 'small',
                        sx: { fontWeight: 700, bgcolor: isDelivery ? '#e3f2fd' : '#fff3e0', color: isDelivery ? '#0d47a1' : '#e65100' }
                      })
                    ),
                    h(TableCell, null, order.location_name || '—'),
                    h(TableCell, { sx: { maxWidth: 200 } },
                      h(Typography, { variant: 'body2', noWrap: true, color: 'text.secondary' },
                        (order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ') || `${order.items_count || 1} items`
                      )
                    ),
                    h(TableCell, null,
                      h(Typography, { variant: 'body2', fontWeight: 600 }, date(order.scheduled_for || order.created_at)),
                      order.scheduled_for && h(Typography, { variant: 'caption', color: 'text.secondary' }, new Date(order.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
                    ),
                    h(TableCell, null,
                      h(Typography, { variant: 'body2', fontWeight: 800 }, money(order.total, restaurant?.currency_code)),
                      h(Typography, { variant: 'caption', color: 'text.secondary', textTransform: 'uppercase' }, order.payment_method || 'COD')
                    ),
                    h(TableCell, null,
                      h(FormControl, { size: 'small', sx: { minWidth: 130 } },
                        h(Select, {
                          value: order.status_id,
                          onChange: (e) => handleStatusChange(order.id, e.target.value),
                          sx: { fontSize: '0.85rem', fontWeight: 600 }
                        },
                          statuses.map(s => h(MenuItem, { key: s.id, value: s.id }, s.name))
                        )
                      )
                    ),
                    h(TableCell, { align: 'right' },
                      h(Stack, { direction: 'row', spacing: 1, justifyContent: 'flex-end' },
                        h(Button, { size: 'small', variant: 'contained', color: 'secondary', onClick: () => setSelectedOrder(order) }, 'Details'),
                        h(IconButton, { size: 'small', color: 'primary', title: 'Print Receipt', onClick: () => printOrderReceipt(order, restaurant) },
                          h(Icon, { name: 'print' })
                        )
                      )
                    )
                  );
                })
          )
        )
      ),
      h(TablePagination, {
        component: 'div',
        count: meta.total || orders.length,
        page: page,
        rowsPerPage: 25,
        rowsPerPageOptions: [25],
        onPageChange: (_, newPage) => {
          setPage(newPage);
          refreshView(newPage + 1, { search, location_id: locationId, status_id: statusId });
        }
      })
    ),

    // Comprehensive Order Details Modal
    selectedOrder && h(Dialog, { open: true, onClose: () => setSelectedOrder(null), maxWidth: 'md', fullWidth: true },
      h(DialogTitle, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 } },
        h(Box, null,
          h(Typography, { variant: 'h5', fontWeight: 800 }, `Order ${selectedOrder.number}`),
          h(Typography, { variant: 'caption', color: 'text.secondary' }, `Placed ${date(selectedOrder.created_at || selectedOrder.scheduled_for)} • Branch: ${selectedOrder.location_name || 'Main Location'}`)
        ),
        h(Stack, { direction: 'row', spacing: 1, alignItems: 'center' },
          h(Chip, { label: selectedOrder.status_name || 'New', color: 'primary', sx: { fontWeight: 700 } }),
          h(Button, { size: 'small', variant: 'outlined', onClick: () => printOrderReceipt(selectedOrder, restaurant) }, 'Print Receipt')
        )
      ),
      h(DialogContent, { dividers: true },
        h(Grid, { container: true, spacing: 2.5 },
          // Customer & Delivery Info Card
          h(Grid, { item: true, xs: 12, md: 5 },
            h(Paper, { variant: 'outlined', sx: { p: 2, height: '100%' } },
              h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1 }, 'Customer & Fulfillment'),
              h(Typography, { variant: 'body1', fontWeight: 700 }, selectedOrder.customer_name),
              selectedOrder.customer_phone && h(Box, { sx: { mt: 0.5 } },
                h('a', { href: `tel:${selectedOrder.customer_phone}`, style: { color: '#b84f2e', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' } }, `📞 ${selectedOrder.customer_phone}`)
              ),
              selectedOrder.customer_email && h(Box, { sx: { mt: 0.5 } },
                h('a', { href: `mailto:${selectedOrder.customer_email}`, style: { color: '#746a62', textDecoration: 'none', fontSize: '0.85rem' } }, `✉️ ${selectedOrder.customer_email}`)
              ),
              h(Divider, { sx: { my: 1.5 } }),
              h(Typography, { variant: 'caption', fontWeight: 700, color: 'text.secondary' }, 'ORDER TYPE & DESTINATION'),
              h(Typography, { variant: 'body2', fontWeight: 600, mt: 0.5 }, selectedOrder.type || 'Standard Service'),
              selectedOrder.delivery_address && h(Box, { sx: { mt: 0.5 } },
                h(Typography, { variant: 'body2' }, `📍 ${selectedOrder.delivery_address}`),
                h('a', {
                  href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.delivery_address)}`,
                  target: '_blank',
                  rel: 'noopener',
                  style: { fontSize: 12, color: '#b84f2e', fontWeight: 600 }
                }, 'Open in Google Maps')
              ),
              selectedOrder.comment && h(Alert, { severity: 'info', sx: { mt: 2, '& .MuiAlert-message': { fontSize: '0.85rem' } } },
                h(Typography, { variant: 'caption', fontWeight: 700, display: 'block' }, 'CUSTOMER NOTE:'),
                selectedOrder.comment
              )
            )
          ),

          // Items Breakdown Card
          h(Grid, { item: true, xs: 12, md: 7 },
            h(Paper, { variant: 'outlined', sx: { p: 2 } },
              h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1 }, 'Order Items Breakdown'),
              h(List, { disablePadding: true },
                (selectedOrder.items || []).map((item, idx) =>
                  h(ListItem, { key: idx, divider: idx < selectedOrder.items.length - 1, sx: { px: 0, py: 1.5 } },
                    h(ListItemText, {
                      primary: h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                        h(Typography, { variant: 'body1', fontWeight: 700 }, `${item.quantity}x ${item.name}`),
                        h(Typography, { variant: 'body1', fontWeight: 700 }, money(item.subtotal || (item.price * item.quantity), restaurant?.currency_code))
                      ),
                      secondary: h(Box, { sx: { mt: 0.5 } },
                        (item.options || []).map((opt, optIdx) =>
                          h(Typography, { key: optIdx, variant: 'caption', display: 'block', color: 'text.secondary', pl: 1 },
                            `• ${opt.quantity > 1 ? opt.quantity + 'x ' : ''}${opt.name} ${opt.price ? `(+${money(opt.price, restaurant?.currency_code)})` : ''}`
                          )
                        ),
                        item.comment && h(Typography, { variant: 'caption', fontStyle: 'italic', color: 'warning.dark', display: 'block', pl: 1, mt: 0.5 },
                          `"${item.comment}"`
                        )
                      )
                    })
                  )
                )
              ),
              h(Divider, { sx: { my: 1.5 } }),
              h(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 0.5 } },
                h(Typography, { variant: 'body2', color: 'text.secondary' }, 'Payment Method:'),
                h(Typography, { variant: 'body2', fontWeight: 600, textTransform: 'uppercase' }, selectedOrder.payment_method || 'COD')
              ),
              h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                h(Typography, { variant: 'h6', fontWeight: 800 }, 'Total Amount:'),
                h(Typography, { variant: 'h5', fontWeight: 800, color: 'primary.main' }, money(selectedOrder.total, restaurant?.currency_code))
              )
            )
          ),

          // Status Transition with Notes Form
          h(Grid, { item: true, xs: 12 },
            h(Paper, { variant: 'outlined', sx: { p: 2, bgcolor: '#fffaf4' } },
              h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1.5 }, 'Update Order Status & Notify Customer'),
              h(Grid, { container: true, spacing: 2, alignItems: 'center' },
                h(Grid, { item: true, xs: 12, sm: 4 },
                  h(FormControl, { size: 'small', fullWidth: true },
                    h(InputLabel, null, 'Change status to'),
                    h(Select, {
                      value: selectedOrder.status_id,
                      label: 'Change status to',
                      onChange: (e) => handleStatusChange(selectedOrder.id, e.target.value, statusComment, notifyCustomer)
                    },
                      statuses.map(s => h(MenuItem, { key: s.id, value: s.id }, s.name))
                    )
                  )
                ),
                h(Grid, { item: true, xs: 12, sm: 5 },
                  h(TextField, {
                    label: 'Status note / comment (optional)',
                    value: statusComment,
                    onChange: (e) => setStatusComment(e.target.value),
                    size: 'small',
                    fullWidth: true
                  })
                ),
                h(Grid, { item: true, xs: 12, sm: 3 },
                  h(FormControlLabel, {
                    control: h(Checkbox, { checked: notifyCustomer, onChange: (e) => setNotifyCustomer(e.target.checked) }),
                    label: 'Notify customer'
                  })
                )
              )
            )
          ),

          // Status Timeline History
          selectedOrder.timeline?.length > 0 && h(Grid, { item: true, xs: 12 },
            h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1 }, 'Status History Timeline'),
            h(Stack, { spacing: 1 },
              selectedOrder.timeline.map((hist, histIdx) =>
                h(Paper, { key: histIdx, variant: 'outlined', sx: { p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                  h(Box, null,
                    h(Chip, { label: hist.status, size: 'small', sx: { mr: 1, fontWeight: 700 } }),
                    hist.comment && h(Typography, { variant: 'body2', component: 'span', color: 'text.secondary' }, hist.comment)
                  ),
                  h(Typography, { variant: 'caption', color: 'text.secondary' }, date(hist.created_at))
                )
              )
            )
          )
        )
      ),
      h(DialogActions, { sx: { p: 2 } },
        h(Button, { onClick: () => setSelectedOrder(null) }, 'Close')
      )
    )
  );
}

function ReservationsView({ data, ownerBootstrap, request, notify, refreshView }) {
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusId, setStatusId] = useState('');
  const [page, setPage] = useState(0);

  const reservations = data?.data || [];
  const meta = data?.meta || { total: reservations.length };
  const statuses = ownerBootstrap?.reservation_statuses || [];

  const handleStatusChange = async (resId, newStatus) => {
    try {
      await request(`/api/v1/owner/reservations/${resId}/status`, {
        method: 'PATCH',
        body: { status_id: Number(newStatus), notify: true }
      });
      notify('Reservation status updated.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Reservations'),
      h(Typography, { variant: 'subtitle1' }, 'Manage guest bookings and confirmation status.')
    ),
    // Filter Bar
    h(Card, { sx: { mb: 3 } },
      h(CardContent, { sx: { p: 2, '&:last-child': { pb: 2 } } },
        h(Grid, { container: true, spacing: 2, alignItems: 'center' },
          h(Grid, { item: true, xs: 12, sm: 3 },
            h(TextField, {
              placeholder: 'Search guest, email or phone',
              value: search,
              onChange: (e) => setSearch(e.target.value),
              size: 'small',
              fullWidth: true
            })
          ),
          h(Grid, { item: true, xs: 12, sm: 2.5 },
            h(TextField, {
              label: 'From date',
              type: 'date',
              value: fromDate,
              onChange: (e) => setFromDate(e.target.value),
              size: 'small',
              fullWidth: true,
              InputLabelProps: { shrink: true }
            })
          ),
          h(Grid, { item: true, xs: 12, sm: 2.5 },
            h(TextField, {
              label: 'To date',
              type: 'date',
              value: toDate,
              onChange: (e) => setToDate(e.target.value),
              size: 'small',
              fullWidth: true,
              InputLabelProps: { shrink: true }
            })
          ),
          h(Grid, { item: true, xs: 12, sm: 2.5 },
            h(FormControl, { size: 'small', fullWidth: true },
              h(InputLabel, null, 'Status'),
              h(Select, { value: statusId, label: 'Status', onChange: (e) => setStatusId(e.target.value) },
                h(MenuItem, { value: '' }, 'All statuses'),
                statuses.map(s => h(MenuItem, { key: s.id, value: s.id }, s.name))
              )
            )
          ),
          h(Grid, { item: true, xs: 12, sm: 1.5 },
            h(Button, { variant: 'contained', color: 'primary', fullWidth: true, onClick: () => refreshView() }, 'Apply')
          )
        )
      )
    ),
    // Table
    h(Card, null,
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Guest'),
              h(TableCell, null, 'When'),
              h(TableCell, null, 'Location'),
              h(TableCell, null, 'Guests'),
              h(TableCell, null, 'Phone'),
              h(TableCell, null, 'Status')
            )
          ),
          h(TableBody, null,
            reservations.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 6, align: 'center', sx: { py: 4 } }, 'No reservations match these filters.'))
              : reservations.map(r =>
                  h(TableRow, { key: r.id },
                    h(TableCell, null, h(Typography, { variant: 'body2', fontWeight: 700 }, r.guest_name)),
                    h(TableCell, null,
                      h(Typography, { variant: 'body2' }, r.date),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, r.time)
                    ),
                    h(TableCell, null, r.location_name || '—'),
                    h(TableCell, null, r.guests),
                    h(TableCell, null, r.telephone || '—'),
                    h(TableCell, null,
                      h(FormControl, { size: 'small', sx: { minWidth: 140 } },
                        h(Select, { value: r.status_id, onChange: (e) => handleStatusChange(r.id, e.target.value) },
                          statuses.map(s => h(MenuItem, { key: s.id, value: s.id }, s.name))
                        )
                      )
                    )
                  )
                )
          )
        )
      ),
      h(TablePagination, {
        component: 'div',
        count: meta.total || reservations.length,
        page: page,
        rowsPerPage: 25,
        rowsPerPageOptions: [25],
        onPageChange: (_, newPage) => setPage(newPage)
      })
    )
  );
}

function MenusView({ data, ownerBootstrap, restaurant, request, notify, refreshView, bootstrapSession }) {
  const [search, setSearch] = useState('');
  const [menuModal, setMenuModal] = useState({ open: false, item: null });
  const [categoryModal, setCategoryModal] = useState(false);
  const [editCategoryModal, setEditCategoryModal] = useState({ open: false, category: null });

  const items = data?.data || [];
  const categories = ownerBootstrap?.categories || [];

  const handleToggleAvailability = async (item, checked) => {
    try {
      await request(`/api/v1/owner/menus/${item.id}`, {
        method: 'PATCH',
        body: { is_available: checked }
      });
      notify('Menu availability updated.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 } },
      h(Box, null,
        h(Typography, { variant: 'h4' }, 'Menu management'),
        h(Typography, { variant: 'subtitle1' }, 'Create dishes, organize categories, update prices, and control availability.')
      ),
      h(Stack, { direction: 'row', spacing: 1.5 },
        h(Button, { variant: 'outlined', color: 'secondary', onClick: () => setCategoryModal(true) }, 'Manage categories'),
        h(Button, { variant: 'contained', color: 'primary', onClick: () => setMenuModal({ open: true, item: null }) }, 'Add menu item')
      )
    ),
    // Menus Table
    h(Card, null,
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Item'),
              h(TableCell, null, 'Categories'),
              h(TableCell, null, 'Description'),
              h(TableCell, null, 'Price'),
              h(TableCell, null, 'Available'),
              h(TableCell, { align: 'right' }, 'Action')
            )
          ),
          h(TableBody, null,
            items.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 6, align: 'center', sx: { py: 4 } }, 'No menu items found.'))
              : items.map(m =>
                  h(TableRow, { key: m.id },
                    h(TableCell, null, h(Typography, { variant: 'body2', fontWeight: 700 }, m.name)),
                    h(TableCell, null,
                      (m.category_ids || []).map(cid => {
                        const cat = categories.find(c => c.id === cid);
                        return cat ? h(Chip, { key: cid, label: cat.name, size: 'small', sx: { mr: 0.5, mb: 0.5 } }) : null;
                      })
                    ),
                    h(TableCell, { sx: { maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, m.description || '—'),
                    h(TableCell, null, h(Typography, { variant: 'body2', fontWeight: 700 }, money(m.price, restaurant?.currency_code))),
                    h(TableCell, null,
                      h(FormControlLabel, {
                        control: h(Switch, {
                          checked: !!m.is_available,
                          onChange: (e) => handleToggleAvailability(m, e.target.checked),
                          color: 'success'
                        }),
                        label: m.is_available ? 'Available' : 'Unavailable'
                      })
                    ),
                    h(TableCell, { align: 'right' },
                      h(Button, { size: 'small', variant: 'outlined', onClick: () => setMenuModal({ open: true, item: m }) }, 'Edit')
                    )
                  )
                )
          )
        )
      )
    ),

    // Add / Edit Menu Item Dialog
    menuModal.open && h(Dialog, { open: true, onClose: () => setMenuModal({ open: false, item: null }), maxWidth: 'sm', fullWidth: true },
      h('form', {
        onSubmit: async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          const category_ids = [...form.querySelectorAll('[name="category_ids"]:checked')].map(i => Number(i.value));
          const body = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: Number(formData.get('price')),
            is_available: form.is_available.checked,
            category_ids
          };
          try {
            if (menuModal.item) {
              await request(`/api/v1/owner/menus/${menuModal.item.id}`, { method: 'PATCH', body });
              notify('Menu item updated.', 'success');
            } else {
              await request('/api/v1/owner/menus', { method: 'POST', body });
              notify('Menu item created.', 'success');
            }
            setMenuModal({ open: false, item: null });
            refreshView();
            bootstrapSession();
          } catch (err) {
            notify(err.message, 'error');
          }
        }
      },
        h(DialogTitle, null, menuModal.item ? 'Edit menu item' : 'Add menu item'),
        h(DialogContent, null,
          h(Stack, { spacing: 2, mt: 1 },
            h(TextField, { label: 'Name', name: 'name', defaultValue: menuModal.item?.name || '', required: true, fullWidth: true, size: 'small' }),
            h(TextField, { label: 'Description', name: 'description', defaultValue: menuModal.item?.description || '', multiline: true, rows: 3, fullWidth: true, size: 'small' }),
            h(TextField, { label: 'Price', name: 'price', type: 'number', inputProps: { min: 0, step: 0.01 }, defaultValue: menuModal.item?.price ?? 0, required: true, fullWidth: true, size: 'small' }),
            h(FormControlLabel, {
              control: h(Checkbox, { name: 'is_available', defaultChecked: menuModal.item ? !!menuModal.item.is_available : true }),
              label: 'Available for ordering'
            }),
            h(Box, null,
              h(Typography, { variant: 'subtitle2', mb: 1 }, 'Categories'),
              categories.length === 0
                ? h(Typography, { variant: 'caption', color: 'text.secondary' }, 'Please create a category first.')
                : h(FormGroup, { row: true },
                    categories.map(cat =>
                      h(FormControlLabel, {
                        key: cat.id,
                        control: h(Checkbox, {
                          name: 'category_ids',
                          value: cat.id,
                          defaultChecked: menuModal.item?.category_ids?.includes(cat.id)
                        }),
                        label: cat.name
                      })
                    )
                  )
            )
          )
        ),
        h(DialogActions, { sx: { p: 2.5 } },
          h(Button, { onClick: () => setMenuModal({ open: false, item: null }) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, menuModal.item ? 'Save changes' : 'Create menu item')
        )
      )
    ),

    // Category Manager Dialog
    categoryModal && h(Dialog, { open: true, onClose: () => setCategoryModal(false), maxWidth: 'sm', fullWidth: true },
      h(DialogTitle, null, 'Menu Categories'),
      h(DialogContent, null,
        h(List, { sx: { mb: 2 } },
          categories.map(cat =>
            h(ListItem, {
              key: cat.id,
              secondaryAction: h(Button, { size: 'small', onClick: () => setEditCategoryModal({ open: true, category: cat }) }, 'Edit')
            },
              h(ListItemText, {
                primary: cat.name,
                secondary: cat.is_active ? 'Active' : 'Disabled'
              })
            )
          )
        ),
        h(Divider, { sx: { my: 2 } }),
        h(Typography, { variant: 'subtitle2', mb: 1 }, 'Add new category'),
        h('form', {
          onSubmit: async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const body = {
              name: form.name.value,
              description: form.description.value,
              is_active: form.is_active.checked
            };
            try {
              await request('/api/v1/owner/categories', { method: 'POST', body });
              notify('Category created.', 'success');
              bootstrapSession();
              refreshView();
              form.reset();
            } catch (err) {
              notify(err.message, 'error');
            }
          }
        },
          h(Stack, { spacing: 2 },
            h(TextField, { label: 'Category Name', name: 'name', required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'Description', name: 'description', multiline: true, rows: 2, size: 'small', fullWidth: true }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'is_active', defaultChecked: true }), label: 'Active category' }),
            h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Create category')
          )
        )
      ),
      h(DialogActions, null,
        h(Button, { onClick: () => setCategoryModal(false) }, 'Close')
      )
    ),

    // Edit Category Dialog
    editCategoryModal.open && h(Dialog, { open: true, onClose: () => setEditCategoryModal({ open: false, category: null }), maxWidth: 'xs', fullWidth: true },
      h('form', {
        onSubmit: async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const body = {
            name: form.name.value,
            description: form.description.value,
            is_active: form.is_active.checked
          };
          try {
            await request(`/api/v1/owner/categories/${editCategoryModal.category.id}`, { method: 'PATCH', body });
            notify('Category updated.', 'success');
            setEditCategoryModal({ open: false, category: null });
            bootstrapSession();
            refreshView();
          } catch (err) {
            notify(err.message, 'error');
          }
        }
      },
        h(DialogTitle, null, 'Edit Category'),
        h(DialogContent, null,
          h(Stack, { spacing: 2, mt: 1 },
            h(TextField, { label: 'Category Name', name: 'name', defaultValue: editCategoryModal.category?.name || '', required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'Description', name: 'description', defaultValue: editCategoryModal.category?.description || '', multiline: true, rows: 2, size: 'small', fullWidth: true }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'is_active', defaultChecked: !!editCategoryModal.category?.is_active }), label: 'Active category' })
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setEditCategoryModal({ open: false, category: null }) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Save category')
        )
      )
    )
  );
}

function CustomersView({ data, restaurant, request, notify, refreshView }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, customer: null });
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const customers = data?.data || [];
  const meta = data?.meta || { total: customers.length, per_page: 25 };

  const handleApplyFilters = () => {
    setPage(0);
    refreshView(1, { search, status: statusFilter });
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(0);
    refreshView(1, {});
  };

  const handleOpenDetail = async (customerId) => {
    setSelectedCustomerId(customerId);
    setDetailLoading(true);
    try {
      const res = await request(`/api/v1/owner/customers/${customerId}`);
      setCustomerDetail(res.data);
    } catch (err) {
      notify(err.message, 'error');
      setSelectedCustomerId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    body.status = form.status ? form.status.checked : true;
    if (!body.password) delete body.password;
    try {
      await request('/api/v1/owner/customers', { method: 'POST', body });
      notify('Customer account created.', 'success');
      setCreateModal(false);
      refreshView(page + 1, { search, status: statusFilter });
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    body.status = form.edit_status ? form.edit_status.checked : false;
    delete body.edit_status;
    if (!body.password) delete body.password;
    try {
      await request(`/api/v1/owner/customers/${editModal.customer.id}`, { method: 'PATCH', body });
      notify('Customer profile updated.', 'success');
      setEditModal({ open: false, customer: null });
      if (selectedCustomerId === editModal.customer.id) {
        handleOpenDetail(editModal.customer.id);
      }
      refreshView(page + 1, { search, status: statusFilter });
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleToggleStatus = async (customer) => {
    try {
      await request(`/api/v1/owner/customers/${customer.id}`, {
        method: 'PATCH',
        body: { status: !customer.status }
      });
      notify(`Customer ${!customer.status ? 'activated' : 'deactivated'}.`, 'success');
      refreshView(page + 1, { search, status: statusFilter });
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteCustomer = async (customer) => {
    if (!window.confirm(`Permanently delete customer "${customer.name || customer.email}"?`)) return;
    try {
      await request(`/api/v1/owner/customers/${customer.id}`, { method: 'DELETE' });
      notify('Customer deleted.', 'success');
      if (selectedCustomerId === customer.id) setSelectedCustomerId(null);
      refreshView(page + 1, { search, status: statusFilter });
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // KPI Calculations
  const activeCount = customers.filter(c => c.status).length;
  const repeatCount = customers.filter(c => Number(c.orders_count) > 1).length;
  const totalSpend = customers.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0);

  return h(Box, null,
    // Header & Actions
    h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 } },
      h(Box, null,
        h(Typography, { variant: 'h4' }, 'Customer Directory'),
        h(Typography, { variant: 'subtitle1' }, 'Manage restaurant patrons, delivery addresses, and purchasing profiles.')
      ),
      h(Button, { variant: 'contained', color: 'primary', onClick: () => setCreateModal(true) }, '+ Add customer')
    ),

    // KPI Metrics Cards
    h(Grid, { container: true, spacing: 2, sx: { mb: 3 } },
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Total Customers', value: meta.total || customers.length, icon: 'people' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Active Accounts', value: activeCount, icon: 'verified_user', color: 'success.main' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Repeat Customers', value: repeatCount, icon: 'loyalty', color: 'primary.main' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Tracked Spend', value: money(totalSpend, restaurant?.currency_code), icon: 'paid', color: 'warning.main' })
      )
    ),

    // Filter Bar
    h(Card, { sx: { mb: 3 } },
      h(CardContent, { sx: { p: 2, '&:last-child': { pb: 2 } } },
        h(Grid, { container: true, spacing: 2, alignItems: 'center' },
          h(Grid, { item: true, xs: 12, sm: 6 },
            h(TextField, {
              placeholder: 'Search customer name, email, or telephone',
              value: search,
              onChange: (e) => setSearch(e.target.value),
              onKeyDown: (e) => e.key === 'Enter' && handleApplyFilters(),
              size: 'small',
              fullWidth: true
            })
          ),
          h(Grid, { item: true, xs: 12, sm: 3 },
            h(FormControl, { size: 'small', fullWidth: true },
              h(InputLabel, null, 'Status'),
              h(Select, { value: statusFilter, label: 'Status', onChange: (e) => setStatusFilter(e.target.value) },
                h(MenuItem, { value: '' }, 'All statuses'),
                h(MenuItem, { value: '1' }, 'Active only'),
                h(MenuItem, { value: '0' }, 'Disabled only')
              )
            )
          ),
          h(Grid, { item: true, xs: 12, sm: 3 },
            h(Stack, { direction: 'row', spacing: 1 },
              h(Button, { variant: 'contained', color: 'primary', fullWidth: true, onClick: handleApplyFilters }, 'Filter'),
              (search || statusFilter) && h(Button, { variant: 'outlined', color: 'secondary', onClick: handleClearFilters }, 'Clear')
            )
          )
        )
      )
    ),

    // Customers Table
    h(Card, null,
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Customer'),
              h(TableCell, null, 'Contact Info'),
              h(TableCell, null, 'Orders'),
              h(TableCell, null, 'Total Spend'),
              h(TableCell, null, 'Status'),
              h(TableCell, null, 'Member Since'),
              h(TableCell, { align: 'right' }, 'Actions')
            )
          ),
          h(TableBody, null,
            customers.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 7, align: 'center', sx: { py: 5 } },
                  h(Box, { sx: { textAlign: 'center' } },
                    h(Icon, { name: 'person_off', sx: { fontSize: 44, color: '#c5b8b0', mb: 1 } }),
                    h(Typography, { color: 'text.secondary' }, 'No customers found matching these filters.')
                  )
                ))
              : customers.map(c => {
                  const initials = (c.first_name?.[0] || c.name?.[0] || 'C').toUpperCase();
                  return h(TableRow, { key: c.id, sx: { '&:hover': { bgcolor: '#fffaf6' } } },
                    h(TableCell, null,
                      h(Stack, { direction: 'row', spacing: 1.5, alignItems: 'center' },
                        h(Avatar, { sx: { bgcolor: 'primary.light', color: 'primary.contrastText', width: 36, height: 36, fontWeight: 700, fontSize: '0.85rem' } }, initials),
                        h(Box, null,
                          h(Typography, { variant: 'body2', fontWeight: 700 }, c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unnamed'),
                          h(Typography, { variant: 'caption', color: 'text.secondary' }, `ID #${c.id}`)
                        )
                      )
                    ),
                    h(TableCell, null,
                      h('a', { href: `mailto:${c.email}`, style: { textDecoration: 'none', color: '#27211d', fontWeight: 600, display: 'block', fontSize: '0.85rem' } }, c.email),
                      c.telephone ? h('a', { href: `tel:${c.telephone}`, style: { textDecoration: 'none', color: '#746a62', fontSize: 12, display: 'block' } }, c.telephone) : h(Typography, { variant: 'caption', color: 'text.disabled' }, 'No phone')
                    ),
                    h(TableCell, null,
                      h(Chip, {
                        label: `${c.orders_count ?? 0} orders`,
                        size: 'small',
                        color: Number(c.orders_count) > 0 ? 'primary' : 'default',
                        variant: Number(c.orders_count) > 0 ? 'filled' : 'outlined'
                      })
                    ),
                    h(TableCell, null,
                      h(Typography, { variant: 'body2', fontWeight: 800, color: Number(c.total_spent) > 0 ? 'success.dark' : 'text.secondary' },
                        money(c.total_spent || 0, restaurant?.currency_code)
                      )
                    ),
                    h(TableCell, null,
                      h(Chip, {
                        label: c.status ? 'Active' : 'Disabled',
                        size: 'small',
                        color: c.status ? 'success' : 'default',
                        onClick: () => handleToggleStatus(c),
                        sx: { cursor: 'pointer', fontWeight: 600 }
                      })
                    ),
                    h(TableCell, null,
                      h(Typography, { variant: 'body2' }, date(c.created_at))
                    ),
                    h(TableCell, { align: 'right' },
                      h(Stack, { direction: 'row', spacing: 1, justifyContent: 'flex-end' },
                        h(Button, { size: 'small', variant: 'contained', color: 'secondary', onClick: () => handleOpenDetail(c.id) }, 'Profile'),
                        h(Button, { size: 'small', variant: 'outlined', onClick: () => setEditModal({ open: true, customer: c }) }, 'Edit'),
                        h(IconButton, { size: 'small', color: 'error', title: 'Delete customer', onClick: () => handleDeleteCustomer(c) },
                          h(Icon, { name: 'delete' })
                        )
                      )
                    )
                  );
                })
          )
        )
      ),
      h(TablePagination, {
        component: 'div',
        count: meta.total || customers.length,
        page: page,
        rowsPerPage: 25,
        rowsPerPageOptions: [25],
        onPageChange: (_, newPage) => {
          setPage(newPage);
          refreshView(newPage + 1, { search, status: statusFilter });
        }
      })
    ),

    // Create Customer Modal
    createModal && h(Dialog, { open: true, onClose: () => setCreateModal(false), maxWidth: 'sm', fullWidth: true },
      h('form', { onSubmit: handleCreateCustomer },
        h(DialogTitle, null, 'Add new customer'),
        h(DialogContent, null,
          h(Grid, { container: true, spacing: 2, mt: 0.5 },
            h(Grid, { item: true, xs: 12, sm: 6 },
              h(TextField, { label: 'First Name', name: 'first_name', required: true, size: 'small', fullWidth: true })
            ),
            h(Grid, { item: true, xs: 12, sm: 6 },
              h(TextField, { label: 'Last Name', name: 'last_name', required: true, size: 'small', fullWidth: true })
            ),
            h(Grid, { item: true, xs: 12 },
              h(TextField, { label: 'Email address', name: 'email', type: 'email', required: true, size: 'small', fullWidth: true })
            ),
            h(Grid, { item: true, xs: 12, sm: 6 },
              h(TextField, { label: 'Telephone', name: 'telephone', placeholder: '+1 234 567 8900', size: 'small', fullWidth: true })
            ),
            h(Grid, { item: true, xs: 12, sm: 6 },
              h(TextField, { label: 'Password (optional)', name: 'password', type: 'password', size: 'small', fullWidth: true, helperText: 'Min 6 characters' })
            ),
            h(Grid, { item: true, xs: 12 },
              h(FormControlLabel, { control: h(Checkbox, { name: 'status', defaultChecked: true }), label: 'Active customer account' })
            )
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setCreateModal(false) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Create customer')
        )
      )
    ),

    // Edit Customer Modal
    editModal.open && h(Dialog, { open: true, onClose: () => setEditModal({ open: false, customer: null }), maxWidth: 'sm', fullWidth: true },
      h('form', { onSubmit: handleUpdateCustomer },
        h(DialogTitle, null, `Edit Customer: ${editModal.customer?.name}`),
        h(DialogContent, null,
          h(Grid, { container: true, spacing: 2, mt: 0.5 },
            h(Grid, { item: true, xs: 12, sm: 6 },
              h(TextField, { label: 'First Name', name: 'first_name', defaultValue: editModal.customer?.first_name || editModal.customer?.name?.split(' ')[0] || '', required: true, size: 'small', fullWidth: true })
            ),
            h(Grid, { item: true, xs: 12, sm: 6 },
              h(TextField, { label: 'Last Name', name: 'last_name', defaultValue: editModal.customer?.last_name || editModal.customer?.name?.split(' ').slice(1).join(' ') || '', required: true, size: 'small', fullWidth: true })
            ),
            h(Grid, { item: true, xs: 12 },
              h(TextField, { label: 'Email address', name: 'email', type: 'email', defaultValue: editModal.customer?.email || '', required: true, size: 'small', fullWidth: true })
            ),
            h(Grid, { item: true, xs: 12, sm: 6 },
              h(TextField, { label: 'Telephone', name: 'telephone', defaultValue: editModal.customer?.telephone || '', size: 'small', fullWidth: true })
            ),
            h(Grid, { item: true, xs: 12, sm: 6 },
              h(TextField, { label: 'New Password (optional)', name: 'password', type: 'password', size: 'small', fullWidth: true, helperText: 'Leave empty to keep unchanged' })
            ),
            h(Grid, { item: true, xs: 12 },
              h(FormControlLabel, { control: h(Checkbox, { name: 'edit_status', defaultChecked: Boolean(editModal.customer?.status) }), label: 'Active customer account' })
            )
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setEditModal({ open: false, customer: null }) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Save changes')
        )
      )
    ),

    // 360° Customer Profile Modal
    selectedCustomerId && h(Dialog, { open: true, onClose: () => { setSelectedCustomerId(null); setCustomerDetail(null); }, maxWidth: 'md', fullWidth: true },
      detailLoading || !customerDetail
        ? h(DialogContent, { sx: { py: 8, textAlign: 'center' } },
            h(CircularProgress, { color: 'primary' }),
            h(Typography, { color: 'text.secondary', mt: 2 }, 'Loading full customer profile...')
          )
        : h(Box, null,
            h(DialogTitle, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 } },
              h(Stack, { direction: 'row', spacing: 2, alignItems: 'center' },
                h(Avatar, { sx: { bgcolor: 'primary.main', width: 48, height: 48, fontWeight: 800, fontSize: '1.1rem' } },
                  (customerDetail.first_name?.[0] || customerDetail.name?.[0] || 'C').toUpperCase()
                ),
                h(Box, null,
                  h(Typography, { variant: 'h5', fontWeight: 800 }, customerDetail.name),
                  h(Typography, { variant: 'caption', color: 'text.secondary' }, `Member since ${date(customerDetail.created_at)} • ID #${customerDetail.id}`)
                )
              ),
              h(Stack, { direction: 'row', spacing: 1 },
                h(Chip, { label: customerDetail.status ? 'Active' : 'Disabled', color: customerDetail.status ? 'success' : 'default', sx: { fontWeight: 700 } }),
                h(Button, { size: 'small', variant: 'outlined', onClick: () => setEditModal({ open: true, customer: customerDetail }) }, 'Edit profile')
              )
            ),
            h(DialogContent, { dividers: true },
              h(Grid, { container: true, spacing: 2.5 },
                // Summary Metrics
                h(Grid, { item: true, xs: 12, sm: 4 },
                  h(Paper, { variant: 'outlined', sx: { p: 2, textAlign: 'center', bgcolor: '#fffaf6' } },
                    h(Typography, { variant: 'caption', color: 'text.secondary', fontWeight: 700 }, 'TOTAL ORDERS'),
                    h(Typography, { variant: 'h4', fontWeight: 800, color: 'primary.main', mt: 0.5 }, customerDetail.orders_count || 0)
                  )
                ),
                h(Grid, { item: true, xs: 12, sm: 4 },
                  h(Paper, { variant: 'outlined', sx: { p: 2, textAlign: 'center', bgcolor: '#fffaf6' } },
                    h(Typography, { variant: 'caption', color: 'text.secondary', fontWeight: 700 }, 'LIFETIME SPEND'),
                    h(Typography, { variant: 'h4', fontWeight: 800, color: 'success.dark', mt: 0.5 }, money(customerDetail.total_spent || 0, restaurant?.currency_code))
                  )
                ),
                h(Grid, { item: true, xs: 12, sm: 4 },
                  h(Paper, { variant: 'outlined', sx: { p: 2, textAlign: 'center', bgcolor: '#fffaf6' } },
                    h(Typography, { variant: 'caption', color: 'text.secondary', fontWeight: 700 }, 'AVG ORDER VALUE'),
                    h(Typography, { variant: 'h4', fontWeight: 800, color: '#27211d', mt: 0.5 },
                      money(customerDetail.orders_count ? (customerDetail.total_spent / customerDetail.orders_count) : 0, restaurant?.currency_code)
                    )
                  )
                ),

                // Contact & Delivery Addresses
                h(Grid, { item: true, xs: 12, md: 5 },
                  h(Paper, { variant: 'outlined', sx: { p: 2, height: '100%' } },
                    h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1.5 }, 'Contact & Addresses'),
                    h(Stack, { spacing: 1, mb: 2 },
                      h(Box, null,
                        h(Typography, { variant: 'caption', color: 'text.secondary', display: 'block' }, 'EMAIL ADDRESS'),
                        h('a', { href: `mailto:${customerDetail.email}`, style: { color: '#b84f2e', fontWeight: 600, textDecoration: 'none' } }, customerDetail.email)
                      ),
                      h(Box, null,
                        h(Typography, { variant: 'caption', color: 'text.secondary', display: 'block' }, 'TELEPHONE'),
                        customerDetail.telephone
                          ? h('a', { href: `tel:${customerDetail.telephone}`, style: { color: '#27211d', fontWeight: 600, textDecoration: 'none' } }, customerDetail.telephone)
                          : h(Typography, { variant: 'body2', color: 'text.disabled' }, 'Not provided')
                      )
                    ),
                    h(Divider, { sx: { my: 1.5 } }),
                    h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1 }, `Saved Addresses (${customerDetail.addresses?.length || 0})`),
                    (customerDetail.addresses || []).length === 0
                      ? h(Typography, { variant: 'body2', color: 'text.secondary' }, 'No saved delivery addresses on file.')
                      : h(Stack, { spacing: 1 },
                          customerDetail.addresses.map(addr =>
                            h(Paper, { key: addr.id, variant: 'outlined', sx: { p: 1.5, bgcolor: '#fbfbfb' } },
                              h(Typography, { variant: 'body2', fontWeight: 600 }, addr.formatted || addr.address_1),
                              addr.city && h(Typography, { variant: 'caption', color: 'text.secondary' }, `${addr.city}, ${addr.postcode || ''} • ${addr.country || ''}`)
                            )
                          )
                        )
                  )
                ),

                // Recent Activity (Orders & Reservations)
                h(Grid, { item: true, xs: 12, md: 7 },
                  h(Paper, { variant: 'outlined', sx: { p: 2 } },
                    h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1.5 }, 'Recent Orders'),
                    (customerDetail.recent_orders || []).length === 0
                      ? h(Typography, { variant: 'body2', color: 'text.secondary', py: 1 }, 'No orders placed yet.')
                      : h(Stack, { spacing: 1, mb: 2.5 },
                          customerDetail.recent_orders.map(o =>
                            h(Paper, { key: o.id, variant: 'outlined', sx: { p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                              h(Box, null,
                                h(Typography, { variant: 'body2', fontWeight: 700 }, `${o.number} • ${o.type || 'Order'}`),
                                h(Typography, { variant: 'caption', color: 'text.secondary' }, `${date(o.created_at)} • ${o.items_count || 1} items`)
                              ),
                              h(Stack, { direction: 'row', spacing: 1, alignItems: 'center' },
                                h(Chip, { label: o.status_name, size: 'small', color: 'primary', sx: { fontWeight: 600 } }),
                                h(Typography, { variant: 'body2', fontWeight: 800 }, money(o.total, restaurant?.currency_code))
                              )
                            )
                          )
                        ),

                    h(Divider, { sx: { my: 1.5 } }),
                    h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1.5 }, 'Recent Table Reservations'),
                    (customerDetail.recent_reservations || []).length === 0
                      ? h(Typography, { variant: 'body2', color: 'text.secondary', py: 1 }, 'No reservations on file.')
                      : h(Stack, { spacing: 1 },
                          customerDetail.recent_reservations.map(res =>
                            h(Paper, { key: res.id, variant: 'outlined', sx: { p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                              h(Box, null,
                                h(Typography, { variant: 'body2', fontWeight: 700 }, `${res.date} at ${res.time}`),
                                h(Typography, { variant: 'caption', color: 'text.secondary' }, `${res.guests} guests`)
                              ),
                              h(Chip, { label: res.status_name, size: 'small', color: 'default' })
                            )
                          )
                        )
                  )
                )
              )
            ),
            h(DialogActions, { sx: { p: 2 } },
              h(Button, { onClick: () => { setSelectedCustomerId(null); setCustomerDetail(null); } }, 'Close')
            )
          )
    )
  );
}

function LocationsView({ data, restaurant, request, notify, refreshView }) {
  const locations = data || [];
  const [editModal, setEditModal] = useState({ open: false, location: null });
  const [servicesModal, setServicesModal] = useState({ open: false, location: null, settings: null });

  const handleOpenServices = async (loc) => {
    try {
      const res = await request(`/api/v1/owner/locations/${loc.id}/settings`);
      setServicesModal({ open: true, location: loc, settings: res.data || {} });
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleSetDefault = async (loc) => {
    try {
      await request(`/api/v1/owner/locations/${loc.id}/default`, { method: 'POST' });
      notify(`"${loc.name}" set as the default location.`, 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleToggleStatus = async (loc) => {
    try {
      await request(`/api/v1/owner/locations/${loc.id}`, {
        method: 'PATCH',
        body: {
          location_name: loc.name,
          location_email: loc.email,
          location_status: !loc.is_active
        }
      });
      notify(`Location ${!loc.is_active ? 'activated' : 'deactivated'}.`, 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteLocation = async (loc) => {
    if (loc.is_default) {
      notify('Cannot delete the default location. Designate another location as default first.', 'warning');
      return;
    }
    if (locations.length <= 1) {
      notify('Cannot delete the only location. At least one location is required.', 'warning');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete branch "${loc.name}"?`)) return;
    try {
      await request(`/api/v1/owner/locations/${loc.id}`, { method: 'DELETE' });
      notify('Location deleted.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // KPI Calculations
  const activeCount = locations.filter(l => l.is_active).length;
  const defaultLoc = locations.find(l => l.is_default);
  const totalOrders = locations.reduce((sum, l) => sum + (Number(l.orders_count) || 0), 0);

  return h(Box, null,
    // Header
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Restaurant Locations & Branches'),
      h(Typography, { variant: 'subtitle1' }, 'Manage restaurant locations, delivery radiuses, fulfillment services, and prep times.')
    ),

    // KPI Metrics Cards
    h(Grid, { container: true, spacing: 2, sx: { mb: 3 } },
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Total Branches', value: locations.length, icon: 'storefront' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Active Branches', value: activeCount, icon: 'check_circle', color: 'success.main' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Default Branch', value: defaultLoc?.name || '—', icon: 'star', color: 'warning.main' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Orders Tracked', value: totalOrders, icon: 'receipt_long', color: 'primary.main' })
      )
    ),

    h(Grid, { container: true, spacing: 3 },
      // Locations List
      h(Grid, { item: true, xs: 12, md: 7 },
        h(Card, null,
          h(CardHeader, {
            title: 'Configured branches',
            subheader: `${locations.length} branch location${locations.length === 1 ? '' : 's'} registered`
          }),
          h(CardContent, null,
            h(Stack, { spacing: 2 },
              locations.map(loc => {
                const sett = loc.settings || {};
                return h(Paper, { key: loc.id, variant: 'outlined', sx: { p: 2.5, bgcolor: loc.is_default ? '#fffdfb' : 'background.paper', borderColor: loc.is_default ? 'primary.light' : '#eadfd4' } },
                  h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1.5 } },
                    h(Box, null,
                      h(Stack, { direction: 'row', spacing: 1, alignItems: 'center' },
                        h(Typography, { variant: 'h6', fontWeight: 800 }, loc.name),
                        loc.is_default && h(Chip, { label: 'Default Flagship', size: 'small', color: 'warning', sx: { fontWeight: 700 } })
                      ),
                      h(Typography, { variant: 'body2', color: 'text.secondary', mt: 0.5 },
                        [loc.address, loc.city, loc.postcode].filter(Boolean).join(', ') || 'No physical address set'
                      ),
                      h(Typography, { variant: 'caption', color: 'text.secondary', display: 'block', mt: 0.5 },
                        `${loc.email || 'No email'} • ${loc.telephone || 'No phone'}`
                      )
                    ),
                    h(Stack, { direction: 'row', spacing: 1, alignItems: 'center' },
                      h(Chip, {
                        label: loc.is_active ? 'Active / Open' : 'Disabled / Closed',
                        size: 'small',
                        color: loc.is_active ? 'success' : 'default',
                        onClick: () => handleToggleStatus(loc),
                        sx: { cursor: 'pointer', fontWeight: 600 }
                      }),
                      h(Chip, {
                        label: `${loc.orders_count || 0} orders`,
                        size: 'small',
                        variant: 'outlined',
                        color: Number(loc.orders_count) > 0 ? 'primary' : 'default'
                      })
                    )
                  ),

                  // Service Flags summary badges
                  h(Stack, { direction: 'row', spacing: 1, flexWrap: 'wrap', gap: 0.5, mb: 2 },
                    h(Chip, {
                      label: sett.orders_enabled !== false ? 'Online Orders: ON' : 'Online Orders: OFF',
                      size: 'small',
                      variant: 'outlined',
                      color: sett.orders_enabled !== false ? 'success' : 'default'
                    }),
                    h(Chip, {
                      label: sett.delivery_enabled !== false ? 'Delivery: ON' : 'Delivery: OFF',
                      size: 'small',
                      variant: 'outlined',
                      color: sett.delivery_enabled !== false ? 'info' : 'default'
                    }),
                    h(Chip, {
                      label: sett.collection_enabled !== false ? 'Pickup: ON' : 'Pickup: OFF',
                      size: 'small',
                      variant: 'outlined',
                      color: sett.collection_enabled !== false ? 'secondary' : 'default'
                    }),
                    h(Chip, {
                      label: sett.reservations_enabled !== false ? 'Reservations: ON' : 'Reservations: OFF',
                      size: 'small',
                      variant: 'outlined',
                      color: sett.reservations_enabled !== false ? 'primary' : 'default'
                    })
                  ),

                  // Action Buttons
                  h(Divider, { sx: { my: 1.5 } }),
                  h(Stack, { direction: 'row', spacing: 1, justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 },
                    !loc.is_default && h(Button, {
                      size: 'small',
                      variant: 'outlined',
                      color: 'warning',
                      onClick: () => handleSetDefault(loc)
                    }, '⭐ Set as default'),
                    h(Button, {
                      size: 'small',
                      variant: 'contained',
                      color: 'secondary',
                      onClick: () => handleOpenServices(loc)
                    }, '⚙️ Services & Rules'),
                    h(Button, {
                      size: 'small',
                      variant: 'outlined',
                      onClick: () => setEditModal({ open: true, location: loc })
                    }, 'Edit'),
                    !loc.is_default && locations.length > 1 && h(IconButton, {
                      size: 'small',
                      color: 'error',
                      title: 'Delete branch',
                      onClick: () => handleDeleteLocation(loc)
                    }, h(Icon, { name: 'delete' }))
                  )
                );
              })
            )
          )
        )
      ),

      // Add Location Form
      h(Grid, { item: true, xs: 12, md: 5 },
        h(Card, null,
          h(CardHeader, { title: 'Add new branch', subheader: 'Create a new physical or virtual restaurant branch.' }),
          h(CardContent, null,
            h('form', {
              onSubmit: async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const body = Object.fromEntries(new FormData(form));
                body.location_status = form.location_status.checked;
                try {
                  await request('/api/v1/owner/locations', { method: 'POST', body });
                  notify('Branch location created.', 'success');
                  form.reset();
                  refreshView();
                } catch (err) {
                  notify(err.message, 'error');
                }
              }
            },
              h(Stack, { spacing: 2 },
                h(TextField, { label: 'Location Name', name: 'location_name', placeholder: 'e.g. Downtown Flagship', required: true, size: 'small', fullWidth: true }),
                h(TextField, { label: 'Email', name: 'location_email', type: 'email', required: true, size: 'small', fullWidth: true }),
                h(TextField, { label: 'Telephone', name: 'location_telephone', placeholder: '+1 234 567 8900', size: 'small', fullWidth: true }),
                h(TextField, { label: 'Street Address', name: 'location_address_1', placeholder: '123 Main Street', size: 'small', fullWidth: true }),
                h(Grid, { container: true, spacing: 2 },
                  h(Grid, { item: true, xs: 7 },
                    h(TextField, { label: 'City', name: 'location_city', size: 'small', fullWidth: true })
                  ),
                  h(Grid, { item: true, xs: 5 },
                    h(TextField, { label: 'Postcode', name: 'location_postcode', size: 'small', fullWidth: true })
                  )
                ),
                h(FormControlLabel, { control: h(Checkbox, { name: 'location_status', defaultChecked: true }), label: 'Active and ready for operations' }),
                h(Button, { type: 'submit', variant: 'contained', color: 'primary', fullWidth: true }, '+ Add branch location')
              )
            )
          )
        )
      )
    ),

    // Edit Location Dialog
    editModal.open && h(Dialog, { open: true, onClose: () => setEditModal({ open: false, location: null }), maxWidth: 'sm', fullWidth: true },
      h('form', {
        onSubmit: async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const body = Object.fromEntries(new FormData(form));
          body.location_status = form.location_status.checked;
          try {
            await request(`/api/v1/owner/locations/${editModal.location.id}`, { method: 'PATCH', body });
            notify('Location profile updated.', 'success');
            setEditModal({ open: false, location: null });
            refreshView();
          } catch (err) {
            notify(err.message, 'error');
          }
        }
      },
        h(DialogTitle, null, `Edit Location: ${editModal.location?.name}`),
        h(DialogContent, null,
          h(Stack, { spacing: 2, mt: 1 },
            h(TextField, { label: 'Location Name', name: 'location_name', defaultValue: editModal.location?.name || '', required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'Email', name: 'location_email', type: 'email', defaultValue: editModal.location?.email || '', required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'Telephone', name: 'location_telephone', defaultValue: editModal.location?.telephone || '', size: 'small', fullWidth: true }),
            h(TextField, { label: 'Address', name: 'location_address_1', defaultValue: editModal.location?.address || '', size: 'small', fullWidth: true }),
            h(Grid, { container: true, spacing: 2 },
              h(Grid, { item: true, xs: 7 },
                h(TextField, { label: 'City', name: 'location_city', defaultValue: editModal.location?.city || '', size: 'small', fullWidth: true })
              ),
              h(Grid, { item: true, xs: 5 },
                h(TextField, { label: 'Postcode', name: 'location_postcode', defaultValue: editModal.location?.postcode || '', size: 'small', fullWidth: true })
              )
            ),
            h(FormControlLabel, { control: h(Checkbox, { name: 'location_status', defaultChecked: !!editModal.location?.is_active }), label: 'Active location' })
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setEditModal({ open: false, location: null }) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Save location')
        )
      )
    ),

    // Location Services & Delivery Rules Dialog
    servicesModal.open && h(Dialog, { open: true, onClose: () => setServicesModal({ open: false, location: null, settings: null }), maxWidth: 'sm', fullWidth: true },
      h('form', {
        onSubmit: async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const body = {
            orders_enabled: form.orders_enabled.checked,
            collection_enabled: form.collection_enabled.checked,
            delivery_enabled: form.delivery_enabled.checked,
            reservations_enabled: form.reservations_enabled.checked,
            min_delivery_order: form.min_delivery_order?.value ? Number(form.min_delivery_order.value) : 0,
            delivery_charge: form.delivery_charge?.value ? Number(form.delivery_charge.value) : 0,
            delivery_radius_km: form.delivery_radius_km?.value ? Number(form.delivery_radius_km.value) : 0,
            prep_time_minutes: form.prep_time_minutes?.value ? Number(form.prep_time_minutes.value) : 15,
            delivery_lead_time_minutes: form.delivery_lead_time_minutes?.value ? Number(form.delivery_lead_time_minutes.value) : 30,
          };
          try {
            await request(`/api/v1/owner/locations/${servicesModal.location.id}/settings`, { method: 'PUT', body });
            notify('Location services & operational rules saved.', 'success');
            setServicesModal({ open: false, location: null, settings: null });
            refreshView();
          } catch (err) {
            notify(err.message, 'error');
          }
        }
      },
        h(DialogTitle, null, `${servicesModal.location?.name} — Services & Operational Rules`),
        h(DialogContent, { dividers: true },
          h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1 }, 'Enabled Fulfillment Channels'),
          h(FormGroup, { sx: { mb: 3 } },
            h(FormControlLabel, { control: h(Checkbox, { name: 'orders_enabled', defaultChecked: servicesModal.settings?.orders_enabled !== false }), label: 'Online ordering system' }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'delivery_enabled', defaultChecked: servicesModal.settings?.delivery_enabled !== false }), label: 'Home Delivery' }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'collection_enabled', defaultChecked: servicesModal.settings?.collection_enabled !== false }), label: 'Pickup / Takeaway Collection' }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'reservations_enabled', defaultChecked: servicesModal.settings?.reservations_enabled !== false }), label: 'Dining Table Reservations' })
          ),

          h(Divider, { sx: { my: 2 } }),
          h(Typography, { variant: 'subtitle2', fontWeight: 700, mb: 1.5 }, 'Delivery & Threshold Rules'),
          h(Grid, { container: true, spacing: 2 },
            h(Grid, { item: true, xs: 12, sm: 6 },
              h(TextField, {
                label: `Minimum Delivery Order (${restaurant?.currency_code || 'USD'})`,
                name: 'min_delivery_order',
                type: 'number',
                inputProps: { min: 0, step: '0.50' },
                defaultValue: servicesModal.settings?.min_delivery_order || '',
                size: 'small',
                fullWidth: true
              })
            ),
            h(Grid, { item: true, xs: 12, sm: 6 },
              h(TextField, {
                label: `Standard Delivery Fee (${restaurant?.currency_code || 'USD'})`,
                name: 'delivery_charge',
                type: 'number',
                inputProps: { min: 0, step: '0.50' },
                defaultValue: servicesModal.settings?.delivery_charge || '',
                size: 'small',
                fullWidth: true
              })
            ),
            h(Grid, { item: true, xs: 12, sm: 6 },
              h(TextField, {
                label: 'Delivery Radius (km)',
                name: 'delivery_radius_km',
                type: 'number',
                inputProps: { min: 0, step: '1' },
                defaultValue: servicesModal.settings?.delivery_radius_km || '',
                size: 'small',
                fullWidth: true
              })
            ),
            h(Grid, { item: true, xs: 12, sm: 6 },
              h(TextField, {
                label: 'Delivery Transit Time (mins)',
                name: 'delivery_lead_time_minutes',
                type: 'number',
                inputProps: { min: 0, step: '5' },
                defaultValue: servicesModal.settings?.delivery_lead_time_minutes || '30',
                size: 'small',
                fullWidth: true
              })
            ),
            h(Grid, { item: true, xs: 12, sm: 6 },
              h(TextField, {
                label: 'Kitchen Food Prep Time (mins)',
                name: 'prep_time_minutes',
                type: 'number',
                inputProps: { min: 0, step: '5' },
                defaultValue: servicesModal.settings?.prep_time_minutes || '15',
                size: 'small',
                fullWidth: true
              })
            )
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setServicesModal({ open: false, location: null, settings: null }) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Save operational rules')
        )
      )
    )
  );
}

function TeamView({ data, ownerBootstrap, request, notify, refreshView }) {
  const members = data?.members || [];
  const access = data?.access || { invitations: [], roles: [] };
  const permissions = data?.permissions || [];
  const locations = ownerBootstrap?.locations || [];

  const [editMemberModal, setEditMemberModal] = useState({ open: false, member: null });
  const [editRoleModal, setEditRoleModal] = useState({ open: false, role: null });

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Team'),
      h(Typography, { variant: 'subtitle1' }, 'Invite staff, assign locations, and manage reusable permission templates.')
    ),
    h(Grid, { container: true, spacing: 3 },
      // Team Members List
      h(Grid, { item: true, xs: 12, md: 8 },
        h(Card, null,
          h(CardHeader, { title: 'Team members' }),
          h(CardContent, null,
            h(Stack, { spacing: 2 },
              members.map(m =>
                h(Paper, { key: m.id, variant: 'outlined', sx: { p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 } },
                  h(Box, null,
                    h(Typography, { variant: 'subtitle1', fontWeight: 700 }, m.name || 'Unnamed staff'),
                    h(Typography, { variant: 'body2', color: 'text.secondary' }, `${m.email} • ${m.custom_role?.name || m.role}`),
                    h(Typography, { variant: 'caption', color: 'text.secondary' }, `${m.location_ids?.length || 0} assigned locations`)
                  ),
                  h(Stack, { direction: 'row', spacing: 1, alignItems: 'center' },
                    h(Chip, { label: m.status, size: 'small', color: m.status === 'active' ? 'success' : 'default' }),
                    m.role !== 'owner' && h(Button, { size: 'small', variant: 'outlined', onClick: () => setEditMemberModal({ open: true, member: m }) }, 'Manage')
                  )
                )
              )
            )
          )
        )
      ),
      // Invite Member Form
      h(Grid, { item: true, xs: 12, md: 4 },
        h(Card, null,
          h(CardHeader, { title: 'Invite team member' }),
          h(CardContent, null,
            h('form', {
              onSubmit: async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const dataObj = Object.fromEntries(new FormData(form));
                dataObj.location_ids = [...form.querySelectorAll('[name="location_ids"]:checked')].map(i => Number(i.value));
                const [kind, value] = dataObj.role_choice.split(':');
                delete dataObj.role_choice;
                if (kind === 'custom') dataObj.restaurant_role_id = Number(value); else dataObj.base_role = value;
                try {
                  await request('/api/v1/owner/team-access/invitations', { method: 'POST', body: dataObj });
                  notify('Invitation sent.', 'success');
                  form.reset();
                  refreshView();
                } catch (err) {
                  notify(err.message, 'error');
                }
              }
            },
              h(Stack, { spacing: 2 },
                h(TextField, { label: 'Name', name: 'name', required: true, size: 'small', fullWidth: true }),
                h(TextField, { label: 'Email', name: 'email', type: 'email', required: true, size: 'small', fullWidth: true }),
                h(FormControl, { size: 'small', fullWidth: true },
                  h(InputLabel, null, 'Role'),
                  h(Select, { name: 'role_choice', defaultValue: 'base:staff', label: 'Role' },
                    h(MenuItem, { value: 'base:manager' }, 'Manager'),
                    h(MenuItem, { value: 'base:staff' }, 'Staff'),
                    access.roles.map(r => h(MenuItem, { key: r.id, value: `custom:${r.id}` }, r.name))
                  )
                ),
                h(Box, null,
                  h(Typography, { variant: 'caption', fontWeight: 700, display: 'block', mb: 0.5 }, 'Locations'),
                  locations.map(loc =>
                    h(FormControlLabel, {
                      key: loc.id,
                      control: h(Checkbox, { name: 'location_ids', value: loc.id, defaultChecked: true }),
                      label: loc.name
                    })
                  )
                ),
                h(Button, { type: 'submit', variant: 'contained', color: 'primary', fullWidth: true }, 'Send secure invitation')
              )
            )
          )
        )
      ),

      // Pending Invitations Card
      h(Grid, { item: true, xs: 12, md: 6 },
        h(Card, null,
          h(CardHeader, { title: 'Pending invitations' }),
          h(CardContent, null,
            access.invitations.length === 0
              ? h(Typography, { color: 'text.secondary', py: 2, textAlign: 'center' }, 'No pending invitations.')
              : h(Stack, { spacing: 1.5 },
                  access.invitations.map(inv =>
                    h(Paper, { key: inv.id, variant: 'outlined', sx: { p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                      h(Box, null,
                        h(Typography, { variant: 'body2', fontWeight: 700 }, inv.name),
                        h(Typography, { variant: 'caption', color: 'text.secondary' }, `${inv.email} • ${inv.role?.name || inv.base_role}`),
                        h(Typography, { variant: 'caption', display: 'block', color: 'text.secondary' }, `Expires ${date(inv.expires_at)}`)
                      ),
                      h(Button, {
                        size: 'small',
                        color: 'error',
                        variant: 'outlined',
                        onClick: async () => {
                          try {
                            await request(`/api/v1/owner/team-access/invitations/${inv.id}`, { method: 'DELETE' });
                            notify('Invitation cancelled.', 'success');
                            refreshView();
                          } catch (err) {
                            notify(err.message, 'error');
                          }
                        }
                      }, 'Cancel')
                    )
                  )
                )
          )
        )
      ),

      // Custom Roles Card
      h(Grid, { item: true, xs: 12, md: 6 },
        h(Card, null,
          h(CardHeader, { title: 'Custom permission templates' }),
          h(CardContent, null,
            h(Stack, { spacing: 1.5, mb: 3 },
              access.roles.length === 0
                ? h(Typography, { color: 'text.secondary', textAlign: 'center' }, 'No custom roles.')
                : access.roles.map(r =>
                    h(Paper, { key: r.id, variant: 'outlined', sx: { p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                      h(Box, null,
                        h(Typography, { variant: 'body2', fontWeight: 700 }, r.name),
                        h(Typography, { variant: 'caption', color: 'text.secondary' }, `${r.base_role} • ${r.permissions.length} permissions`)
                      ),
                      h(Stack, { direction: 'row', spacing: 1 },
                        h(Button, {
                          size: 'small',
                          variant: 'outlined',
                          onClick: () => setEditRoleModal({ open: true, role: r })
                        }, 'Edit'),
                        h(Button, {
                          size: 'small',
                          color: 'error',
                          onClick: async () => {
                            try {
                              await request(`/api/v1/owner/team-access/roles/${r.id}`, { method: 'DELETE' });
                              notify('Role deleted.', 'success');
                              refreshView();
                            } catch (err) {
                              notify(err.message, 'error');
                            }
                          }
                        }, 'Delete')
                      )
                    )
                  )
            ),
            h(Divider, { sx: { my: 2 } }),
            h(Typography, { variant: 'subtitle2', mb: 1 }, 'Create role'),
            h('form', {
              onSubmit: async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const dataObj = Object.fromEntries(new FormData(form));
                dataObj.permissions = [...form.querySelectorAll('[name="permissions"]:checked')].map(i => i.value);
                try {
                  await request('/api/v1/owner/team-access/roles', { method: 'POST', body: dataObj });
                  notify('Custom role created.', 'success');
                  form.reset();
                  refreshView();
                } catch (err) {
                  notify(err.message, 'error');
                }
              }
            },
              h(Stack, { spacing: 2 },
                h(TextField, { label: 'Role Name', name: 'name', required: true, size: 'small', fullWidth: true }),
                h(FormControl, { size: 'small', fullWidth: true },
                  h(InputLabel, null, 'Base access'),
                  h(Select, { name: 'base_role', defaultValue: 'staff', label: 'Base access' },
                    h(MenuItem, { value: 'staff' }, 'Staff'),
                    h(MenuItem, { value: 'manager' }, 'Manager')
                  )
                ),
                h(Box, null,
                  h(Typography, { variant: 'caption', fontWeight: 700, display: 'block', mb: 0.5 }, 'Permissions'),
                  permissions.map(p =>
                    h(FormControlLabel, {
                      key: p,
                      control: h(Checkbox, { name: 'permissions', value: p }),
                      label: p
                    })
                  )
                ),
                h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Create role')
              )
            )
          )
        )
      )
    ),

    // Manage Member Dialog
    editMemberModal.open && h(Dialog, { open: true, onClose: () => setEditMemberModal({ open: false, member: null }), maxWidth: 'xs', fullWidth: true },
      h('form', {
        onSubmit: async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const dataObj = Object.fromEntries(new FormData(form));
          dataObj.location_ids = [...form.querySelectorAll('[name="location_ids"]:checked')].map(i => Number(i.value));
          try {
            await request(`/api/v1/owner/team/${editMemberModal.member.id}`, { method: 'PATCH', body: dataObj });
            notify('Team access updated.', 'success');
            setEditMemberModal({ open: false, member: null });
            refreshView();
          } catch (err) {
            notify(err.message, 'error');
          }
        }
      },
        h(DialogTitle, null, 'Manage team member'),
        h(DialogContent, null,
          h(Box, { mb: 2 },
            h(Typography, { variant: 'subtitle1', fontWeight: 700 }, editMemberModal.member?.name),
            h(Typography, { variant: 'body2', color: 'text.secondary' }, editMemberModal.member?.email)
          ),
          h(Stack, { spacing: 2 },
            h(FormControl, { size: 'small', fullWidth: true },
              h(InputLabel, null, 'Role'),
              h(Select, { name: 'role', defaultValue: editMemberModal.member?.role || 'staff', label: 'Role' },
                h(MenuItem, { value: 'manager' }, 'Manager'),
                h(MenuItem, { value: 'staff' }, 'Staff')
              )
            ),
            h(FormControl, { size: 'small', fullWidth: true },
              h(InputLabel, null, 'Status'),
              h(Select, { name: 'status', defaultValue: editMemberModal.member?.status || 'active', label: 'Status' },
                h(MenuItem, { value: 'active' }, 'Active'),
                h(MenuItem, { value: 'disabled' }, 'Disabled')
              )
            ),
            h(Box, null,
              h(Typography, { variant: 'caption', fontWeight: 700, display: 'block', mb: 0.5 }, 'Locations'),
              locations.map(loc =>
                h(FormControlLabel, {
                  key: loc.id,
                  control: h(Checkbox, {
                    name: 'location_ids',
                    value: loc.id,
                    defaultChecked: editMemberModal.member?.location_ids?.map(Number).includes(loc.id)
                  }),
                  label: loc.name
                })
              )
            )
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setEditMemberModal({ open: false, member: null }) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Save access')
        )
      )
    ),

    // Edit Role Dialog
    editRoleModal.open && h(Dialog, { open: true, onClose: () => setEditRoleModal({ open: false, role: null }), maxWidth: 'sm', fullWidth: true },
      h('form', {
        onSubmit: async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const dataObj = Object.fromEntries(new FormData(form));
          dataObj.permissions = [...form.querySelectorAll('[name="edit_permissions"]:checked')].map(i => i.value);
          delete dataObj.edit_permissions;
          try {
            await request(`/api/v1/owner/team-access/roles/${editRoleModal.role.id}`, { method: 'PATCH', body: dataObj });
            notify('Role updated.', 'success');
            setEditRoleModal({ open: false, role: null });
            refreshView();
          } catch (err) {
            notify(err.message, 'error');
          }
        }
      },
        h(DialogTitle, null, 'Edit custom role'),
        h(DialogContent, null,
          h(Stack, { spacing: 2, mt: 1 },
            h(TextField, { label: 'Role Name', name: 'name', defaultValue: editRoleModal.role?.name || '', required: true, size: 'small', fullWidth: true }),
            h(FormControl, { size: 'small', fullWidth: true },
              h(InputLabel, null, 'Base access'),
              h(Select, { name: 'base_role', defaultValue: editRoleModal.role?.base_role || 'staff', label: 'Base access' },
                h(MenuItem, { value: 'staff' }, 'Staff'),
                h(MenuItem, { value: 'manager' }, 'Manager')
              )
            ),
            h(Box, null,
              h(Typography, { variant: 'caption', fontWeight: 700, display: 'block', mb: 0.5 }, 'Permissions'),
              permissions.map(p =>
                h(FormControlLabel, {
                  key: p,
                  control: h(Checkbox, { name: 'edit_permissions', value: p, defaultChecked: editRoleModal.role?.permissions?.includes(p) }),
                  label: p
                })
              )
            )
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setEditRoleModal({ open: false, role: null }) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Save role')
        )
      )
    )
  );
}

function PaymentSettingsView({ restaurant, request, notify, bootstrapSession, refreshView }) {
  const [saving, setSaving] = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);
  const settings = restaurant?.settings || {};

  const handleSavePayments = async (e) => {
    e.preventDefault();
    setSaving(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const newSettings = {
      ...settings,
      // Cash on Delivery
      payments_cod_enabled: formData.get('payments_cod_enabled') === 'on',
      payments_cod_label: formData.get('payments_cod_label') || 'Cash on Delivery',
      payments_cod_notes: formData.get('payments_cod_notes') || '',
      payments_cod_min: formData.get('payments_cod_min') ? Number(formData.get('payments_cod_min')) : 0,
      payments_cod_max: formData.get('payments_cod_max') ? Number(formData.get('payments_cod_max')) : 0,

      // Card on Delivery (Mobile POS)
      payments_card_on_delivery_enabled: formData.get('payments_card_on_delivery_enabled') === 'on',
      payments_card_on_delivery_label: formData.get('payments_card_on_delivery_label') || 'Card on Delivery (Mobile POS)',
      payments_card_on_delivery_notes: formData.get('payments_card_on_delivery_notes') || '',

      // Stripe Online Card Processing
      payments_stripe_enabled: formData.get('payments_stripe_enabled') === 'on',
      payments_stripe_test_mode: formData.get('payments_stripe_test_mode') === 'on',
      payments_stripe_publishable_key: formData.get('payments_stripe_publishable_key') || '',
      payments_stripe_secret_key: formData.get('payments_stripe_secret_key') || '',
      payments_stripe_webhook_secret: formData.get('payments_stripe_webhook_secret') || '',

      // PayPal
      payments_paypal_enabled: formData.get('payments_paypal_enabled') === 'on',
      payments_paypal_sandbox: formData.get('payments_paypal_sandbox') === 'on',
      payments_paypal_client_id: formData.get('payments_paypal_client_id') || '',
      payments_paypal_secret: formData.get('payments_paypal_secret') || '',

      // Direct Bank Transfer / Wire
      payments_bank_transfer_enabled: formData.get('payments_bank_transfer_enabled') === 'on',
      payments_bank_transfer_instructions: formData.get('payments_bank_transfer_instructions') || '',
      payments_bank_name: formData.get('payments_bank_name') || '',
      payments_bank_account_number: formData.get('payments_bank_account_number') || '',
      payments_bank_routing_number: formData.get('payments_bank_routing_number') || '',
    };

    try {
      await request('/api/v1/owner/restaurant', {
        method: 'PATCH',
        body: {
          settings: newSettings
        }
      });
      notify('Payment gateway settings saved.', 'success');
      bootstrapSession();
      if (refreshView) refreshView();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const isStripeActive = settings.payments_stripe_enabled;
  const isCodActive = settings.payments_cod_enabled !== false;
  const isCardOnDeliveryActive = settings.payments_card_on_delivery_enabled;
  const isPaypalActive = settings.payments_paypal_enabled;
  const isBankTransferActive = settings.payments_bank_transfer_enabled;

  const activeGatewaysCount = [
    isCodActive,
    isCardOnDeliveryActive,
    isStripeActive,
    isPaypalActive,
    isBankTransferActive
  ].filter(Boolean).length;

  return h(Box, null,
    // Header
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Payment Settings & Gateways'),
      h(Typography, { variant: 'subtitle1' }, 'Manage online payment processors (Stripe, PayPal) and offline fulfillment methods (Cash, POS Card on Delivery).')
    ),

    // Gateway KPI Status Cards
    h(Grid, { container: true, spacing: 2, sx: { mb: 3.5 } },
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Active Methods', value: `${activeGatewaysCount} enabled`, icon: 'account_balance_wallet', color: 'success.main' })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, {
          label: 'Stripe Processing',
          value: isStripeActive ? (settings.payments_stripe_test_mode ? 'Test Mode' : 'Live') : 'Disabled',
          icon: 'credit_card',
          color: isStripeActive ? 'primary.main' : 'text.disabled'
        })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, {
          label: 'Cash on Delivery',
          value: isCodActive ? 'Active' : 'Disabled',
          icon: 'payments',
          color: isCodActive ? 'success.main' : 'text.disabled'
        })
      ),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 },
        h(MetricCard, { label: 'Settlement Currency', value: `${restaurant?.currency_code || 'USD'} (${settings.currency_symbol || '$'})`, icon: 'currency_exchange' })
      )
    ),

    h('form', { onSubmit: handleSavePayments },
      h(Stack, { spacing: 3 },
        // 1. Stripe Online Checkout Card
        h(Card, null,
          h(CardHeader, {
            title: 'Stripe Online Payments (Credit Cards, Apple Pay, Google Pay)',
            subheader: 'Direct credit/debit card processing with 3D Secure and mobile wallet checkout',
            action: h(FormControlLabel, {
              control: h(Switch, { name: 'payments_stripe_enabled', defaultChecked: Boolean(settings.payments_stripe_enabled), color: 'primary' }),
              label: h(Typography, { fontWeight: 700 }, settings.payments_stripe_enabled ? 'Enabled' : 'Disabled')
            })
          }),
          h(CardContent, null,
            h(Grid, { container: true, spacing: 2.5 },
              h(Grid, { item: true, xs: 12 },
                h(Stack, { direction: 'row', spacing: 1, flexWrap: 'wrap', gap: 1, mb: 1 },
                  h(Chip, { label: '💳 Visa', size: 'small', variant: 'outlined' }),
                  h(Chip, { label: '💳 Mastercard', size: 'small', variant: 'outlined' }),
                  h(Chip, { label: '💳 Amex', size: 'small', variant: 'outlined' }),
                  h(Chip, { label: ' Apple Pay', size: 'small', color: 'default', sx: { fontWeight: 700 } }),
                  h(Chip, { label: 'G Pay', size: 'small', color: 'default', sx: { fontWeight: 700 } })
                )
              ),
              h(Grid, { item: true, xs: 12, sm: 6 },
                h(FormControlLabel, {
                  control: h(Checkbox, { name: 'payments_stripe_test_mode', defaultChecked: settings.payments_stripe_test_mode !== false }),
                  label: h(Box, null,
                    h(Typography, { variant: 'body2', fontWeight: 600 }, 'Test / Sandbox Mode'),
                    h(Typography, { variant: 'caption', color: 'text.secondary' }, 'Simulate card charges using test card numbers.')
                  )
                })
              ),
              h(Grid, { item: true, xs: 12 },
                h(TextField, {
                  label: 'Stripe Publishable Key',
                  name: 'payments_stripe_publishable_key',
                  defaultValue: settings.payments_stripe_publishable_key || '',
                  placeholder: 'pk_live_... or pk_test_...',
                  size: 'small',
                  fullWidth: true,
                  helperText: 'Found in your Stripe Dashboard under Developers > API keys'
                })
              ),
              h(Grid, { item: true, xs: 12, sm: 8 },
                h(TextField, {
                  label: 'Stripe Secret Key',
                  name: 'payments_stripe_secret_key',
                  type: showStripeKey ? 'text' : 'password',
                  defaultValue: settings.payments_stripe_secret_key || '',
                  placeholder: 'sk_live_... or sk_test_...',
                  size: 'small',
                  fullWidth: true,
                  helperText: 'Private backend secret key used to charge cards'
                })
              ),
              h(Grid, { item: true, xs: 12, sm: 4, sx: { display: 'flex', alignItems: 'center' } },
                h(Button, { size: 'small', variant: 'outlined', onClick: () => setShowStripeKey(!showStripeKey) },
                  showStripeKey ? 'Hide Secret Key' : 'Show Secret Key'
                )
              ),
              h(Grid, { item: true, xs: 12 },
                h(TextField, {
                  label: 'Stripe Webhook Secret (optional)',
                  name: 'payments_stripe_webhook_secret',
                  defaultValue: settings.payments_stripe_webhook_secret || '',
                  placeholder: 'whsec_...',
                  size: 'small',
                  fullWidth: true,
                  helperText: 'Used to verify instant payment webhooks'
                })
              )
            )
          )
        ),

        // 2. Cash on Delivery (COD) Card
        h(Card, null,
          h(CardHeader, {
            title: 'Cash on Delivery / Pay on Arrival',
            subheader: 'Customer pays in physical cash upon delivery or pickup arrival',
            action: h(FormControlLabel, {
              control: h(Switch, { name: 'payments_cod_enabled', defaultChecked: settings.payments_cod_enabled !== false, color: 'primary' }),
              label: h(Typography, { fontWeight: 700 }, settings.payments_cod_enabled !== false ? 'Enabled' : 'Disabled')
            })
          }),
          h(CardContent, null,
            h(Grid, { container: true, spacing: 2 },
              h(Grid, { item: true, xs: 12, sm: 6 },
                h(TextField, {
                  label: 'Checkout Display Label',
                  name: 'payments_cod_label',
                  defaultValue: settings.payments_cod_label || 'Cash on Delivery',
                  size: 'small',
                  fullWidth: true
                })
              ),
              h(Grid, { item: true, xs: 12, sm: 3 },
                h(TextField, {
                  label: `Min Order (${restaurant?.currency_code || 'USD'})`,
                  name: 'payments_cod_min',
                  type: 'number',
                  inputProps: { min: 0, step: '1' },
                  defaultValue: settings.payments_cod_min || '',
                  size: 'small',
                  fullWidth: true
                })
              ),
              h(Grid, { item: true, xs: 12, sm: 3 },
                h(TextField, {
                  label: `Max Order (${restaurant?.currency_code || 'USD'})`,
                  name: 'payments_cod_max',
                  type: 'number',
                  inputProps: { min: 0, step: '1' },
                  defaultValue: settings.payments_cod_max || '',
                  size: 'small',
                  fullWidth: true
                })
              ),
              h(Grid, { item: true, xs: 12 },
                h(TextField, {
                  label: 'Customer Notice / Payment Instructions',
                  name: 'payments_cod_notes',
                  defaultValue: settings.payments_cod_notes || 'Please have exact cash ready upon delivery.',
                  size: 'small',
                  fullWidth: true
                })
              )
            )
          )
        ),

        // 3. Card on Delivery (Mobile POS) Card
        h(Card, null,
          h(CardHeader, {
            title: 'Card on Delivery (Mobile Terminal)',
            subheader: 'Driver or server brings a wireless POS machine for contactless card payment',
            action: h(FormControlLabel, {
              control: h(Switch, { name: 'payments_card_on_delivery_enabled', defaultChecked: Boolean(settings.payments_card_on_delivery_enabled), color: 'primary' }),
              label: h(Typography, { fontWeight: 700 }, settings.payments_card_on_delivery_enabled ? 'Enabled' : 'Disabled')
            })
          }),
          h(CardContent, null,
            h(Grid, { container: true, spacing: 2 },
              h(Grid, { item: true, xs: 12, sm: 6 },
                h(TextField, {
                  label: 'Checkout Display Label',
                  name: 'payments_card_on_delivery_label',
                  defaultValue: settings.payments_card_on_delivery_label || 'Card on Delivery (Mobile POS)',
                  size: 'small',
                  fullWidth: true
                })
              ),
              h(Grid, { item: true, xs: 12, sm: 6 },
                h(TextField, {
                  label: 'Instructions',
                  name: 'payments_card_on_delivery_notes',
                  defaultValue: settings.payments_card_on_delivery_notes || 'Our delivery courier will bring a contactless card reader.',
                  size: 'small',
                  fullWidth: true
                })
              )
            )
          )
        ),

        // 4. PayPal Checkout Card
        h(Card, null,
          h(CardHeader, {
            title: 'PayPal Checkout',
            subheader: 'Accept payments via PayPal account balance, cards, and Pay Later',
            action: h(FormControlLabel, {
              control: h(Switch, { name: 'payments_paypal_enabled', defaultChecked: Boolean(settings.payments_paypal_enabled), color: 'primary' }),
              label: h(Typography, { fontWeight: 700 }, settings.payments_paypal_enabled ? 'Enabled' : 'Disabled')
            })
          }),
          h(CardContent, null,
            h(Grid, { container: true, spacing: 2 },
              h(Grid, { item: true, xs: 12 },
                h(FormControlLabel, {
                  control: h(Checkbox, { name: 'payments_paypal_sandbox', defaultChecked: Boolean(settings.payments_paypal_sandbox) }),
                  label: 'PayPal Sandbox / Test Environment'
                })
              ),
              h(Grid, { item: true, xs: 12, sm: 6 },
                h(TextField, {
                  label: 'PayPal Client ID',
                  name: 'payments_paypal_client_id',
                  defaultValue: settings.payments_paypal_client_id || '',
                  size: 'small',
                  fullWidth: true
                })
              ),
              h(Grid, { item: true, xs: 12, sm: 6 },
                h(TextField, {
                  label: 'PayPal Secret',
                  name: 'payments_paypal_secret',
                  type: 'password',
                  defaultValue: settings.payments_paypal_secret || '',
                  size: 'small',
                  fullWidth: true
                })
              )
            )
          )
        ),

        // 5. Direct Bank Transfer / Wire Card
        h(Card, null,
          h(CardHeader, {
            title: 'Direct Bank Transfer / Wire',
            subheader: 'Customer transfers funds directly into your restaurant business bank account',
            action: h(FormControlLabel, {
              control: h(Switch, { name: 'payments_bank_transfer_enabled', defaultChecked: Boolean(settings.payments_bank_transfer_enabled), color: 'primary' }),
              label: h(Typography, { fontWeight: 700 }, settings.payments_bank_transfer_enabled ? 'Enabled' : 'Disabled')
            })
          }),
          h(CardContent, null,
            h(Grid, { container: true, spacing: 2 },
              h(Grid, { item: true, xs: 12, sm: 4 },
                h(TextField, {
                  label: 'Bank Name',
                  name: 'payments_bank_name',
                  defaultValue: settings.payments_bank_name || '',
                  size: 'small',
                  fullWidth: true
                })
              ),
              h(Grid, { item: true, xs: 12, sm: 4 },
                h(TextField, {
                  label: 'Account / IBAN Number',
                  name: 'payments_bank_account_number',
                  defaultValue: settings.payments_bank_account_number || '',
                  size: 'small',
                  fullWidth: true
                })
              ),
              h(Grid, { item: true, xs: 12, sm: 4 },
                h(TextField, {
                  label: 'Routing / SWIFT Code',
                  name: 'payments_bank_routing_number',
                  defaultValue: settings.payments_bank_routing_number || '',
                  size: 'small',
                  fullWidth: true
                })
              ),
              h(Grid, { item: true, xs: 12 },
                h(TextField, {
                  label: 'Payment Reference Instructions for Customers',
                  name: 'payments_bank_transfer_instructions',
                  defaultValue: settings.payments_bank_transfer_instructions || 'Please include your Order # as the payment reference.',
                  size: 'small',
                  fullWidth: true
                })
              )
            )
          )
        ),

        // Sticky Action Bar
        h(Box, { sx: { display: 'flex', justifyContent: 'flex-end', pt: 1 } },
          h(Button, {
            type: 'submit',
            variant: 'contained',
            color: 'primary',
            size: 'large',
            disabled: saving,
            sx: { px: 4 }
          }, saving ? 'Saving payment gateways...' : 'Save Payment Settings')
        )
      )
    )
  );
}

function RestaurantSettingsView({ restaurant, request, notify, bootstrapSession }) {
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const settings = restaurant?.settings || {};

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const baseData = {
      name: formData.get('name'),
      timezone: formData.get('timezone'),
      currency_code: formData.get('currency_code')?.toUpperCase(),
    };

    const newSettings = {
      ...settings,
      currency_symbol: formData.get('currency_symbol') || '$',
      business_email: formData.get('business_email') || '',
      business_phone: formData.get('business_phone') || '',
      business_address: formData.get('business_address') || '',
      tax_id: formData.get('tax_id') || '',
      tax_rate: formData.get('tax_rate') ? Number(formData.get('tax_rate')) : 0,
      auto_accept_orders: formData.get('auto_accept_orders') === 'on',
      guest_checkout_enabled: formData.get('guest_checkout_enabled') === 'on',
      tipping_enabled: formData.get('tipping_enabled') === 'on',
      tip_presets: formData.get('tip_presets') || '10, 15, 20, 25',
      cancellation_window_minutes: formData.get('cancellation_window_minutes') ? Number(formData.get('cancellation_window_minutes')) : 5,
      sound_alerts_enabled: formData.get('sound_alerts_enabled') === 'on',
      notification_email: formData.get('notification_email') || '',
      email_on_new_reservation: formData.get('email_on_new_reservation') === 'on',
      facebook_url: formData.get('facebook_url') || '',
      instagram_url: formData.get('instagram_url') || '',
      twitter_url: formData.get('twitter_url') || '',
      tiktok_url: formData.get('tiktok_url') || '',
      google_maps_url: formData.get('google_maps_url') || '',
    };

    try {
      await request('/api/v1/owner/restaurant', {
        method: 'PATCH',
        body: {
          ...baseData,
          settings: newSettings
        }
      });
      notify('Restaurant settings successfully saved.', 'success');
      bootstrapSession();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Restaurant Settings'),
      h(Typography, { variant: 'subtitle1' }, 'Configure restaurant identity, checkout policies, staff notifications, and regional settings.')
    ),

    h('form', { onSubmit: handleSaveSettings },
      h(Grid, { container: true, spacing: 3 },
        // Main Settings Tabs & Panels
        h(Grid, { item: true, xs: 12, md: 8 },
          h(Card, null,
            h(Box, { sx: { borderBottom: 1, borderColor: 'divider' } },
              h(Tabs, { value: tab, onChange: (_, v) => setTab(v), variant: 'scrollable', scrollButtons: 'auto' },
                h(Tab, { label: 'General & Regional' }),
                h(Tab, { label: 'Order Policies & Checkout' }),
                h(Tab, { label: 'Alerts & Staff Notifications' }),
                h(Tab, { label: 'Social & Web Links' })
              )
            ),
            h(CardContent, { sx: { p: 3 } },
              // Tab 0: General & Regional
              tab === 0 && h(Stack, { spacing: 2.5 },
                h(Typography, { variant: 'subtitle2', fontWeight: 700, color: 'text.secondary' }, 'CORE IDENTITY & LOCALIZATION'),
                h(Grid, { container: true, spacing: 2 },
                  h(Grid, { item: true, xs: 12, sm: 8 },
                    h(TextField, { label: 'Restaurant Name', name: 'name', defaultValue: restaurant?.name || '', required: true, size: 'small', fullWidth: true })
                  ),
                  h(Grid, { item: true, xs: 12, sm: 4 },
                    h(TextField, { label: 'Store Slug / Subdomain', value: restaurant?.slug || '', disabled: true, size: 'small', fullWidth: true, helperText: 'Tenant subdomain' })
                  ),
                  h(Grid, { item: true, xs: 12, sm: 6 },
                    h(TextField, { label: 'Currency Code', name: 'currency_code', defaultValue: restaurant?.currency_code || 'USD', required: true, size: 'small', fullWidth: true, inputProps: { minLength: 3, maxLength: 3 }, helperText: '3-letter ISO code e.g. USD, EUR, GBP' })
                  ),
                  h(Grid, { item: true, xs: 12, sm: 6 },
                    h(TextField, { label: 'Currency Symbol', name: 'currency_symbol', defaultValue: settings.currency_symbol || '$', size: 'small', fullWidth: true, helperText: 'Display symbol e.g. $, €, £, ¥' })
                  ),
                  h(Grid, { item: true, xs: 12 },
                    h(TextField, { label: 'Timezone', name: 'timezone', defaultValue: restaurant?.timezone || 'UTC', required: true, size: 'small', fullWidth: true, helperText: 'e.g. America/New_York, Europe/London, Asia/Dubai' })
                  )
                ),

                h(Divider, { sx: { my: 1 } }),
                h(Typography, { variant: 'subtitle2', fontWeight: 700, color: 'text.secondary' }, 'BUSINESS CONTACT & TAX INFORMATION'),
                h(Grid, { container: true, spacing: 2 },
                  h(Grid, { item: true, xs: 12, sm: 6 },
                    h(TextField, { label: 'Official Business Email', name: 'business_email', type: 'email', defaultValue: settings.business_email || '', size: 'small', fullWidth: true })
                  ),
                  h(Grid, { item: true, xs: 12, sm: 6 },
                    h(TextField, { label: 'Official Phone Number', name: 'business_phone', defaultValue: settings.business_phone || '', size: 'small', fullWidth: true })
                  ),
                  h(Grid, { item: true, xs: 12 },
                    h(TextField, { label: 'Business / Legal Address', name: 'business_address', defaultValue: settings.business_address || '', size: 'small', fullWidth: true })
                  ),
                  h(Grid, { item: true, xs: 12, sm: 6 },
                    h(TextField, { label: 'Tax / VAT Number', name: 'tax_id', defaultValue: settings.tax_id || '', size: 'small', fullWidth: true })
                  ),
                  h(Grid, { item: true, xs: 12, sm: 6 },
                    h(TextField, { label: 'Default Tax Rate (%)', name: 'tax_rate', type: 'number', inputProps: { min: 0, step: '0.1' }, defaultValue: settings.tax_rate ?? 0, size: 'small', fullWidth: true, helperText: 'Applied to storefront checkouts' })
                  )
                )
              ),

              // Tab 1: Order Policies & Checkout
              tab === 1 && h(Stack, { spacing: 2.5 },
                h(Typography, { variant: 'subtitle2', fontWeight: 700, color: 'text.secondary' }, 'CHECKOUT & FULFILLMENT RULES'),
                h(FormGroup, null,
                  h(FormControlLabel, {
                    control: h(Checkbox, { name: 'auto_accept_orders', defaultChecked: settings.auto_accept_orders !== false }),
                    label: h(Box, null,
                      h(Typography, { variant: 'body2', fontWeight: 600 }, 'Automatic Order Acceptance'),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, 'Automatically mark incoming orders as accepted without manual staff triage.')
                    )
                  }),
                  h(FormControlLabel, {
                    control: h(Checkbox, { name: 'guest_checkout_enabled', defaultChecked: settings.guest_checkout_enabled !== false }),
                    label: h(Box, null,
                      h(Typography, { variant: 'body2', fontWeight: 600 }, 'Allow Guest Checkout'),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, 'Permit customers to place food orders without creating a permanent account.')
                    )
                  }),
                  h(FormControlLabel, {
                    control: h(Checkbox, { name: 'tipping_enabled', defaultChecked: settings.tipping_enabled !== false }),
                    label: h(Box, null,
                      h(Typography, { variant: 'body2', fontWeight: 600 }, 'Enable Customer Tipping / Gratuity'),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, 'Display tip option badges during storefront checkout.')
                    )
                  })
                ),
                h(Grid, { container: true, spacing: 2, mt: 1 },
                  h(Grid, { item: true, xs: 12, sm: 6 },
                    h(TextField, {
                      label: 'Tip Presets (%)',
                      name: 'tip_presets',
                      defaultValue: settings.tip_presets || '10, 15, 20, 25',
                      size: 'small',
                      fullWidth: true,
                      helperText: 'Comma separated percentages (e.g. 10, 15, 20)'
                    })
                  ),
                  h(Grid, { item: true, xs: 12, sm: 6 },
                    h(TextField, {
                      label: 'Cancellation Window (minutes)',
                      name: 'cancellation_window_minutes',
                      type: 'number',
                      inputProps: { min: 0, max: 60 },
                      defaultValue: settings.cancellation_window_minutes ?? 5,
                      size: 'small',
                      fullWidth: true,
                      helperText: 'Minutes customer can cancel before kitchen prep'
                    })
                  )
                )
              ),

              // Tab 2: Alerts & Staff Notifications
              tab === 2 && h(Stack, { spacing: 2.5 },
                h(Typography, { variant: 'subtitle2', fontWeight: 700, color: 'text.secondary' }, 'KITCHEN & STAFF ALERTS'),
                h(FormGroup, null,
                  h(FormControlLabel, {
                    control: h(Checkbox, { name: 'sound_alerts_enabled', defaultChecked: settings.sound_alerts_enabled !== false }),
                    label: h(Box, null,
                      h(Typography, { variant: 'body2', fontWeight: 600 }, 'Audio Chime Alerts'),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, 'Play sound notifications in the admin dashboard when a new order arrives.')
                    )
                  }),
                  h(FormControlLabel, {
                    control: h(Checkbox, { name: 'email_on_new_reservation', defaultChecked: settings.email_on_new_reservation !== false }),
                    label: h(Box, null,
                      h(Typography, { variant: 'body2', fontWeight: 600 }, 'Email Alerts for Table Reservations'),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, 'Send an email to staff when a guest books a table.')
                    )
                  })
                ),
                h(TextField, {
                  label: 'Staff Notification Email',
                  name: 'notification_email',
                  type: 'email',
                  defaultValue: settings.notification_email || '',
                  placeholder: 'orders@yourrestaurant.com',
                  size: 'small',
                  fullWidth: true,
                  helperText: 'Receive instant email digests for every new customer order.'
                })
              ),

              // Tab 3: Social & Web Links
              tab === 3 && h(Stack, { spacing: 2.5 },
                h(Typography, { variant: 'subtitle2', fontWeight: 700, color: 'text.secondary' }, 'ONLINE PRESENCE & SOCIAL PROFILES'),
                h(TextField, { label: 'Instagram Profile URL / Handle', name: 'instagram_url', defaultValue: settings.instagram_url || '', placeholder: 'https://instagram.com/yourrestaurant', size: 'small', fullWidth: true }),
                h(TextField, { label: 'Facebook Page URL', name: 'facebook_url', defaultValue: settings.facebook_url || '', placeholder: 'https://facebook.com/yourrestaurant', size: 'small', fullWidth: true }),
                h(TextField, { label: 'Twitter / X URL', name: 'twitter_url', defaultValue: settings.twitter_url || '', placeholder: 'https://x.com/yourrestaurant', size: 'small', fullWidth: true }),
                h(TextField, { label: 'TikTok URL', name: 'tiktok_url', defaultValue: settings.tiktok_url || '', placeholder: 'https://tiktok.com/@yourrestaurant', size: 'small', fullWidth: true }),
                h(TextField, { label: 'Google Business / Maps Link', name: 'google_maps_url', defaultValue: settings.google_maps_url || '', placeholder: 'https://maps.google.com/?cid=...', size: 'small', fullWidth: true })
              )
            ),
            h(CardActions, { sx: { p: 3, pt: 0 } },
              h(Button, { type: 'submit', variant: 'contained', color: 'primary', disabled: saving },
                saving ? 'Saving changes...' : 'Save settings'
              )
            )
          )
        ),

        // Sidebar Overview Card
        h(Grid, { item: true, xs: 12, md: 4 },
          h(Card, null,
            h(CardHeader, { title: 'Account Overview' }),
            h(CardContent, null,
              h(Stack, { spacing: 2 },
                h(Box, { sx: { display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #eadfd4' } },
                  h(Typography, { color: 'text.secondary' }, 'Tenant Status'),
                  h(Chip, { label: restaurant?.status || 'active', size: 'small', color: 'success', sx: { fontWeight: 700 } })
                ),
                h(Box, { sx: { display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #eadfd4' } },
                  h(Typography, { color: 'text.secondary' }, 'Store Subdomain'),
                  h(Typography, { fontWeight: 700 }, `${restaurant?.slug || '—'}.vondo.app`)
                ),
                h(Box, { sx: { display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #eadfd4' } },
                  h(Typography, { color: 'text.secondary' }, 'Active Domains'),
                  h(Typography, { fontWeight: 700 }, restaurant?.domains?.length || 1)
                ),
                h(Box, { sx: { display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #eadfd4' } },
                  h(Typography, { color: 'text.secondary' }, 'Team Members'),
                  h(Typography, { fontWeight: 700 }, restaurant?.members?.length || 1)
                ),
                h(Box, { sx: { display: 'flex', justifyContent: 'space-between' } },
                  h(Typography, { color: 'text.secondary' }, 'Public Tenant ID'),
                  h(Typography, { variant: 'caption', fontFamily: 'monospace', fontWeight: 600 }, restaurant?.id?.slice(0, 13) + '...')
                )
              )
            )
          )
        )
      )
    )
  );
}

const sectionTypes = [
  ['hero', 'Hero'],
  ['categories', 'Categories'],
  ['featured_dishes', 'Featured dishes'],
  ['reservation_cta', 'Reservation call-to-action'],
  ['about', 'About'],
  ['locations', 'Locations'],
  ['gallery', 'Gallery'],
  ['contact', 'Contact'],
  ['custom_text', 'Custom text']
];

function BrandView({ revisions, restaurant, request, notify, refreshView }) {
  const latest = revisions[0] || {};
  const config = latest.configuration || {};
  const identity = config.identity || {};
  const themeCfg = config.theme || {};
  const content = config.content || {};
  const sections = config.sections || [];
  const navigation = config.navigation?.length ? config.navigation : [
    { label: 'Home', href: '#/' },
    { label: 'Menu', href: '#/menu' },
    { label: 'Reserve Table', href: '#/reservations' },
    { label: 'Locations', href: '#/locations' }
  ];

  // Real-time Preview State
  const [preview, setPreview] = useState({
    title: content.hero_title || restaurant?.name || 'Welcome to our restaurant',
    subtitle: content.hero_subtitle || 'Finest artisanal ingredients crafted with passion.',
    primary: themeCfg.primary || '#b84f2e',
    background: themeCfg.background || '#fffaf6',
    text: themeCfg.text || '#29231f',
    radius: themeCfg.radius ?? 16,
    logoUrl: identity.logo_url || ''
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    try {
      const res = await request('/api/v1/owner/media', { method: 'POST', body: form, form: true });
      const fullUrl = new URL(res.data.url, window.location.origin).href;
      setPreview(prev => ({ ...prev, logoUrl: fullUrl }));
      notify('Logo uploaded. Save draft to apply.', 'success');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nav = navigation.map((item, idx) => ({
      label: formData.get(`nav_label_${idx}`) || item.label,
      href: item.href
    }));
    const sec = sectionTypes.map(([type], idx) => ({
      id: sections.find(s => s.type === type)?.id || type.replace('_dishes', ''),
      type,
      visible: form.querySelector(`[data-section-visible="${type}"]`)?.checked || false,
      position: Number(form.querySelector(`[data-section-position="${type}"]`)?.value || (idx + 1) * 10)
    }));

    const payload = {
      identity: {
        name: formData.get('identity_name'),
        tagline: formData.get('identity_tagline'),
        logo_url: preview.logoUrl || null
      },
      theme: {
        primary: formData.get('theme_primary'),
        secondary: formData.get('theme_secondary'),
        accent: formData.get('theme_accent'),
        background: formData.get('theme_background'),
        surface: formData.get('theme_surface'),
        text: formData.get('theme_text'),
        radius: Number(preview.radius)
      },
      content: {
        hero_title: formData.get('hero_title'),
        hero_subtitle: formData.get('hero_subtitle'),
        hero_image_url: formData.get('hero_image_url') || null,
        footer_text: formData.get('footer_text')
      },
      navigation: nav,
      sections: sec
    };

    try {
      await request('/api/v1/owner/brand-revisions', { method: 'POST', body: payload });
      notify('Draft revision created.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleRevisionAction = async (id, action) => {
    if (action === 'rollback' && !window.confirm('Restore and publish this earlier version?')) return;
    try {
      await request(`/api/v1/owner/brand-revisions/${id}/${action}`, { method: 'POST', body: {} });
      notify(action === 'publish' ? 'Brand published.' : 'Earlier version restored.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const storefrontUrl = `${window.location.protocol}//${window.location.hostname}:3000/?restaurant=${encodeURIComponent(restaurant?.slug || restaurant?.public_id || 'default')}`;

  return h(Box, null,
    h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 } },
      h(Box, null,
        h(Typography, { variant: 'h4' }, 'Brand & storefront'),
        h(Typography, { variant: 'subtitle1' }, 'Control the shared appearance of web and mobile experiences.')
      ),
      h(Button, { variant: 'outlined', color: 'secondary', href: storefrontUrl, target: '_blank', rel: 'noopener' }, 'Open storefront')
    ),
    h(Grid, { container: true, spacing: 3 },
      // Brand Customizer Form
      h(Grid, { item: true, xs: 12, md: 8 },
        h(Card, null,
          h(CardContent, null,
            h('form', { onSubmit: handleSaveDraft },
              h(Typography, { variant: 'h6', mb: 2 }, 'Identity'),
              h(Grid, { container: true, spacing: 2, mb: 3 },
                h(Grid, { item: true, xs: 12, sm: 6 },
                  h(TextField, { label: 'Public name', name: 'identity_name', defaultValue: identity.name || restaurant?.name || '', required: true, fullWidth: true, size: 'small' })
                ),
                h(Grid, { item: true, xs: 12, sm: 6 },
                  h(TextField, { label: 'Tagline', name: 'identity_tagline', defaultValue: identity.tagline || '', fullWidth: true, size: 'small' })
                ),
                h(Grid, { item: true, xs: 12 },
                  h(Stack, { direction: 'row', spacing: 2, alignItems: 'center' },
                    h(TextField, {
                      label: 'Logo URL',
                      value: preview.logoUrl,
                      onChange: (e) => setPreview(prev => ({ ...prev, logoUrl: e.target.value })),
                      fullWidth: true,
                      size: 'small'
                    }),
                    h(Button, { variant: 'outlined', component: 'label' },
                      'Upload Logo',
                      h('input', { type: 'file', hidden: true, accept: 'image/*', onChange: handleLogoUpload })
                    )
                  )
                )
              ),

              h(Divider, { sx: { my: 2 } }),
              h(Typography, { variant: 'h6', mb: 2 }, 'Colors & Shapes'),
              h(Grid, { container: true, spacing: 2, mb: 3 },
                ['primary', 'secondary', 'accent', 'background', 'surface', 'text'].map(key =>
                  h(Grid, { item: true, xs: 6, sm: 4, key },
                    h(TextField, {
                      label: key[0].toUpperCase() + key.slice(1),
                      name: `theme_${key}`,
                      type: 'color',
                      defaultValue: themeCfg[key] || ({ primary: '#b84f2e', secondary: '#29221e', accent: '#f6a623', background: '#fffaf6', surface: '#ffffff', text: '#29231f' }[key]),
                      fullWidth: true,
                      size: 'small',
                      onChange: (e) => setPreview(prev => ({ ...prev, [key]: e.target.value }))
                    })
                  )
                ),
                h(Grid, { item: true, xs: 12 },
                  h(Typography, { variant: 'caption', fontWeight: 700 }, `Corner radius: ${preview.radius}px`),
                  h(Slider, {
                    value: Number(preview.radius),
                    min: 0,
                    max: 32,
                    onChange: (_, val) => setPreview(prev => ({ ...prev, radius: val })),
                    valueLabelDisplay: 'auto'
                  })
                )
              ),

              h(Divider, { sx: { my: 2 } }),
              h(Typography, { variant: 'h6', mb: 2 }, 'Homepage Copy'),
              h(Stack, { spacing: 2, mb: 3 },
                h(TextField, {
                  label: 'Hero title',
                  name: 'hero_title',
                  defaultValue: preview.title,
                  onChange: (e) => setPreview(prev => ({ ...prev, title: e.target.value })),
                  required: true,
                  fullWidth: true,
                  size: 'small'
                }),
                h(TextField, {
                  label: 'Hero description',
                  name: 'hero_subtitle',
                  defaultValue: preview.subtitle,
                  onChange: (e) => setPreview(prev => ({ ...prev, subtitle: e.target.value })),
                  multiline: true,
                  rows: 2,
                  fullWidth: true,
                  size: 'small'
                }),
                h(TextField, { label: 'Hero image URL', name: 'hero_image_url', defaultValue: content.hero_image_url || '', fullWidth: true, size: 'small' }),
                h(TextField, { label: 'Footer text', name: 'footer_text', defaultValue: content.footer_text || '', fullWidth: true, size: 'small' })
              ),

              h(Divider, { sx: { my: 2 } }),
              h(Typography, { variant: 'h6', mb: 2 }, 'Navigation Links'),
              h(Grid, { container: true, spacing: 2, mb: 3 },
                navigation.map((item, idx) =>
                  h(Grid, { item: true, xs: 12, sm: 6, key: idx },
                    h(TextField, { label: `Link ${idx + 1}`, name: `nav_label_${idx}`, defaultValue: item.label, fullWidth: true, size: 'small' })
                  )
                )
              ),

              h(Divider, { sx: { my: 2 } }),
              h(Typography, { variant: 'h6', mb: 2 }, 'Homepage Sections'),
              h(Stack, { spacing: 1.5, mb: 3 },
                sectionTypes.map(([type, label], idx) => {
                  const existing = sections.find(s => s.type === type);
                  return h(Paper, { key: type, variant: 'outlined', sx: { p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                    h(FormControlLabel, {
                      control: h(Checkbox, { 'data-section-visible': type, defaultChecked: existing ? !!existing.visible : true }),
                      label
                    }),
                    h(TextField, {
                      label: 'Order',
                      type: 'number',
                      'data-section-position': type,
                      defaultValue: existing?.position ?? (idx + 1) * 10,
                      size: 'small',
                      sx: { width: 90 }
                    })
                  );
                })
              ),

              h(Button, { type: 'submit', variant: 'contained', color: 'primary', size: 'large' }, 'Save draft revision')
            )
          )
        )
      ),

      // Live Preview & Revision History
      h(Grid, { item: true, xs: 12, md: 4 },
        h(Stack, { spacing: 3 },
          h(Card, null,
            h(CardHeader, { title: 'Live draft preview' }),
            h(CardContent, null,
              h(Box, {
                sx: {
                  p: 3,
                  borderRadius: `${preview.radius}px`,
                  bgcolor: preview.background,
                  color: preview.text,
                  border: '1px solid #eadfd4',
                  textAlign: 'left'
                }
              },
                preview.logoUrl && h('img', { src: preview.logoUrl, alt: 'Logo', style: { maxHeight: 40, marginBottom: 12 } }),
                h(Typography, { variant: 'caption', color: 'text.secondary', fontWeight: 800, letterSpacing: 1 }, 'LIVE PREVIEW'),
                h(Typography, { variant: 'h6', fontWeight: 700, my: 1 }, preview.title),
                h(Typography, { variant: 'body2', mb: 2, opacity: 0.9 }, preview.subtitle),
                h(Button, {
                  variant: 'contained',
                  sx: { bgcolor: `${preview.primary} !important`, color: '#ffffff', borderRadius: `${Math.max(4, preview.radius / 2)}px` }
                }, 'Order online')
              )
            )
          ),

          h(Card, null,
            h(CardHeader, { title: 'Revision history' }),
            h(CardContent, null,
              revisions.length === 0
                ? h(Typography, { color: 'text.secondary', textAlign: 'center' }, 'No revisions.')
                : h(Stack, { spacing: 1.5 },
                    revisions.map(rev =>
                      h(Paper, { key: rev.id, variant: 'outlined', sx: { p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                        h(Box, null,
                          h(Typography, { variant: 'body2', fontWeight: 700 }, `Version ${rev.version}`),
                          h(Typography, { variant: 'caption', color: 'text.secondary' }, rev.published_at ? `Published ${date(rev.published_at)}` : 'Draft')
                        ),
                        h(Stack, { direction: 'row', spacing: 1 },
                          h(Button, { size: 'small', variant: 'contained', color: 'primary', onClick: () => handleRevisionAction(rev.id, 'publish') }, 'Publish'),
                          h(Button, { size: 'small', variant: 'outlined', onClick: () => handleRevisionAction(rev.id, 'rollback') }, 'Restore')
                        )
                      )
                    )
                  )
            )
          )
        )
      )
    )
  );
}

function DomainsView({ restaurant, request, notify, bootstrapSession }) {
  const domains = restaurant?.domains || [];

  const handleAddDomain = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    try {
      await request('/api/v1/owner/domains', { method: 'POST', body });
      notify('Domain added.', 'success');
      form.reset();
      bootstrapSession();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteDomain = async (domainId) => {
    if (!window.confirm('Remove this custom domain?')) return;
    try {
      await request(`/api/v1/owner/domains/${domainId}`, { method: 'DELETE' });
      notify('Domain removed.', 'success');
      bootstrapSession();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleVerifyDomain = async (domainId) => {
    try {
      const res = await request(`/api/v1/owner/domains/${domainId}/verify`, { method: 'POST', body: {} });
      notify(res.message || 'DNS verification check complete.', 'success');
      bootstrapSession();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Domains'),
      h(Typography, { variant: 'subtitle1' }, 'Connect custom storefront domains using DNS ownership verification.')
    ),
    h(Grid, { container: true, spacing: 3 },
      h(Grid, { item: true, xs: 12, md: 8 },
        h(Card, null,
          h(CardHeader, { title: 'Connected domains' }),
          h(CardContent, null,
            h(Stack, { spacing: 2 },
              domains.map(dom =>
                h(Paper, { key: dom.id, variant: 'outlined', sx: { p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 } },
                  h(Box, null,
                    h(Typography, { variant: 'subtitle1', fontWeight: 700 }, dom.host),
                    h(Typography, { variant: 'body2', color: 'text.secondary' }, dom.verified_at ? 'Domain verified' : `DNS TXT: ${dom.verification?.name || ''}`),
                    dom.verification && h('code', { style: { display: 'block', marginTop: 4, fontSize: 12, color: '#b84f2e' } }, dom.verification.value)
                  ),
                  h(Stack, { direction: 'row', spacing: 1, alignItems: 'center' },
                    h(Chip, {
                      label: dom.verified_at ? 'Verified' : 'Pending',
                      size: 'small',
                      color: dom.verified_at ? 'success' : 'warning'
                    }),
                    !dom.verified_at && h(Button, { size: 'small', variant: 'contained', color: 'primary', onClick: () => handleVerifyDomain(dom.id) }, 'Verify DNS'),
                    dom.is_primary
                      ? h(Chip, { label: 'Primary', size: 'small' })
                      : h(Button, { size: 'small', color: 'error', variant: 'outlined', onClick: () => handleDeleteDomain(dom.id) }, 'Remove')
                  )
                )
              )
            )
          )
        )
      ),
      h(Grid, { item: true, xs: 12, md: 4 },
        h(Card, null,
          h(CardHeader, { title: 'Add custom domain' }),
          h(CardContent, null,
            h('form', { onSubmit: handleAddDomain },
              h(Stack, { spacing: 2 },
                h(TextField, { label: 'Domain Host', name: 'host', placeholder: 'orders.example.com', required: true, size: 'small', fullWidth: true }),
                h(Button, { type: 'submit', variant: 'contained', color: 'primary', fullWidth: true }, 'Add domain')
              )
            )
          )
        )
      )
    )
  );
}

function SubscriptionView({ subscription }) {
  if (!subscription) {
    return h(Card, null,
      h(CardContent, { sx: { textAlign: 'center', py: 6 } },
        h(Typography, { variant: 'h6', mb: 1 }, 'No subscription assigned'),
        h(Typography, { color: 'text.secondary' }, 'Please contact the platform administrator to assign a subscription plan.')
      )
    );
  }

  const plan = subscription.plan || {};

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Subscription'),
      h(Typography, { variant: 'subtitle1' }, 'Current plan, billing state, and included platform features.')
    ),
    h(Grid, { container: true, spacing: 3 },
      h(Grid, { item: true, xs: 12, md: 8 },
        h(Card, null,
          h(CardContent, { sx: { p: 3 } },
            h(Stack, { direction: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 },
              h(Typography, { variant: 'h5', fontWeight: 700 }, plan.name || 'Standard Plan'),
              h(Chip, { label: subscription.status, color: 'success', sx: { fontWeight: 700 } })
            ),
            h(Typography, { variant: 'h3', fontWeight: 800, color: 'primary.main', my: 2 },
              money((plan.price_minor || 0) / 100, plan.currency_code || 'USD'),
              h(Typography, { component: 'span', variant: 'subtitle1', color: 'text.secondary' }, '/month')
            ),
            h(Divider, { sx: { my: 2.5 } }),
            h(Typography, { variant: 'subtitle2', mb: 2 }, 'Included features'),
            h(Grid, { container: true, spacing: 1.5 },
              (plan.features || []).map((feat, idx) =>
                h(Grid, { item: true, xs: 12, sm: 6, key: idx },
                  h(Paper, { variant: 'outlined', sx: { p: 1.5, display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f0f8f4', borderColor: '#cce4d9' } },
                    h(Icon, { name: 'check_circle', color: '#2e7d32' }),
                    h(Typography, { variant: 'body2', fontWeight: 600, color: 'success.dark' }, String(feat).replaceAll('_', ' '))
                  )
                )
              )
            )
          )
        )
      ),
      h(Grid, { item: true, xs: 12, md: 4 },
        h(Card, null,
          h(CardHeader, { title: 'Billing period' }),
          h(CardContent, null,
            h(Stack, { spacing: 2 },
              h(Box, { sx: { display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #eadfd4' } },
                h(Typography, { color: 'text.secondary' }, 'Status'),
                h(Typography, { fontWeight: 700 }, subscription.status)
              ),
              h(Box, { sx: { display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #eadfd4' } },
                h(Typography, { color: 'text.secondary' }, 'Trial ends'),
                h(Typography, { fontWeight: 700 }, date(subscription.trial_ends_at))
              ),
              h(Box, { sx: { display: 'flex', justifyContent: 'space-between' } },
                h(Typography, { color: 'text.secondary' }, 'Renews / ends'),
                h(Typography, { fontWeight: 700 }, date(subscription.current_period_ends_at))
              )
            )
          )
        )
      )
    )
  );
}

function BuildsView({ builds, request, notify, refreshView }) {
  const buildList = Array.isArray(builds) ? builds : (Array.isArray(builds?.data) ? builds.data : []);

  const handleCreateBuild = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    Object.keys(body).forEach(k => body[k] === '' && delete body[k]);
    try {
      await request('/api/v1/owner/app-builds', { method: 'POST', body, idempotent: true });
      notify('Mobile build request queued.', 'success');
      form.reset();
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleBuildAction = async (id, action) => {
    try {
      await request(`/api/v1/owner/app-builds/${id}/${action}`, { method: 'POST', body: {} });
      notify(`Build ${action}ed.`, 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'App builds'),
      h(Typography, { variant: 'subtitle1' }, 'Prepare and track restaurant-specific mobile build configurations.')
    ),
    h(Grid, { container: true, spacing: 3 },
      h(Grid, { item: true, xs: 12, md: 8 },
        h(Card, null,
          h(CardHeader, { title: 'Build requests' }),
          h(CardContent, null,
            buildList.length === 0
              ? h(Typography, { color: 'text.secondary', textAlign: 'center', py: 3 }, 'No app build requests yet.')
              : h(Stack, { spacing: 2 },
                  buildList.map(b =>
                    h(Paper, { key: b.id, variant: 'outlined', sx: { p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 } },
                      h(Box, null,
                        h(Typography, { variant: 'subtitle1', fontWeight: 700 }, `${b.configuration?.app_name || 'App'} • ${b.platform}`),
                        h(Typography, { variant: 'body2', color: 'text.secondary' }, `${b.configuration?.bundle_id} • ${b.status} • ${b.attempts} attempts`),
                        b.failure_message && h(Typography, { variant: 'caption', color: 'error.main' }, b.failure_message)
                      ),
                      h(Stack, { direction: 'row', spacing: 1 },
                        b.status === 'succeeded' && b.artifacts?.length > 0 && b.artifacts.map(art =>
                          h(Button, { key: art.id, size: 'small', variant: 'contained', color: 'success', href: `/api/v1/owner/app-builds/${b.public_id || b.id}/artifacts/${art.id}`, target: '_blank' }, `Download ${art.kind || 'build'}`)
                        ),
                        b.status === 'succeeded' && (!b.artifacts || b.artifacts.length === 0) && h(Chip, { label: 'Completed', size: 'small', color: 'success' }),
                        ['failed', 'cancelled'].includes(b.status) && h(Button, { size: 'small', variant: 'outlined', onClick: () => handleBuildAction(b.id, 'retry') }, 'Retry'),
                        ['queued', 'preparing', 'configuration_ready'].includes(b.status) && h(Button, { size: 'small', color: 'error', variant: 'outlined', onClick: () => handleBuildAction(b.id, 'cancel') }, 'Cancel')
                      )
                    )
                  )
                )
          )
        )
      ),
      h(Grid, { item: true, xs: 12, md: 4 },
        h(Card, null,
          h(CardHeader, { title: 'Request white-label app' }),
          h(CardContent, null,
            h('form', { onSubmit: handleCreateBuild },
              h(Stack, { spacing: 2 },
                h(FormControl, { size: 'small', fullWidth: true },
                  h(InputLabel, null, 'Platform'),
                  h(Select, { name: 'platform', defaultValue: 'android', label: 'Platform' },
                    h(MenuItem, { value: 'android' }, 'Android'),
                    h(MenuItem, { value: 'ios' }, 'iOS')
                  )
                ),
                h(TextField, { label: 'App Name', name: 'app_name', required: true, size: 'small', fullWidth: true }),
                h(TextField, { label: 'Bundle ID', name: 'bundle_id', placeholder: 'com.company.restaurant', required: true, size: 'small', fullWidth: true }),
                h(TextField, { label: 'Icon URL (optional)', name: 'icon_url', type: 'url', size: 'small', fullWidth: true }),
                h(TextField, { label: 'Splash URL (optional)', name: 'splash_url', type: 'url', size: 'small', fullWidth: true }),
                h(Button, { type: 'submit', variant: 'contained', color: 'primary', fullWidth: true }, 'Queue build')
              )
            )
          )
        )
      )
    )
  );
}

// ----------------------------------------------------
// CMS PAGES & MEDIA GALLERY COMPONENTS (OWNER)
// ----------------------------------------------------

const cmsSectionTypes = [
  { type: 'hero', label: 'Hero Banner' },
  { type: 'featured_dishes', label: 'Featured Dishes' },
  { type: 'categories', label: 'Menu Categories' },
  { type: 'promotions', label: 'Special Promotions' },
  { type: 'about', label: 'About Story' },
  { type: 'locations', label: 'Branch Locations' },
  { type: 'reservation_cta', label: 'Reservation CTA' },
  { type: 'reviews', label: 'Customer Reviews' },
  { type: 'gallery', label: 'Photo Gallery' },
  { type: 'contact', label: 'Contact Info' },
  { type: 'newsletter', label: 'Newsletter Subscription' },
  { type: 'custom_text', label: 'Custom Text / Block' }
];

function PagesView({ pages, request, notify, refreshView }) {
  const pageList = Array.isArray(pages) ? pages : (Array.isArray(pages?.data) ? pages.data : []);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, page: null });
  const [sectionsModal, setSectionsModal] = useState({ open: false, page: null, sections: [] });

  const handleCreatePage = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    body.is_home = form.is_home ? form.is_home.checked : false;
    try {
      await request('/api/v1/owner/pages', { method: 'POST', body });
      notify('Page created.', 'success');
      setCreateModal(false);
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleUpdatePage = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    body.is_home = form.edit_is_home ? form.edit_is_home.checked : false;
    delete body.edit_is_home;
    try {
      await request(`/api/v1/owner/pages/${editModal.page.id}`, { method: 'PATCH', body });
      notify('Page updated.', 'success');
      setEditModal({ open: false, page: null });
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeletePage = async (page) => {
    if (page.is_home) {
      notify('Cannot delete the home page. Designate another page as home first.', 'error');
      return;
    }
    if (!window.confirm(`Delete page "${page.title}"?`)) return;
    try {
      await request(`/api/v1/owner/pages/${page.id}`, { method: 'DELETE' });
      notify('Page deleted.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const openSectionsModal = (page) => {
    const existing = page.sections || [];
    setSectionsModal({
      open: true,
      page,
      sections: existing.map((s, idx) => ({
        id: s.id || `sec_${idx + 1}`,
        type: s.type,
        position: s.position ?? (idx + 1) * 10,
        visible: s.visible !== false,
        content: s.content || {}
      }))
    });
  };

  const handleAddSection = (type) => {
    setSectionsModal(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `sec_${Date.now()}_${prev.sections.length + 1}`,
          type,
          position: (prev.sections.length + 1) * 10,
          visible: true,
          content: {}
        }
      ]
    }));
  };

  const handleRemoveSection = (idx) => {
    setSectionsModal(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateSectionField = (idx, field, value) => {
    setSectionsModal(prev => {
      const next = [...prev.sections];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, sections: next };
    });
  };

  const handleSaveSections = async () => {
    try {
      const payload = {
        sections: sectionsModal.sections.map((s, idx) => ({
          id: s.id || `sec_${idx + 1}`,
          type: s.type,
          position: Number(s.position ?? (idx + 1) * 10),
          visible: Boolean(s.visible),
          content: s.content || {}
        }))
      };
      await request(`/api/v1/owner/pages/${sectionsModal.page.id}/sections`, { method: 'PUT', body: payload });
      notify('Page sections saved.', 'success');
      setSectionsModal({ open: false, page: null, sections: [] });
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 } },
      h(Box, null,
        h(Typography, { variant: 'h4' }, 'Storefront pages'),
        h(Typography, { variant: 'subtitle1' }, 'Manage custom CMS pages and modular content layouts.')
      ),
      h(Button, { variant: 'contained', color: 'primary', onClick: () => setCreateModal(true) }, '+ New page')
    ),

    h(Grid, { container: true, spacing: 3 },
      h(Grid, { item: true, xs: 12 },
        h(Card, null,
          h(CardHeader, { title: 'All pages', subheader: `${pageList.length} pages configured` }),
          h(CardContent, null,
            pageList.length === 0
              ? h(Typography, { color: 'text.secondary', textAlign: 'center', py: 4 }, 'No custom pages created yet.')
              : h(Stack, { spacing: 2 },
                  pageList.map(p =>
                    h(Paper, { key: p.id, variant: 'outlined', sx: { p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 } },
                      h(Box, null,
                        h(Stack, { direction: 'row', spacing: 1, alignItems: 'center' },
                          h(Typography, { variant: 'subtitle1', fontWeight: 700 }, p.title),
                          p.is_home && h(Chip, { label: 'Home Page', size: 'small', color: 'primary' })
                        ),
                        h(Typography, { variant: 'body2', color: 'text.secondary' }, `Slug: /pages/${p.slug} • ${p.sections?.length || 0} layout sections`)
                      ),
                      h(Stack, { direction: 'row', spacing: 1 },
                        h(Button, { size: 'small', variant: 'contained', color: 'secondary', onClick: () => openSectionsModal(p) }, 'Manage sections'),
                        h(Button, { size: 'small', variant: 'outlined', onClick: () => setEditModal({ open: true, page: p }) }, 'Edit'),
                        !p.is_home && h(Button, { size: 'small', color: 'error', variant: 'outlined', onClick: () => handleDeletePage(p) }, 'Delete')
                      )
                    )
                  )
                )
          )
        )
      )
    ),

    // Create Page Modal
    createModal && h(Dialog, { open: true, onClose: () => setCreateModal(false), maxWidth: 'xs', fullWidth: true },
      h('form', { onSubmit: handleCreatePage },
        h(DialogTitle, null, 'Create new page'),
        h(DialogContent, null,
          h(Stack, { spacing: 2, mt: 1 },
            h(TextField, { label: 'Page Title', name: 'title', required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'URL Slug', name: 'slug', placeholder: 'about-us', required: true, size: 'small', fullWidth: true, helperText: 'Accessible at /pages/{slug}' }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'is_home', defaultChecked: false }), label: 'Set as Home Page' })
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setCreateModal(false) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Create page')
        )
      )
    ),

    // Edit Page Modal
    editModal.open && h(Dialog, { open: true, onClose: () => setEditModal({ open: false, page: null }), maxWidth: 'xs', fullWidth: true },
      h('form', { onSubmit: handleUpdatePage },
        h(DialogTitle, null, 'Edit page settings'),
        h(DialogContent, null,
          h(Stack, { spacing: 2, mt: 1 },
            h(TextField, { label: 'Page Title', name: 'title', defaultValue: editModal.page?.title || '', required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'URL Slug', name: 'slug', defaultValue: editModal.page?.slug || '', required: true, size: 'small', fullWidth: true }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'edit_is_home', defaultChecked: Boolean(editModal.page?.is_home) }), label: 'Set as Home Page' })
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setEditModal({ open: false, page: null }) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Save changes')
        )
      )
    ),

    // Manage Sections Modal
    sectionsModal.open && h(Dialog, { open: true, onClose: () => setSectionsModal({ open: false, page: null, sections: [] }), maxWidth: 'md', fullWidth: true },
      h(DialogTitle, null, `Manage sections: ${sectionsModal.page?.title}`),
      h(DialogContent, null,
        h(Box, { sx: { mb: 2 } },
          h(Typography, { variant: 'body2', color: 'text.secondary', mb: 1.5 }, 'Add modular layout blocks and customize display order.'),
          h(FormControl, { size: 'small', sx: { minWidth: 200 } },
            h(InputLabel, null, 'Add section block'),
            h(Select, {
              label: 'Add section block',
              value: '',
              onChange: (e) => {
                if (e.target.value) handleAddSection(e.target.value);
              }
            },
              cmsSectionTypes.map(st => h(MenuItem, { key: st.type, value: st.type }, st.label))
            )
          )
        ),
        h(Divider, { sx: { my: 2 } }),
        sectionsModal.sections.length === 0
          ? h(Typography, { color: 'text.secondary', textAlign: 'center', py: 3 }, 'No sections added yet. Select a block type above.')
          : h(Stack, { spacing: 2 },
              sectionsModal.sections.map((sec, idx) =>
                h(Paper, { key: sec.id || idx, variant: 'outlined', sx: { p: 2, bgcolor: '#fffaf6' } },
                  h(Grid, { container: true, spacing: 2, alignItems: 'center' },
                    h(Grid, { item: true, xs: 12, sm: 4 },
                      h(Typography, { variant: 'subtitle2', fontWeight: 700 }, cmsSectionTypes.find(t => t.type === sec.type)?.label || sec.type),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, `ID: ${sec.id}`)
                    ),
                    h(Grid, { item: true, xs: 6, sm: 3 },
                      h(TextField, {
                        label: 'Order',
                        type: 'number',
                        value: sec.position,
                        onChange: (e) => handleUpdateSectionField(idx, 'position', Number(e.target.value)),
                        size: 'small',
                        fullWidth: true
                      })
                    ),
                    h(Grid, { item: true, xs: 6, sm: 3 },
                      h(FormControlLabel, {
                        control: h(Switch, {
                          checked: Boolean(sec.visible),
                          onChange: (e) => handleUpdateSectionField(idx, 'visible', e.target.checked),
                          color: 'primary'
                        }),
                        label: sec.visible ? 'Visible' : 'Hidden'
                      })
                    ),
                    h(Grid, { item: true, xs: 12, sm: 2, sx: { textAlign: 'right' } },
                      h(Button, { size: 'small', color: 'error', onClick: () => handleRemoveSection(idx) }, 'Remove')
                    )
                  )
                )
              )
            )
      ),
      h(DialogActions, { sx: { p: 2.5 } },
        h(Button, { onClick: () => setSectionsModal({ open: false, page: null, sections: [] }) }, 'Cancel'),
        h(Button, { variant: 'contained', color: 'primary', onClick: handleSaveSections }, 'Save layout sections')
      )
    )
  );
}

function MediaGalleryView({ assets, request, notify, refreshView }) {
  const assetList = Array.isArray(assets) ? assets : (Array.isArray(assets?.data) ? assets.data : []);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    setUploading(true);
    try {
      await request('/api/v1/owner/media', { method: 'POST', body: form, form: true });
      notify('Image uploaded successfully.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (publicId) => {
    if (!window.confirm('Permanently delete this image?')) return;
    try {
      await request(`/api/v1/owner/media/${publicId}`, { method: 'DELETE' });
      notify('Media asset deleted.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleCopyUrl = (url) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      notify('Image URL copied to clipboard.', 'success');
    } else {
      window.prompt('Copy image URL:', url);
    }
  };

  return h(Box, null,
    h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 } },
      h(Box, null,
        h(Typography, { variant: 'h4' }, 'Media gallery'),
        h(Typography, { variant: 'subtitle1' }, 'Store and manage images for storefront logos, hero banners, and menus.')
      ),
      h(Button, { variant: 'contained', component: 'label', disabled: uploading },
        uploading ? 'Uploading...' : 'Upload new image',
        h('input', { type: 'file', hidden: true, accept: 'image/jpeg,image/png,image/webp', onChange: handleUpload })
      )
    ),

    h(Card, null,
      h(CardHeader, { title: 'Media assets', subheader: `${assetList.length} files stored` }),
      h(CardContent, null,
        assetList.length === 0
          ? h(Box, { sx: { textAlign: 'center', py: 6 } },
              h(Icon, { name: 'photo_library', sx: { fontSize: 48, color: '#c5b8b0', mb: 1 } }),
              h(Typography, { color: 'text.secondary' }, 'No media files uploaded yet. Upload your first branding asset above.')
            )
          : h(Grid, { container: true, spacing: 2.5 },
              assetList.map(ast =>
                h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 3, key: ast.id },
                  h(Paper, { variant: 'outlined', sx: { overflow: 'hidden', borderRadius: 2, display: 'flex', flexDirection: 'column', height: '100%' } },
                    h(Box, {
                      sx: {
                        height: 160,
                        bgcolor: '#f5eee8',
                        backgroundImage: `url(${ast.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }
                    }),
                    h(Box, { sx: { p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } },
                      h(Box, null,
                        h(Typography, { variant: 'caption', color: 'text.secondary', display: 'block' },
                          `${ast.mime_type || 'image'} • ${(Number(ast.size_bytes || 0) / 1024).toFixed(1)} KB`
                        ),
                        h(Typography, { variant: 'caption', color: 'text.secondary', display: 'block' },
                          `Uploaded ${date(ast.created_at)}`
                        )
                      ),
                      h(Stack, { direction: 'row', spacing: 1, mt: 1.5 },
                        h(Button, { size: 'small', variant: 'outlined', fullWidth: true, onClick: () => handleCopyUrl(ast.url) }, 'Copy URL'),
                        h(Button, { size: 'small', color: 'error', onClick: () => handleDelete(ast.id) }, 'Delete')
                      )
                    )
                  )
                )
              )
            )
      )
    )
  );
}

// ----------------------------------------------------
// SUPER ADMIN PLATFORM VIEW COMPONENTS
// ----------------------------------------------------

function PlatformOverviewView({ data, setCurrentView }) {
  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Platform overview'),
      h(Typography, { variant: 'subtitle1' }, 'Tenant health and activity across Vondo.')
    ),
    h(Grid, { container: true, spacing: 2.5, sx: { mb: 3.5 } },
      h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 }, h(MetricCard, { label: 'Restaurants', value: data?.restaurants ?? 0, icon: 'store' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 }, h(MetricCard, { label: 'Active', value: data?.active_restaurants ?? 0, icon: 'check_circle', color: 'success.main' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 }, h(MetricCard, { label: 'Trials', value: data?.trial_restaurants ?? 0, icon: 'hourglass_empty', color: 'warning.main' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 }, h(MetricCard, { label: 'Suspended', value: data?.suspended_restaurants ?? 0, icon: 'block', color: 'error.main' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 }, h(MetricCard, { label: 'Customers', value: data?.customers ?? 0, icon: 'people' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 }, h(MetricCard, { label: 'Orders', value: data?.orders ?? 0, icon: 'receipt' }))
    ),
    h(Grid, { container: true, spacing: 3 },
      h(Grid, { item: true, xs: 12, md: 8 },
        h(Card, null,
          h(CardHeader, { title: 'Platform health' }),
          h(CardContent, null,
            h(Grid, { container: true, spacing: 2 },
              h(Grid, { item: true, xs: 12, sm: 4 },
                h(Paper, { variant: 'outlined', sx: { p: 2, borderLeft: '4px solid #2e7d32' } },
                  h(Typography, { variant: 'subtitle2', fontWeight: 700 }, 'API & Database'),
                  h(Typography, { variant: 'caption', color: 'success.main' }, 'Responding normally')
                )
              ),
              h(Grid, { item: true, xs: 12, sm: 4 },
                h(Paper, { variant: 'outlined', sx: { p: 2, borderLeft: `4px solid ${data?.builds_waiting ? '#ed6c02' : '#2e7d32'}` } },
                  h(Typography, { variant: 'subtitle2', fontWeight: 700 }, 'Build Queue'),
                  h(Typography, { variant: 'caption', color: 'text.secondary' }, `${data?.builds_waiting ?? 0} waiting`)
                )
              ),
              h(Grid, { item: true, xs: 12, sm: 4 },
                h(Paper, { variant: 'outlined', sx: { p: 2, borderLeft: `4px solid ${data?.suspended_restaurants ? '#d32f2f' : '#2e7d32'}` } },
                  h(Typography, { variant: 'subtitle2', fontWeight: 700 }, 'Restaurant Access'),
                  h(Typography, { variant: 'caption', color: 'text.secondary' }, `${data?.suspended_restaurants ?? 0} suspended`)
                )
              )
            )
          )
        )
      ),
      h(Grid, { item: true, xs: 12, md: 4 },
        h(Card, null,
          h(CardHeader, { title: 'Quick actions' }),
          h(CardContent, null,
            h(Stack, { spacing: 1.5 },
              h(Button, { variant: 'contained', color: 'primary', fullWidth: true, onClick: () => setCurrentView('restaurants') }, 'Create restaurant'),
              h(Button, { variant: 'outlined', color: 'secondary', fullWidth: true, onClick: () => setCurrentView('audit') }, 'Review audit log'),
              h(Button, { variant: 'outlined', color: 'secondary', fullWidth: true, onClick: () => setCurrentView('platform-builds') }, 'Check builds')
            )
          )
        )
      )
    )
  );
}

function PlatformRestaurantsView({ data, setSelectedRestaurant, setCurrentView, request, notify, refreshView }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [page, setPage] = useState(0);

  const restaurants = data?.data || [];
  const meta = data?.meta || { total: restaurants.length };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    try {
      const res = await request('/api/v1/platform/restaurants', { method: 'POST', body });
      notify('Restaurant and owner created.', 'success');
      setCreateModal(false);
      setSelectedRestaurant(res.data.id);
      setCurrentView('restaurant-detail');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 } },
      h(Box, null,
        h(Typography, { variant: 'h4' }, 'Restaurants'),
        h(Typography, { variant: 'subtitle1' }, 'Provision owners and manage each tenant lifecycle.')
      ),
      h(Button, { variant: 'contained', color: 'primary', onClick: () => setCreateModal(true) }, 'Create restaurant & owner')
    ),
    // Filter Bar
    h(Card, { sx: { mb: 3 } },
      h(CardContent, { sx: { p: 2, '&:last-child': { pb: 2 } } },
        h(Grid, { container: true, spacing: 2, alignItems: 'center' },
          h(Grid, { item: true, xs: 12, sm: 6 },
            h(TextField, {
              placeholder: 'Search name or store code',
              value: search,
              onChange: (e) => setSearch(e.target.value),
              size: 'small',
              fullWidth: true
            })
          ),
          h(Grid, { item: true, xs: 12, sm: 4 },
            h(FormControl, { size: 'small', fullWidth: true },
              h(InputLabel, null, 'Status'),
              h(Select, { value: status, label: 'Status', onChange: (e) => setStatus(e.target.value) },
                h(MenuItem, { value: '' }, 'All statuses'),
                ['draft', 'trial', 'active', 'suspended', 'archived'].map(s => h(MenuItem, { key: s, value: s }, s))
              )
            )
          ),
          h(Grid, { item: true, xs: 12, sm: 2 },
            h(Button, { variant: 'contained', color: 'primary', fullWidth: true, onClick: () => refreshView() }, 'Apply')
          )
        )
      )
    ),
    // Restaurants Table
    h(Card, null,
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Restaurant'),
              h(TableCell, null, 'Status'),
              h(TableCell, null, 'Members'),
              h(TableCell, null, 'Domains'),
              h(TableCell, null, 'Created'),
              h(TableCell, { align: 'right' }, 'Action')
            )
          ),
          h(TableBody, null,
            restaurants.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 6, align: 'center', sx: { py: 4 } }, 'No restaurants match these filters.'))
              : restaurants.map(r =>
                  h(TableRow, { key: r.id },
                    h(TableCell, null,
                      h(Typography, { variant: 'body2', fontWeight: 700 }, r.name),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, r.slug)
                    ),
                    h(TableCell, null, h(Chip, { label: r.status, size: 'small', color: r.status === 'active' ? 'success' : r.status === 'suspended' ? 'error' : 'default' })),
                    h(TableCell, null, r.memberships_count),
                    h(TableCell, null, r.domains_count),
                    h(TableCell, null, date(r.created_at)),
                    h(TableCell, { align: 'right' },
                      h(Button, {
                        size: 'small',
                        variant: 'outlined',
                        onClick: () => {
                          setSelectedRestaurant(r.id);
                          setCurrentView('restaurant-detail');
                        }
                      }, 'Manage')
                    )
                  )
                )
          )
        )
      ),
      h(TablePagination, {
        component: 'div',
        count: meta.total || restaurants.length,
        page: page,
        rowsPerPage: 25,
        rowsPerPageOptions: [25],
        onPageChange: (_, newPage) => setPage(newPage)
      })
    ),

    // Create Restaurant Dialog
    createModal && h(Dialog, { open: true, onClose: () => setCreateModal(false), maxWidth: 'sm', fullWidth: true },
      h('form', { onSubmit: handleCreateRestaurant },
        h(DialogTitle, null, 'Create restaurant & owner'),
        h(DialogContent, null,
          h(Grid, { container: true, spacing: 2, mt: 0.5 },
            h(Grid, { item: true, xs: 12, sm: 6 }, h(TextField, { label: 'Restaurant Name', name: 'restaurant_name', required: true, size: 'small', fullWidth: true })),
            h(Grid, { item: true, xs: 12, sm: 6 }, h(TextField, { label: 'Owner Name', name: 'owner_name', required: true, size: 'small', fullWidth: true })),
            h(Grid, { item: true, xs: 12 }, h(TextField, { label: 'Owner Email', name: 'email', type: 'email', required: true, size: 'small', fullWidth: true })),
            h(Grid, { item: true, xs: 12, sm: 6 }, h(TextField, { label: 'Temporary Password', name: 'password', type: 'password', required: true, size: 'small', fullWidth: true, helperText: 'Min 10 characters' })),
            h(Grid, { item: true, xs: 12, sm: 6 }, h(TextField, { label: 'Confirm Password', name: 'password_confirmation', type: 'password', required: true, size: 'small', fullWidth: true })),
            h(Grid, { item: true, xs: 12, sm: 6 }, h(TextField, { label: 'Timezone', name: 'timezone', defaultValue: 'Africa/Casablanca', required: true, size: 'small', fullWidth: true })),
            h(Grid, { item: true, xs: 12, sm: 6 }, h(TextField, { label: 'Currency Code', name: 'currency_code', defaultValue: 'MAD', required: true, size: 'small', fullWidth: true }))
          )
        ),
        h(DialogActions, { sx: { p: 2.5 } },
          h(Button, { onClick: () => setCreateModal(false) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Create tenant')
        )
      )
    )
  );
}

function PlatformRestaurantDetailView({ detail, selectedRestaurant, setCurrentView, request, notify, refreshView }) {
  const r = detail?.restaurant;
  const plans = detail?.plans || [];
  const [supportModal, setSupportModal] = useState(false);

  if (!r) return h(Typography, null, 'Loading restaurant details...');

  const featureDefaults = ['online_ordering', 'reservations', 'custom_domain', 'customer_app', 'vendor_app', 'white_label_builds'];
  const allFeatures = [...new Set([...featureDefaults, ...(r.features || []).map(f => f.key)])];

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await request(`/api/v1/platform/restaurants/${selectedRestaurant}/status`, { method: 'PATCH', body });
      notify('Status updated.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleAssignPlan = async (e) => {
    e.preventDefault();
    const dataObj = Object.fromEntries(new FormData(e.currentTarget));
    if (!dataObj.current_period_ends_at) delete dataObj.current_period_ends_at;
    dataObj.plan_id = Number(dataObj.plan_id);
    try {
      await request(`/api/v1/platform/restaurants/${selectedRestaurant}/subscription`, { method: 'PUT', body: dataObj });
      notify('Subscription updated.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleToggleDomain = async (dom) => {
    const verified = !dom.verified_at;
    const reason = window.prompt(`Reason to ${verified ? 'verify' : 'unverify'} this domain:`);
    if (!reason) return;
    try {
      await request(`/api/v1/platform/restaurants/${selectedRestaurant}/domains/${dom.id}/verification`, {
        method: 'PATCH',
        body: { verified, reason }
      });
      notify('Domain verification updated.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleToggleFeature = async (key, enabled) => {
    const reason = window.prompt(`Reason to ${enabled ? 'enable' : 'disable'} ${key}:`);
    if (!reason) return;
    try {
      await request(`/api/v1/platform/restaurants/${selectedRestaurant}/features/${key}`, {
        method: 'PUT',
        body: { enabled, reason }
      });
      notify('Feature updated.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleStartSupportSession = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    body.duration_minutes = Number(body.duration_minutes);
    try {
      const created = (await request(`/api/v1/platform/restaurants/${selectedRestaurant}/support-sessions`, { method: 'POST', body })).data;
      const res = await fetch('/api/v1/owner/support-session/exchange', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Vondo-Restaurant': selectedRestaurant },
        body: JSON.stringify({ exchange_token: created.exchange_token })
      });
      const session = await res.json();
      if (!res.ok) throw new Error(session.message || 'Support session could not be exchanged.');

      localStorage.setItem(`vondo:${window.location.host}:owner:admin_token`, session.token);
      localStorage.removeItem(`vondo:${window.location.host}:owner:admin_refresh_token`);
      localStorage.setItem('vondo_admin_mode', 'owner');
      window.location.assign(`${window.location.pathname}?restaurant=${encodeURIComponent(selectedRestaurant)}&support=1`);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleEndSupportSession = async (sessionId) => {
    if (!window.confirm('End this active support session?')) return;
    try {
      await request(`/api/v1/platform/support-sessions/${sessionId}`, { method: 'DELETE' });
      notify('Support session ended.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 } },
      h(Stack, { direction: 'row', spacing: 1.5, alignItems: 'center' },
        h(Button, { variant: 'outlined', onClick: () => setCurrentView('restaurants') }, '← All restaurants'),
        h(Typography, { variant: 'h5', fontWeight: 700 }, r.name)
      ),
      h(Stack, { direction: 'row', spacing: 1.5 },
        r.active_support_session && h(Button, {
          variant: 'outlined',
          color: 'error',
          onClick: () => handleEndSupportSession(r.active_support_session.public_id || r.active_support_session.id)
        }, 'End active session'),
        h(Button, { variant: 'contained', color: 'primary', onClick: () => setSupportModal(true) }, 'Open audited support session')
      )
    ),

    // Usage Metrics Grid
    h(Grid, { container: true, spacing: 2, sx: { mb: 3 } },
      h(Grid, { item: true, xs: 12, sm: 6, md: 2.4 }, h(MetricCard, { label: 'Locations', value: r.usage?.locations ?? 0, icon: 'storefront' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 2.4 }, h(MetricCard, { label: 'Menu items', value: r.usage?.menus ?? 0, icon: 'restaurant_menu' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 2.4 }, h(MetricCard, { label: 'Customers', value: r.usage?.customers ?? 0, icon: 'people' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 2.4 }, h(MetricCard, { label: 'Orders', value: r.usage?.orders ?? 0, icon: 'receipt' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 2.4 }, h(MetricCard, { label: 'Reservations', value: r.usage?.reservations ?? 0, icon: 'event_seat' }))
    ),

    h(Grid, { container: true, spacing: 3 },
      // Status Form
      h(Grid, { item: true, xs: 12, md: 8 },
        h(Card, null,
          h(CardHeader, {
            title: r.name,
            subheader: `${r.slug} • ${r.currency_code} • ${r.timezone}`,
            action: h(Chip, { label: r.status, color: r.status === 'active' ? 'success' : 'default' })
          }),
          h(CardContent, null,
            h('form', { onSubmit: handleUpdateStatus },
              h(Grid, { container: true, spacing: 2 },
                h(Grid, { item: true, xs: 12, sm: 6 },
                  h(FormControl, { size: 'small', fullWidth: true },
                    h(InputLabel, null, 'Lifecycle status'),
                    h(Select, { name: 'status', defaultValue: r.status, label: 'Lifecycle status' },
                      ['draft', 'trial', 'active', 'suspended', 'archived'].map(s => h(MenuItem, { key: s, value: s }, s))
                    )
                  )
                ),
                h(Grid, { item: true, xs: 12, sm: 6 },
                  h(TextField, { label: 'Reason (audit required)', name: 'reason', required: true, size: 'small', fullWidth: true })
                ),
                h(Grid, { item: true, xs: 12 },
                  h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Update status')
                )
              )
            )
          )
        )
      ),

      // Subscription Form
      h(Grid, { item: true, xs: 12, md: 4 },
        h(Card, null,
          h(CardHeader, { title: 'Subscription' }),
          h(CardContent, null,
            h('form', { onSubmit: handleAssignPlan },
              h(Stack, { spacing: 2 },
                h(FormControl, { size: 'small', fullWidth: true },
                  h(InputLabel, null, 'Plan'),
                  h(Select, { name: 'plan_id', defaultValue: r.subscription?.plan?.id || '', label: 'Plan', required: true },
                    plans.map(p => h(MenuItem, { key: p.id, value: p.id }, p.name))
                  )
                ),
                h(FormControl, { size: 'small', fullWidth: true },
                  h(InputLabel, null, 'Status'),
                  h(Select, { name: 'status', defaultValue: r.subscription?.status || 'active', label: 'Status' },
                    h(MenuItem, { value: 'trial' }, 'Trial'),
                    h(MenuItem, { value: 'active' }, 'Active'),
                    h(MenuItem, { value: 'past_due' }, 'Past due'),
                    h(MenuItem, { value: 'cancelled' }, 'Cancelled')
                  )
                ),
                h(TextField, {
                  label: 'Period end',
                  name: 'current_period_ends_at',
                  type: 'date',
                  defaultValue: (r.subscription?.current_period_ends_at || '').slice(0, 10),
                  size: 'small',
                  fullWidth: true,
                  InputLabelProps: { shrink: true }
                }),
                h(TextField, { label: 'Reason (audit required)', name: 'reason', required: true, size: 'small', fullWidth: true }),
                h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Assign plan')
              )
            )
          )
        )
      ),

      // Domains
      h(Grid, { item: true, xs: 12, md: 6 },
        h(Card, null,
          h(CardHeader, { title: 'Domains' }),
          h(CardContent, null,
            (r.domains || []).length === 0
              ? h(Typography, { color: 'text.secondary' }, 'No domains.')
              : h(Stack, { spacing: 1.5 },
                  r.domains.map(dom =>
                    h(Paper, { key: dom.id, variant: 'outlined', sx: { p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                      h(Box, null,
                        h(Typography, { variant: 'body2', fontWeight: 700 }, dom.host),
                        h(Typography, { variant: 'caption', color: 'text.secondary' }, dom.is_primary ? 'Primary domain' : 'Custom domain')
                      ),
                      h(Button, {
                        size: 'small',
                        variant: 'outlined',
                        color: dom.verified_at ? 'error' : 'primary',
                        onClick: () => handleToggleDomain(dom)
                      }, dom.verified_at ? 'Unverify' : 'Verify')
                    )
                  )
                )
          )
        )
      ),

      // Features Toggle
      h(Grid, { item: true, xs: 12, md: 6 },
        h(Card, null,
          h(CardHeader, { title: 'Features' }),
          h(CardContent, null,
            h(Stack, { spacing: 1 },
              allFeatures.map(fKey => {
                const item = (r.features || []).find(f => f.key === fKey);
                const isEnabled = !!item?.enabled;
                return h(Paper, { key: fKey, variant: 'outlined', sx: { p: 1, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                  h(Box, null,
                    h(Typography, { variant: 'body2', fontWeight: 600 }, fKey.replaceAll('_', ' ')),
                    h(Typography, { variant: 'caption', color: 'text.secondary' }, isEnabled ? 'Enabled' : 'Disabled')
                  ),
                  h(Switch, {
                    checked: isEnabled,
                    onChange: (e) => handleToggleFeature(fKey, e.target.checked),
                    color: 'success'
                  })
                );
              })
            )
          )
        )
      ),

      // Team Members
      h(Grid, { item: true, xs: 12 },
        h(Card, null,
          h(CardHeader, { title: 'Team members' }),
          h(CardContent, null,
            h(TableContainer, null,
              h(Table, null,
                h(TableHead, null,
                  h(TableRow, null,
                    h(TableCell, null, 'Name'),
                    h(TableCell, null, 'Email'),
                    h(TableCell, null, 'Role'),
                    h(TableCell, null, 'Status')
                  )
                ),
                h(TableBody, null,
                  (r.members || []).map(m =>
                    h(TableRow, { key: m.id || m.email },
                      h(TableCell, null, m.name || '—'),
                      h(TableCell, null, m.email || '—'),
                      h(TableCell, null, m.role),
                      h(TableCell, null, h(Chip, { label: m.status, size: 'small', color: m.status === 'active' ? 'success' : 'default' }))
                    )
                  )
                )
              )
            )
          )
        )
      )
    ),

    // Support Session Modal
    supportModal && h(Dialog, { open: true, onClose: () => setSupportModal(false), maxWidth: 'sm', fullWidth: true },
      h('form', { onSubmit: handleStartSupportSession },
        h(DialogTitle, null, 'Open audited support session'),
        h(DialogContent, null,
          h(Typography, { variant: 'body2', color: 'text.secondary', mb: 2 },
            `You will enter ${r.name} as an owner. A visible banner and permanent audit trail protect the tenant.`
          ),
          h(Stack, { spacing: 2 },
            h(TextField, { label: 'Reason (min 10 characters)', name: 'reason', multiline: true, rows: 2, required: true, size: 'small', fullWidth: true, inputProps: { minLength: 10, maxLength: 500 } }),
            h(FormControl, { size: 'small', fullWidth: true },
              h(InputLabel, null, 'Duration'),
              h(Select, { name: 'duration_minutes', defaultValue: '15', label: 'Duration' },
                h(MenuItem, { value: '15' }, '15 minutes'),
                h(MenuItem, { value: '30' }, '30 minutes'),
                h(MenuItem, { value: '60' }, '60 minutes')
              )
            )
          )
        ),
        h(DialogActions, { sx: { p: 2.5 } },
          h(Button, { onClick: () => setSupportModal(false) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Start support session')
        )
      )
    )
  );
}

function PlatformOperationsView({ data, request, notify, refreshView }) {
  const health = data?.health || {};
  const alerts = data?.alerts?.data || [];
  const meta = data?.alerts?.meta || { total: alerts.length };

  const handleAcknowledgeAlert = async (alertId) => {
    const reason = window.prompt('Acknowledgement note:');
    if (!reason) return;
    try {
      await request(`/api/v1/platform/alerts/${alertId}/acknowledge`, { method: 'POST', body: { reason } });
      notify('Alert acknowledged.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Platform operations'),
      h(Typography, { variant: 'subtitle1' }, 'Live health probes and actionable cross-tenant alerts.')
    ),
    // Dependency Health
    h(Card, { sx: { mb: 3 } },
      h(CardHeader, {
        title: 'Dependency health',
        subheader: `Last checked ${date(health.checked_at)}`,
        action: h(Chip, { label: health.status || 'healthy', color: health.status === 'healthy' ? 'success' : 'error' })
      }),
      h(CardContent, null,
        h(Grid, { container: true, spacing: 2 },
          Object.entries(health.checks || {}).map(([name, chk]) =>
            h(Grid, { item: true, xs: 12, sm: 6, md: 3, key: name },
              h(Paper, { variant: 'outlined', sx: { p: 2, borderLeft: `4px solid ${chk.ok ? '#2e7d32' : '#ed6c02'}` } },
                h(Typography, { variant: 'subtitle2', fontWeight: 700 }, name.replaceAll('_', ' ')),
                h(Typography, { variant: 'caption', color: 'text.secondary' },
                  chk.ok ? `${chk.latency_ms ?? 0} ms` : (chk.error || `${chk.failed_last_hour || 0} issue(s)`)
                )
              )
            )
          )
        )
      )
    ),

    // Alerts Table
    h(Card, null,
      h(CardHeader, { title: 'Open alerts', subheader: 'Jobs, tenant health, domains, payments, storage, storefront, and builds.' }),
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Severity'),
              h(TableCell, null, 'Type'),
              h(TableCell, null, 'Restaurant'),
              h(TableCell, null, 'Message'),
              h(TableCell, null, 'Last seen'),
              h(TableCell, { align: 'right' }, 'Action')
            )
          ),
          h(TableBody, null,
            alerts.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 6, align: 'center', sx: { py: 4 } }, 'No open operational alerts.'))
              : alerts.map(a =>
                  h(TableRow, { key: a.id },
                    h(TableCell, null, h(Chip, { label: a.severity, size: 'small', color: a.severity === 'critical' ? 'error' : 'warning' })),
                    h(TableCell, null, a.type),
                    h(TableCell, null, a.restaurant?.name || 'Platform'),
                    h(TableCell, null, a.message),
                    h(TableCell, null, date(a.last_seen_at)),
                    h(TableCell, { align: 'right' },
                      h(Button, { size: 'small', variant: 'outlined', onClick: () => handleAcknowledgeAlert(a.id) }, 'Acknowledge')
                    )
                  )
                )
          )
        )
      )
    )
  );
}

function PlatformReportsView({ data, request, notify }) {
  const [from, setFrom] = useState(() => new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const rows = data || [];
  const totals = rows.reduce((sum, r) => ({
    orders: sum.orders + (r.orders || 0),
    revenue: sum.revenue + (r.revenue || 0),
    reservations: sum.reservations + (r.reservations || 0),
    restaurants: sum.restaurants + (r.new_restaurants || 0)
  }), { orders: 0, revenue: 0, reservations: 0, restaurants: 0 });

  const handleExportCsv = async () => {
    try {
      const currentToken = localStorage.getItem(`vondo:${window.location.host}:platform:admin_token`);
      const res = await fetch(`/api/v1/platform/reports/export?${qs({ from, to })}`, {
        headers: { Accept: 'text/csv', Authorization: `Bearer ${currentToken}` }
      });
      if (!res.ok) throw new Error('Export failed.');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `vondo-report-${from}-${to}.csv`;
      link.click();
      notify('Report downloaded.', 'success');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Platform reports'),
      h(Typography, { variant: 'subtitle1' }, 'Tenant-safe daily activity with a bounded CSV export.')
    ),
    // Filter
    h(Card, { sx: { mb: 3 } },
      h(CardContent, { sx: { p: 2, '&:last-child': { pb: 2 } } },
        h(Grid, { container: true, spacing: 2, alignItems: 'center' },
          h(Grid, { item: true, xs: 12, sm: 4 },
            h(TextField, { label: 'From Date', type: 'date', value: from, onChange: (e) => setFrom(e.target.value), size: 'small', fullWidth: true, InputLabelProps: { shrink: true } })
          ),
          h(Grid, { item: true, xs: 12, sm: 4 },
            h(TextField, { label: 'To Date', type: 'date', value: to, onChange: (e) => setTo(e.target.value), size: 'small', fullWidth: true, InputLabelProps: { shrink: true } })
          ),
          h(Grid, { item: true, xs: 12, sm: 2 },
            h(Button, { variant: 'contained', color: 'primary', fullWidth: true }, 'Run report')
          ),
          h(Grid, { item: true, xs: 12, sm: 2 },
            h(Button, { variant: 'outlined', color: 'secondary', fullWidth: true, onClick: handleExportCsv }, 'Export CSV')
          )
        )
      )
    ),

    // Totals Grid
    h(Grid, { container: true, spacing: 2.5, sx: { mb: 3 } },
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 }, h(MetricCard, { label: 'Orders', value: totals.orders, icon: 'receipt' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 }, h(MetricCard, { label: 'Revenue', value: money(totals.revenue), icon: 'payments' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 }, h(MetricCard, { label: 'Reservations', value: totals.reservations, icon: 'event_seat' })),
      h(Grid, { item: true, xs: 12, sm: 6, md: 3 }, h(MetricCard, { label: 'New restaurants', value: totals.restaurants, icon: 'store' }))
    ),

    // Report Table
    h(Card, null,
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Date'),
              h(TableCell, null, 'Orders'),
              h(TableCell, null, 'Revenue'),
              h(TableCell, null, 'Reservations'),
              h(TableCell, null, 'New restaurants')
            )
          ),
          h(TableBody, null,
            rows.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 5, align: 'center', sx: { py: 4 } }, 'No report data.'))
              : rows.map((r, idx) =>
                  h(TableRow, { key: idx },
                    h(TableCell, null, r.date),
                    h(TableCell, null, r.orders),
                    h(TableCell, null, money(r.revenue)),
                    h(TableCell, null, r.reservations),
                    h(TableCell, null, r.new_restaurants)
                  )
                )
          )
        )
      )
    )
  );
}

function PlatformBuildsView({ data, request, notify, refreshView }) {
  const builds = data?.data || [];
  const meta = data?.meta || { total: builds.length };
  const [detailModal, setDetailModal] = useState({ open: false, build: null });

  const handleViewDetail = async (buildId) => {
    try {
      const res = await request(`/api/v1/platform/app-builds/${buildId}`);
      setDetailModal({ open: true, build: res.data });
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleAction = async (buildId, action) => {
    const reason = window.prompt(`Reason to ${action} this build:`);
    if (!reason) return;
    try {
      await request(`/api/v1/platform/app-builds/${buildId}/${action}`, { method: 'POST', body: { reason } });
      notify('Build updated.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'App builds'),
      h(Typography, { variant: 'subtitle1' }, 'Cross-tenant build queue, logs, artifacts, retries, and cancellation.')
    ),
    h(Card, null,
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Restaurant'),
              h(TableCell, null, 'Platform'),
              h(TableCell, null, 'Status'),
              h(TableCell, null, 'Attempts'),
              h(TableCell, null, 'Failure'),
              h(TableCell, null, 'Requested'),
              h(TableCell, { align: 'right' }, 'Action')
            )
          ),
          h(TableBody, null,
            builds.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 7, align: 'center', sx: { py: 4 } }, 'No app builds.'))
              : builds.map(b =>
                  h(TableRow, { key: b.id },
                    h(TableCell, null, h(Typography, { variant: 'body2', fontWeight: 700 }, b.restaurant?.name)),
                    h(TableCell, null, b.platform),
                    h(TableCell, null, h(Chip, { label: b.status, size: 'small', color: b.status === 'success' ? 'success' : ['failed', 'cancelled'].includes(b.status) ? 'error' : 'warning' })),
                    h(TableCell, null, b.attempts),
                    h(TableCell, null, b.failure_message || '—'),
                    h(TableCell, null, date(b.created_at)),
                    h(TableCell, { align: 'right' },
                      h(Stack, { direction: 'row', spacing: 1, justifyContent: 'flex-end' },
                        h(Button, { size: 'small', variant: 'outlined', onClick: () => handleViewDetail(b.id) }, 'Details'),
                        ['failed', 'cancelled'].includes(b.status) && h(Button, { size: 'small', onClick: () => handleAction(b.id, 'retry') }, 'Retry'),
                        ['queued', 'preparing', 'configuration_ready'].includes(b.status) && h(Button, { size: 'small', color: 'error', onClick: () => handleAction(b.id, 'cancel') }, 'Cancel')
                      )
                    )
                  )
                )
          )
        )
      )
    ),

    // Build Detail Modal
    detailModal.open && h(Dialog, { open: true, onClose: () => setDetailModal({ open: false, build: null }), maxWidth: 'md', fullWidth: true },
      h(DialogTitle, null, `${detailModal.build?.restaurant?.name} • ${detailModal.build?.platform} (${detailModal.build?.status})`),
      h(DialogContent, null,
        h(Typography, { variant: 'subtitle2', mb: 1 }, 'Events Timeline'),
        h(List, { sx: { mb: 3 } },
          (detailModal.build?.events || []).map((ev, idx) =>
            h(ListItem, { key: idx },
              h(ListItemText, { primary: ev.event, secondary: `${ev.message} • ${date(ev.created_at)}` })
            )
          )
        ),
        h(Divider, { sx: { my: 2 } }),
        h(Typography, { variant: 'subtitle2', mb: 1 }, 'Artifacts'),
        (detailModal.build?.artifacts || []).length === 0
          ? h(Typography, { color: 'text.secondary' }, 'No artifacts.')
          : h(List, null,
              detailModal.build.artifacts.map((art, idx) =>
                h(ListItem, { key: idx },
                  h(ListItemText, { primary: art.kind, secondary: `${art.size_bytes} bytes • SHA-256 ${art.sha256} • expires ${date(art.expires_at)}` })
                )
              )
            )
      ),
      h(DialogActions, null,
        h(Button, { onClick: () => setDetailModal({ open: false, build: null }) }, 'Close')
      )
    )
  );
}

function PlatformAuditView({ data }) {
  const logs = data?.data || [];
  const meta = data?.meta || { total: logs.length };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Audit log'),
      h(Typography, { variant: 'subtitle1' }, 'Recorded owner and Super Admin changes across tenants.')
    ),
    h(Card, null,
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Time'),
              h(TableCell, null, 'Actor'),
              h(TableCell, null, 'Action'),
              h(TableCell, null, 'Restaurant ID'),
              h(TableCell, null, 'Subject'),
              h(TableCell, null, 'Details')
            )
          ),
          h(TableBody, null,
            logs.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 6, align: 'center', sx: { py: 4 } }, 'No audited activity yet.'))
              : logs.map(l =>
                  h(TableRow, { key: l.id },
                    h(TableCell, null, date(l.created_at)),
                    h(TableCell, null, `${l.actor_type} #${l.actor_id || '—'}`),
                    h(TableCell, null, h(Typography, { variant: 'body2', fontWeight: 700 }, l.action)),
                    h(TableCell, null, l.restaurant_id || 'Platform'),
                    h(TableCell, null, `${l.subject_type || '—'} ${l.subject_id || ''}`),
                    h(TableCell, null, h('code', { style: { fontSize: 11 } }, JSON.stringify(l.metadata || {})))
                  )
                )
          )
        )
      )
    )
  );
}

function PlatformPlansView({ plans, request, notify, refreshView }) {
  const planList = Array.isArray(plans) ? plans : (Array.isArray(plans?.data) ? plans.data : []);
  const [editPlanModal, setEditPlanModal] = useState({ open: false, plan: null });

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const dataObj = Object.fromEntries(new FormData(form));
    dataObj.price_minor = Number(dataObj.price_minor);
    dataObj.features = dataObj.features.split(',').map(f => f.trim()).filter(Boolean);
    dataObj.active = form.active.checked;
    try {
      await request('/api/v1/platform/subscription-plans', { method: 'POST', body: dataObj });
      notify('Plan created.', 'success');
      form.reset();
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const dataObj = Object.fromEntries(new FormData(form));
    dataObj.price_minor = Number(dataObj.price_minor);
    dataObj.features = dataObj.features.split(',').map(f => f.trim()).filter(Boolean);
    dataObj.active = form.querySelector('[name="edit_active"]').checked;
    delete dataObj.edit_active;
    try {
      await request(`/api/v1/platform/subscription-plans/${editPlanModal.plan.id}`, { method: 'PATCH', body: dataObj });
      notify('Plan updated.', 'success');
      setEditPlanModal({ open: false, plan: null });
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Plans'),
      h(Typography, { variant: 'subtitle1' }, 'Define reusable subscription packages for restaurants.')
    ),
    h(Grid, { container: true, spacing: 3 },
      h(Grid, { item: true, xs: 12, md: 8 },
        h(Card, null,
          h(CardHeader, { title: 'Subscription plans' }),
          h(CardContent, null,
            h(Stack, { spacing: 2 },
              planList.map(p =>
                h(Paper, { key: p.id, variant: 'outlined', sx: { p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                  h(Box, null,
                    h(Typography, { variant: 'subtitle1', fontWeight: 700 }, p.name),
                    h(Typography, { variant: 'body2', color: 'text.secondary' }, `${p.code} • ${money(p.price_minor / 100, p.currency_code)}/month • ${p.features?.length || 0} features`)
                  ),
                  h(Stack, { direction: 'row', spacing: 1, alignItems: 'center' },
                    h(Chip, { label: p.active ? 'Active' : 'Hidden', size: 'small', color: p.active ? 'success' : 'default' }),
                    h(Button, { size: 'small', variant: 'outlined', onClick: () => setEditPlanModal({ open: true, plan: p }) }, 'Edit')
                  )
                )
              )
            )
          )
        )
      ),
      h(Grid, { item: true, xs: 12, md: 4 },
        h(Card, null,
          h(CardHeader, { title: 'Create plan' }),
          h(CardContent, null,
            h('form', { onSubmit: handleCreatePlan },
              h(Stack, { spacing: 2 },
                h(TextField, { label: 'Name', name: 'name', required: true, size: 'small', fullWidth: true }),
                h(TextField, { label: 'Code', name: 'code', required: true, size: 'small', fullWidth: true }),
                h(TextField, { label: 'Price (minor units)', name: 'price_minor', type: 'number', defaultValue: 0, required: true, size: 'small', fullWidth: true }),
                h(TextField, { label: 'Currency', name: 'currency_code', defaultValue: 'USD', required: true, size: 'small', fullWidth: true }),
                h(TextField, { label: 'Features (comma separated)', name: 'features', placeholder: 'online_ordering, reservations', multiline: true, rows: 3, size: 'small', fullWidth: true }),
                h(FormControlLabel, { control: h(Checkbox, { name: 'active', defaultChecked: true }), label: 'Active plan' }),
                h(Button, { type: 'submit', variant: 'contained', color: 'primary', fullWidth: true }, 'Create plan')
              )
            )
          )
        )
      )
    ),

    // Edit Plan Dialog
    editPlanModal.open && h(Dialog, { open: true, onClose: () => setEditPlanModal({ open: false, plan: null }), maxWidth: 'sm', fullWidth: true },
      h('form', { onSubmit: handleUpdatePlan },
        h(DialogTitle, null, 'Edit subscription plan'),
        h(DialogContent, null,
          h(Stack, { spacing: 2, mt: 1 },
            h(TextField, { label: 'Name', name: 'name', defaultValue: editPlanModal.plan?.name || '', required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'Code', name: 'code', defaultValue: editPlanModal.plan?.code || '', required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'Price (minor units)', name: 'price_minor', type: 'number', defaultValue: editPlanModal.plan?.price_minor ?? 0, required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'Currency', name: 'currency_code', defaultValue: editPlanModal.plan?.currency_code || 'USD', required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'Features (comma separated)', name: 'features', defaultValue: (editPlanModal.plan?.features || []).join(', '), multiline: true, rows: 3, size: 'small', fullWidth: true }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'edit_active', defaultChecked: editPlanModal.plan?.active !== false }), label: 'Active plan' })
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setEditPlanModal({ open: false, plan: null }) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Save changes')
        )
      )
    )
  );
}

function PlatformTemplatesView({ templates, request, notify, refreshView }) {
  const [editModal, setEditModal] = useState({ open: false, template: null });
  const templateList = Array.isArray(templates) ? templates : (Array.isArray(templates?.data) ? templates.data : []);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const dataObj = Object.fromEntries(new FormData(form));
    try {
      dataObj.configuration = JSON.parse(dataObj.configuration);
      dataObj.active = form.active.checked;
      dataObj.is_default = form.is_default.checked;
      await request('/api/v1/platform/templates', { method: 'POST', body: dataObj });
      notify('Template created.', 'success');
      form.reset();
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Platform templates'),
      h(Typography, { variant: 'subtitle1' }, 'Versioned defaults applied atomically to newly provisioned restaurants.')
    ),
    h(Grid, { container: true, spacing: 3 },
      h(Grid, { item: true, xs: 12, md: 7 },
        h(Card, null,
          h(CardHeader, { title: 'Restaurant templates' }),
          h(CardContent, null,
            h(Stack, { spacing: 2 },
              templateList.map(t =>
                h(Paper, { key: t.id, variant: 'outlined', sx: { p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                  h(Box, null,
                    h(Typography, { variant: 'subtitle1', fontWeight: 700 }, t.name),
                    h(Typography, { variant: 'body2', color: 'text.secondary' }, `${t.code} • version ${t.version}`),
                    t.description && h(Typography, { variant: 'caption', color: 'text.secondary' }, t.description)
                  ),
                  h(Stack, { direction: 'row', spacing: 1, alignItems: 'center' },
                    t.is_default && h(Chip, { label: 'Default', size: 'small' }),
                    h(Chip, { label: t.active ? 'Active' : 'Hidden', size: 'small', color: t.active ? 'success' : 'default' }),
                    h(Button, { size: 'small', variant: 'outlined', onClick: () => setEditModal({ open: true, template: t }) }, 'Edit')
                  )
                )
              )
            )
          )
        )
      ),
      h(Grid, { item: true, xs: 12, md: 5 },
        h(Card, null,
          h(CardHeader, { title: 'Create template' }),
          h(CardContent, null,
            h('form', { onSubmit: handleCreateTemplate },
              h(Stack, { spacing: 2 },
                h(TextField, { label: 'Name', name: 'name', required: true, size: 'small', fullWidth: true }),
                h(TextField, { label: 'Code', name: 'code', required: true, size: 'small', fullWidth: true }),
                h(TextField, { label: 'Description', name: 'description', multiline: true, rows: 2, size: 'small', fullWidth: true }),
                h(TextField, {
                  label: 'Brand configuration (JSON)',
                  name: 'configuration',
                  defaultValue: JSON.stringify(templates[0]?.configuration || {}, null, 2),
                  multiline: true,
                  rows: 8,
                  required: true,
                  size: 'small',
                  fullWidth: true
                }),
                h(FormControlLabel, { control: h(Checkbox, { name: 'active', defaultChecked: true }), label: 'Active' }),
                h(FormControlLabel, { control: h(Checkbox, { name: 'is_default' }), label: 'Default template' }),
                h(Button, { type: 'submit', variant: 'contained', color: 'primary', fullWidth: true }, 'Create template')
              )
            )
          )
        )
      )
    ),

    // Edit Template Dialog
    editModal.open && h(Dialog, { open: true, onClose: () => setEditModal({ open: false, template: null }), maxWidth: 'md', fullWidth: true },
      h('form', {
        onSubmit: async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const dataObj = Object.fromEntries(new FormData(form));
          try {
            dataObj.configuration = JSON.parse(dataObj.configuration);
            dataObj.active = form.active.checked;
            dataObj.is_default = form.is_default.checked;
            await request(`/api/v1/platform/templates/${editModal.template.id}`, { method: 'PUT', body: dataObj });
            notify('Template updated.', 'success');
            setEditModal({ open: false, template: null });
            refreshView();
          } catch (err) {
            notify(err.message, 'error');
          }
        }
      },
        h(DialogTitle, null, 'Edit template'),
        h(DialogContent, null,
          h(Stack, { spacing: 2, mt: 1 },
            h(TextField, { label: 'Name', name: 'name', defaultValue: editModal.template?.name || '', required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'Description', name: 'description', defaultValue: editModal.template?.description || '', multiline: true, rows: 2, size: 'small', fullWidth: true }),
            h(TextField, {
              label: 'Configuration (JSON)',
              name: 'configuration',
              defaultValue: JSON.stringify(editModal.template?.configuration || {}, null, 2),
              multiline: true,
              rows: 10,
              required: true,
              size: 'small',
              fullWidth: true
            }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'active', defaultChecked: !!editModal.template?.active }), label: 'Active' }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'is_default', defaultChecked: !!editModal.template?.is_default }), label: 'Default template' })
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setEditModal({ open: false, template: null }) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Save version')
        )
      )
    )
  );
}

function PlatformSecurityView({ mfa, request, notify, refreshView }) {
  const [setupModal, setSetupModal] = useState({ open: false, data: null });
  const [disableModal, setDisableModal] = useState(false);

  const handleBeginMfa = async () => {
    try {
      const res = await request('/api/v1/platform/security/mfa/setup', { method: 'POST', body: {} });
      setSetupModal({ open: true, data: res.data });
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleConfirmMfa = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await request('/api/v1/platform/security/mfa/confirm', { method: 'POST', body });
      notify('MFA enabled successfully.', 'success');
      setSetupModal({ open: false, data: null });
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDisableMfa = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await request('/api/v1/platform/security/mfa', { method: 'DELETE', body });
      notify('MFA disabled.', 'success');
      setDisableModal(false);
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Security'),
      h(Typography, { variant: 'subtitle1' }, 'Stronger authentication for cross-tenant platform operations.')
    ),
    h(Card, { sx: { maxWidth: 640 } },
      h(CardHeader, { title: 'Multi-factor authentication (MFA)' }),
      h(CardContent, null,
        h(Typography, { variant: 'body2', color: 'text.secondary', mb: 3 },
          mfa.enabled
            ? `Enabled since ${date(mfa.confirmed_at)}. ${mfa.recovery_codes_remaining} recovery codes remain.`
            : 'Protect privileged platform access with a TOTP authenticator app.'
        ),
        mfa.enabled
          ? h(Button, { variant: 'contained', color: 'error', onClick: () => setDisableModal(true) }, 'Disable MFA')
          : h(Button, { variant: 'contained', color: 'primary', onClick: handleBeginMfa }, 'Set up MFA')
      )
    ),

    // Setup MFA Modal
    setupModal.open && h(Dialog, { open: true, onClose: () => setSetupModal({ open: false, data: null }), maxWidth: 'sm', fullWidth: true },
      h('form', { onSubmit: handleConfirmMfa },
        h(DialogTitle, null, 'Set up authenticator'),
        h(DialogContent, null,
          h(Typography, { variant: 'body2', mb: 1 }, 'Add this secret key to your authenticator app:'),
          h(Paper, { variant: 'outlined', sx: { p: 1.5, mb: 2, bgcolor: '#fffaf4' } },
            h('code', { style: { fontWeight: 700, fontSize: '1rem' } }, setupModal.data?.secret)
          ),
          h(Typography, { variant: 'body2', mb: 1 }, 'Save these one-time recovery codes:'),
          h(Paper, { variant: 'outlined', sx: { p: 1.5, mb: 3, maxHeight: 120, overflow: 'auto', bgcolor: '#fffaf4' } },
            h('pre', { style: { margin: 0, fontSize: 12 } }, setupModal.data?.recovery_codes?.join('\n'))
          ),
          h(TextField, {
            label: 'Six-digit verification code',
            name: 'code',
            inputProps: { pattern: '[0-9]{6}', inputMode: 'numeric' },
            required: true,
            fullWidth: true,
            size: 'small'
          })
        ),
        h(DialogActions, { sx: { p: 2.5 } },
          h(Button, { onClick: () => setSetupModal({ open: false, data: null }) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Enable MFA')
        )
      )
    ),

    // Disable MFA Modal
    disableModal && h(Dialog, { open: true, onClose: () => setDisableModal(false), maxWidth: 'xs', fullWidth: true },
      h('form', { onSubmit: handleDisableMfa },
        h(DialogTitle, null, 'Disable MFA'),
        h(DialogContent, null,
          h(Stack, { spacing: 2, mt: 1 },
            h(TextField, { label: 'Password', name: 'password', type: 'password', required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'Authenticator or recovery code', name: 'code', required: true, size: 'small', fullWidth: true })
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setDisableModal(false) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'error' }, 'Disable MFA')
        )
      )
    )
  );
}

// Mount React Root
function init() {
  const rootElement = document.getElementById('root') || document.getElementById('app');
  if (rootElement && window.ReactDOM) {
    if (window.ReactDOM.createRoot) {
      window.ReactDOM.createRoot(rootElement).render(h(App, null));
    } else {
      window.ReactDOM.render(h(App, null), rootElement);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

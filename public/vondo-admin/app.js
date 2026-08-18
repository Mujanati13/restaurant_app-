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
  { key: 'restaurant', label: 'Restaurant settings', icon: 'settings' },
  { key: 'brand', label: 'Brand & storefront', icon: 'palette' },
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

// Main React App Component
function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('vondo_admin_mode') || 'owner');
  const tokenKey = useCallback((m = mode) => `vondo:${window.location.host}:${m}:admin_token`, [mode]);
  const refreshKey = useCallback((m = mode) => `vondo:${window.location.host}:${m}:admin_refresh_token`, [mode]);

  const [token, setToken] = useState(() => localStorage.getItem(tokenKey()));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(refreshKey()));
  const [restaurantHint, setRestaurantHint] = useState(() => new URLSearchParams(window.location.search).get('restaurant'));

  const [currentView, setCurrentView] = useState(() => (
    mode === 'owner' ? 'dashboard' : mode === 'vendor' ? 'vendor-dashboard' : 'overview'
  ));
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

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
    setCurrentView(newMode === 'owner' ? 'dashboard' : newMode === 'vendor' ? 'vendor-dashboard' : 'overview');
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
              refreshView: () => loadView(currentView),
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
      const onboarding = ownerBootstrap?.onboarding || { checks: [] };
      const completed = onboarding.checks.filter(c => c.complete).length;
      const progressPercent = onboarding.checks.length ? Math.round((completed / onboarding.checks.length) * 100) : 0;

      return h(Box, null,
        h(Box, { sx: { mb: 3 } },
          h(Typography, { variant: 'h4' }, 'Good service starts here'),
          h(Typography, { variant: 'subtitle1' }, `Live operations for ${restaurant?.name || 'your restaurant'}.`)
        ),
        // Metrics Grid
        h(Grid, { container: true, spacing: 2.5, sx: { mb: 3.5 } },
          h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 }, h(MetricCard, { label: 'Sales today', value: money(data?.sales_today, restaurant?.currency_code), icon: 'payments' })),
          h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 }, h(MetricCard, { label: 'Orders today', value: data?.orders_today ?? 0, icon: 'receipt' })),
          h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 }, h(MetricCard, { label: 'Waiting orders', value: data?.orders_waiting ?? 0, icon: 'schedule', color: 'warning.main' })),
          h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 }, h(MetricCard, { label: 'Reservations', value: data?.reservations_today ?? 0, icon: 'event_seat' })),
          h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 }, h(MetricCard, { label: 'Customers', value: data?.customers ?? 0, icon: 'group' })),
          h(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2 }, h(MetricCard, { label: 'Menu items', value: data?.menu_items ?? 0, icon: 'restaurant_menu' }))
        ),
        // Onboarding and Quick Actions
        h(Grid, { container: true, spacing: 3 },
          h(Grid, { item: true, xs: 12, md: 8 },
            h(Card, null,
              h(CardHeader, {
                title: 'Getting ready',
                subheader: `${completed} of ${onboarding.checks.length} setup tasks complete`,
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
          ),
          h(Grid, { item: true, xs: 12, md: 4 },
            h(Card, null,
              h(CardHeader, { title: 'Quick actions' }),
              h(CardContent, null,
                h(Stack, { spacing: 1.5 },
                  h(Button, { variant: 'contained', color: 'primary', fullWidth: true, onClick: () => setCurrentView('orders') }, 'Manage orders'),
                  h(Button, { variant: 'outlined', color: 'secondary', fullWidth: true, onClick: () => setCurrentView('brand') }, 'Edit storefront'),
                  h(Button, { variant: 'outlined', color: 'secondary', fullWidth: true, onClick: () => setCurrentView('team') }, 'Add team member')
                )
              )
            )
          )
        )
      );
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
      return h(CustomersView, { data, request, notify, refreshView });
    }

    if (currentView === 'locations') {
      return h(LocationsView, { data, request, notify, refreshView });
    }

    if (currentView === 'team') {
      return h(TeamView, { data, ownerBootstrap, request, notify, refreshView });
    }

    if (currentView === 'restaurant') {
      return h(RestaurantSettingsView, { restaurant, request, notify, bootstrapSession });
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
  const [page, setPage] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const orders = data?.data || [];
  const meta = data?.meta || { total: orders.length };
  const statuses = vendorBootstrap?.order_statuses || [];

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await request(`/api/v1/vendor/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status_id: Number(newStatus), location_id: vendorLocationId, notify: true }
      });
      notify('Order status updated.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Live Orders'),
      h(Typography, { variant: 'subtitle1' }, 'Kitchen & counter order flow with live status updates and items breakdown.')
    ),
    // Filter
    h(Card, { sx: { mb: 3 } },
      h(CardContent, { sx: { p: 2, '&:last-child': { pb: 2 } } },
        h(Grid, { container: true, spacing: 2, alignItems: 'center' },
          h(Grid, { item: true, xs: 12, sm: 4 },
            h(FormControl, { size: 'small', fullWidth: true },
              h(InputLabel, null, 'Filter by Status'),
              h(Select, { value: statusId, label: 'Filter by Status', onChange: (e) => setStatusId(e.target.value) },
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
    // Orders Table
    h(Card, null,
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Order #'),
              h(TableCell, null, 'Customer'),
              h(TableCell, null, 'Type'),
              h(TableCell, null, 'Schedule'),
              h(TableCell, null, 'Total'),
              h(TableCell, null, 'Status'),
              h(TableCell, { align: 'right' }, 'Action')
            )
          ),
          h(TableBody, null,
            orders.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 7, align: 'center', sx: { py: 4 } }, 'No orders in this view.'))
              : orders.map(order =>
                  h(TableRow, { key: order.id },
                    h(TableCell, null, h(Typography, { variant: 'body2', fontWeight: 700 }, order.number)),
                    h(TableCell, null,
                      h(Typography, { variant: 'body2', fontWeight: 600 }, order.customer_name),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, order.customer_phone || '—')
                    ),
                    h(TableCell, null, h(Chip, { label: order.type || 'Standard', size: 'small' })),
                    h(TableCell, null, date(order.scheduled_for)),
                    h(TableCell, null, h(Typography, { variant: 'body2', fontWeight: 700 }, money(order.total))),
                    h(TableCell, null,
                      h(FormControl, { size: 'small', sx: { minWidth: 140 } },
                        h(Select, { value: order.status_id, onChange: (e) => handleUpdateStatus(order.id, e.target.value) },
                          statuses.map(s => h(MenuItem, { key: s.id, value: s.id }, s.name))
                        )
                      )
                    ),
                    h(TableCell, { align: 'right' },
                      h(Button, { size: 'small', variant: 'outlined', onClick: () => setSelectedOrder(order) }, 'View items')
                    )
                  )
                )
          )
        )
      ),
      h(TablePagination, {
        component: 'div',
        count: meta.total || orders.length,
        page: page,
        rowsPerPage: 30,
        rowsPerPageOptions: [30],
        onPageChange: (_, newPage) => setPage(newPage)
      })
    ),

    // Order Items Inspection Modal
    selectedOrder && h(Dialog, { open: true, onClose: () => setSelectedOrder(null), maxWidth: 'sm', fullWidth: true },
      h(DialogTitle, null, `Order ${selectedOrder.number} Breakdown`),
      h(DialogContent, null,
        h(Typography, { variant: 'subtitle2', mb: 1 }, `Customer: ${selectedOrder.customer_name}`),
        selectedOrder.comment && h(Alert, { severity: 'info', sx: { mb: 2 } }, `Note: ${selectedOrder.comment}`),
        h(List, null,
          (selectedOrder.items || []).map((item, idx) =>
            h(ListItem, { key: idx, divider: true },
              h(ListItemText, {
                primary: item.name,
                secondary: `Qty: ${item.quantity}`
              })
            )
          )
        ),
        h(Box, { sx: { display: 'flex', justifyContent: 'space-between', mt: 2 } },
          h(Typography, { variant: 'subtitle1', fontWeight: 700 }, 'Total Amount:'),
          h(Typography, { variant: 'subtitle1', fontWeight: 700, color: 'primary.main' }, money(selectedOrder.total))
        )
      ),
      h(DialogActions, null,
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

function OrdersView({ data, ownerBootstrap, restaurant, request, notify, refreshView }) {
  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [page, setPage] = useState(0);

  const orders = data?.data || [];
  const meta = data?.meta || { total: orders.length, per_page: 25 };
  const statuses = ownerBootstrap?.order_statuses || [];
  const locations = ownerBootstrap?.locations || [];

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await request(`/api/v1/owner/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status_id: Number(newStatus), notify: true }
      });
      notify('Order status updated.', 'success');
      refreshView();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Orders'),
      h(Typography, { variant: 'subtitle1' }, 'Search and update orders across every restaurant location.')
    ),
    // Filter Bar
    h(Card, { sx: { mb: 3 } },
      h(CardContent, { sx: { p: 2, '&:last-child': { pb: 2 } } },
        h(Grid, { container: true, spacing: 2, alignItems: 'center' },
          h(Grid, { item: true, xs: 12, sm: 4 },
            h(TextField, {
              placeholder: 'Search order, customer or email',
              value: search,
              onChange: (e) => setSearch(e.target.value),
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
            h(Button, {
              variant: 'contained',
              color: 'primary',
              fullWidth: true,
              onClick: () => refreshView()
            }, 'Apply')
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
              h(TableCell, null, 'Order'),
              h(TableCell, null, 'Customer'),
              h(TableCell, null, 'Location'),
              h(TableCell, null, 'Schedule'),
              h(TableCell, null, 'Total'),
              h(TableCell, null, 'Status')
            )
          ),
          h(TableBody, null,
            orders.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 6, align: 'center', sx: { py: 4 } }, 'No orders match these filters.'))
              : orders.map(order =>
                  h(TableRow, { key: order.id },
                    h(TableCell, null,
                      h(Typography, { variant: 'body2', fontWeight: 700 }, order.number),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, `${order.type || ''} • ${order.items_count || 0} items`)
                    ),
                    h(TableCell, null,
                      h(Typography, { variant: 'body2', fontWeight: 600 }, order.customer_name),
                      h(Typography, { variant: 'caption', color: 'text.secondary' }, order.customer_phone || '—')
                    ),
                    h(TableCell, null, order.location_name || '—'),
                    h(TableCell, null, date(order.scheduled_for)),
                    h(TableCell, null, h(Typography, { variant: 'body2', fontWeight: 700 }, money(order.total, restaurant?.currency_code))),
                    h(TableCell, null,
                      h(FormControl, { size: 'small', sx: { minWidth: 140 } },
                        h(Select, {
                          value: order.status_id,
                          onChange: (e) => handleStatusChange(order.id, e.target.value)
                        },
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
        count: meta.total || orders.length,
        page: page,
        rowsPerPage: 25,
        rowsPerPageOptions: [25],
        onPageChange: (_, newPage) => setPage(newPage)
      })
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

function CustomersView({ data }) {
  const [search, setSearch] = useState('');
  const customers = data?.data || [];
  const meta = data?.meta || { total: customers.length };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Customers'),
      h(Typography, { variant: 'subtitle1' }, 'Tenant-scoped customer directory.')
    ),
    h(Card, { sx: { mb: 3 } },
      h(CardContent, { sx: { p: 2, '&:last-child': { pb: 2 } } },
        h(TextField, {
          placeholder: 'Search customer name or email',
          value: search,
          onChange: (e) => setSearch(e.target.value),
          size: 'small',
          sx: { maxWidth: 360 }
        })
      )
    ),
    h(Card, null,
      h(TableContainer, null,
        h(Table, null,
          h(TableHead, null,
            h(TableRow, null,
              h(TableCell, null, 'Customer'),
              h(TableCell, null, 'Email'),
              h(TableCell, null, 'Telephone'),
              h(TableCell, null, 'Status'),
              h(TableCell, null, 'Joined')
            )
          ),
          h(TableBody, null,
            customers.length === 0
              ? h(TableRow, null, h(TableCell, { colSpan: 5, align: 'center', sx: { py: 4 } }, 'No customers found.'))
              : customers.map(c =>
                  h(TableRow, { key: c.id },
                    h(TableCell, null, h(Typography, { variant: 'body2', fontWeight: 700 }, c.name)),
                    h(TableCell, null, c.email),
                    h(TableCell, null, c.telephone || '—'),
                    h(TableCell, null,
                      h(Chip, { label: c.status ? 'Active' : 'Disabled', size: 'small', color: c.status ? 'success' : 'default' })
                    ),
                    h(TableCell, null, date(c.created_at))
                  )
                )
          )
        )
      )
    )
  );
}

function LocationsView({ data, request, notify, refreshView }) {
  const locations = data || [];
  const [editModal, setEditModal] = useState({ open: false, location: null });
  const [servicesModal, setServicesModal] = useState({ open: false, location: null, settings: null });

  const handleOpenServices = async (loc) => {
    try {
      const res = await request(`/api/v1/owner/locations/${loc.id}/settings`);
      setServicesModal({ open: true, location: loc, settings: res.data });
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Locations'),
      h(Typography, { variant: 'subtitle1' }, 'Manage branches inside this restaurant tenant.')
    ),
    h(Grid, { container: true, spacing: 3 },
      // Locations List
      h(Grid, { item: true, xs: 12, md: 8 },
        h(Card, null,
          h(CardHeader, { title: 'Restaurant locations', subheader: `${locations.length} configured locations` }),
          h(CardContent, null,
            h(Stack, { spacing: 2 },
              locations.map(loc =>
                h(Paper, { key: loc.id, variant: 'outlined', sx: { p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 } },
                  h(Box, null,
                    h(Typography, { variant: 'subtitle1', fontWeight: 700 }, loc.name),
                    h(Typography, { variant: 'body2', color: 'text.secondary' }, [loc.address, loc.city, loc.postcode].filter(Boolean).join(', ') || 'Address not set'),
                    h(Typography, { variant: 'caption', color: 'text.secondary' }, `${loc.email} • ${loc.telephone || 'No phone'}`)
                  ),
                  h(Stack, { direction: 'row', spacing: 1, alignItems: 'center' },
                    loc.is_default && h(Chip, { label: 'Default', size: 'small' }),
                    h(Chip, { label: loc.is_active ? 'Active' : 'Disabled', size: 'small', color: loc.is_active ? 'success' : 'default' }),
                    h(Button, { size: 'small', variant: 'outlined', onClick: () => setEditModal({ open: true, location: loc }) }, 'Edit')
                  )
                )
              )
            )
          )
        )
      ),
      // Add Location Form
      h(Grid, { item: true, xs: 12, md: 4 },
        h(Card, null,
          h(CardHeader, { title: 'Add location' }),
          h(CardContent, null,
            h('form', {
              onSubmit: async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const body = Object.fromEntries(new FormData(form));
                body.location_status = form.location_status.checked;
                try {
                  await request('/api/v1/owner/locations', { method: 'POST', body });
                  notify('Location created.', 'success');
                  form.reset();
                  refreshView();
                } catch (err) {
                  notify(err.message, 'error');
                }
              }
            },
              h(Stack, { spacing: 2 },
                h(TextField, { label: 'Name', name: 'location_name', required: true, size: 'small', fullWidth: true }),
                h(TextField, { label: 'Email', name: 'location_email', type: 'email', required: true, size: 'small', fullWidth: true }),
                h(TextField, { label: 'Telephone', name: 'location_telephone', size: 'small', fullWidth: true }),
                h(TextField, { label: 'Address', name: 'location_address_1', size: 'small', fullWidth: true }),
                h(TextField, { label: 'City', name: 'location_city', size: 'small', fullWidth: true }),
                h(TextField, { label: 'Postcode', name: 'location_postcode', size: 'small', fullWidth: true }),
                h(FormControlLabel, { control: h(Checkbox, { name: 'location_status', defaultChecked: true }), label: 'Active location' }),
                h(Button, { type: 'submit', variant: 'contained', color: 'primary', fullWidth: true }, 'Add location')
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
            notify('Location updated.', 'success');
            setEditModal({ open: false, location: null });
            refreshView();
          } catch (err) {
            notify(err.message, 'error');
          }
        }
      },
        h(DialogTitle, null, 'Edit Location'),
        h(DialogContent, null,
          h(Stack, { spacing: 2, mt: 1 },
            h(TextField, { label: 'Name', name: 'location_name', defaultValue: editModal.location?.name || '', required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'Email', name: 'location_email', type: 'email', defaultValue: editModal.location?.email || '', required: true, size: 'small', fullWidth: true }),
            h(TextField, { label: 'Telephone', name: 'location_telephone', defaultValue: editModal.location?.telephone || '', size: 'small', fullWidth: true }),
            h(TextField, { label: 'Address', name: 'location_address_1', defaultValue: editModal.location?.address || '', size: 'small', fullWidth: true }),
            h(TextField, { label: 'City', name: 'location_city', defaultValue: editModal.location?.city || '', size: 'small', fullWidth: true }),
            h(TextField, { label: 'Postcode', name: 'location_postcode', defaultValue: editModal.location?.postcode || '', size: 'small', fullWidth: true }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'location_status', defaultChecked: !!editModal.location?.is_active }), label: 'Active location' }),
            h(Button, {
              variant: 'outlined',
              color: 'secondary',
              onClick: () => {
                const loc = editModal.location;
                setEditModal({ open: false, location: null });
                handleOpenServices(loc);
              }
            }, 'Configure services')
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setEditModal({ open: false, location: null }) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Save location')
        )
      )
    ),

    // Location Services Dialog
    servicesModal.open && h(Dialog, { open: true, onClose: () => setServicesModal({ open: false, location: null, settings: null }), maxWidth: 'xs', fullWidth: true },
      h('form', {
        onSubmit: async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const body = {
            orders_enabled: form.orders_enabled.checked,
            collection_enabled: form.collection_enabled.checked,
            delivery_enabled: form.delivery_enabled.checked,
            reservations_enabled: form.reservations_enabled.checked,
          };
          try {
            await request(`/api/v1/owner/locations/${servicesModal.location.id}/settings`, { method: 'PUT', body });
            notify('Location services saved.', 'success');
            setServicesModal({ open: false, location: null, settings: null });
          } catch (err) {
            notify(err.message, 'error');
          }
        }
      },
        h(DialogTitle, null, `${servicesModal.location?.name} Services`),
        h(DialogContent, null,
          h(Typography, { variant: 'body2', color: 'text.secondary', mb: 2 }, 'Override service defaults for this specific location.'),
          h(FormGroup, null,
            h(FormControlLabel, { control: h(Checkbox, { name: 'orders_enabled', defaultChecked: servicesModal.settings?.orders_enabled !== false }), label: 'Online ordering' }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'collection_enabled', defaultChecked: servicesModal.settings?.collection_enabled !== false }), label: 'Collection / Pickup' }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'delivery_enabled', defaultChecked: servicesModal.settings?.delivery_enabled !== false }), label: 'Delivery' }),
            h(FormControlLabel, { control: h(Checkbox, { name: 'reservations_enabled', defaultChecked: servicesModal.settings?.reservations_enabled !== false }), label: 'Table Reservations' })
          )
        ),
        h(DialogActions, null,
          h(Button, { onClick: () => setServicesModal({ open: false, location: null, settings: null }) }, 'Cancel'),
          h(Button, { type: 'submit', variant: 'contained', color: 'primary' }, 'Save services')
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
    )
  );
}

function RestaurantSettingsView({ restaurant, request, notify, bootstrapSession }) {
  return h(Box, null,
    h(Box, { sx: { mb: 3 } },
      h(Typography, { variant: 'h4' }, 'Restaurant settings'),
      h(Typography, { variant: 'subtitle1' }, 'Core identity and regional configuration.')
    ),
    h(Grid, { container: true, spacing: 3 },
      h(Grid, { item: true, xs: 12, md: 8 },
        h(Card, null,
          h(CardHeader, { title: 'Restaurant profile' }),
          h(CardContent, null,
            h('form', {
              onSubmit: async (e) => {
                e.preventDefault();
                const body = Object.fromEntries(new FormData(e.currentTarget));
                try {
                  await request('/api/v1/owner/restaurant', { method: 'PATCH', body });
                  notify('Restaurant settings saved.', 'success');
                  bootstrapSession();
                } catch (err) {
                  notify(err.message, 'error');
                }
              }
            },
              h(Stack, { spacing: 2.5 },
                h(TextField, { label: 'Name', name: 'name', defaultValue: restaurant?.name || '', required: true, fullWidth: true, size: 'small' }),
                h(TextField, { label: 'Timezone', name: 'timezone', defaultValue: restaurant?.timezone || '', required: true, fullWidth: true, size: 'small' }),
                h(TextField, { label: 'Currency Code', name: 'currency_code', defaultValue: restaurant?.currency_code || '', required: true, fullWidth: true, size: 'small', inputProps: { minLength: 3, maxLength: 3 } }),
                h(Button, { type: 'submit', variant: 'contained', color: 'primary', sx: { alignSelf: 'flex-start' } }, 'Save settings')
              )
            )
          )
        )
      ),
      h(Grid, { item: true, xs: 12, md: 4 },
        h(Card, null,
          h(CardHeader, { title: 'Account details' }),
          h(CardContent, null,
            h(Stack, { spacing: 2 },
              h(Box, { sx: { display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #eadfd4' } },
                h(Typography, { color: 'text.secondary' }, 'Status'),
                h(Chip, { label: restaurant?.status || 'active', size: 'small', color: 'success' })
              ),
              h(Box, { sx: { display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #eadfd4' } },
                h(Typography, { color: 'text.secondary' }, 'Store code'),
                h(Typography, { fontWeight: 700 }, restaurant?.slug || '—')
              ),
              h(Box, { sx: { display: 'flex', justifyContent: 'space-between' } },
                h(Typography, { color: 'text.secondary' }, 'Team members'),
                h(Typography, { fontWeight: 700 }, restaurant?.members?.length || 1)
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

  return h(Box, null,
    h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 } },
      h(Box, null,
        h(Typography, { variant: 'h4' }, 'Brand & storefront'),
        h(Typography, { variant: 'subtitle1' }, 'Control the shared appearance of web and mobile experiences.')
      ),
      h(Button, { variant: 'outlined', color: 'secondary', href: '/', target: '_blank', rel: 'noopener' }, 'Open storefront')
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
            builds.length === 0
              ? h(Typography, { color: 'text.secondary', textAlign: 'center', py: 3 }, 'No app build requests yet.')
              : h(Stack, { spacing: 2 },
                  builds.map(b =>
                    h(Paper, { key: b.id, variant: 'outlined', sx: { p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 } },
                      h(Box, null,
                        h(Typography, { variant: 'subtitle1', fontWeight: 700 }, `${b.configuration?.app_name || 'App'} • ${b.platform}`),
                        h(Typography, { variant: 'body2', color: 'text.secondary' }, `${b.configuration?.bundle_id} • ${b.status} • ${b.attempts} attempts`),
                        b.failure_message && h(Typography, { variant: 'caption', color: 'error.main' }, b.failure_message)
                      ),
                      h(Stack, { direction: 'row', spacing: 1 },
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

  return h(Box, null,
    h(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 } },
      h(Stack, { direction: 'row', spacing: 1.5, alignItems: 'center' },
        h(Button, { variant: 'outlined', onClick: () => setCurrentView('restaurants') }, '← All restaurants'),
        h(Typography, { variant: 'h5', fontWeight: 700 }, r.name)
      ),
      h(Button, { variant: 'contained', color: 'primary', onClick: () => setSupportModal(true) }, 'Open audited support session')
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
              plans.map(p =>
                h(Paper, { key: p.id, variant: 'outlined', sx: { p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                  h(Box, null,
                    h(Typography, { variant: 'subtitle1', fontWeight: 700 }, p.name),
                    h(Typography, { variant: 'body2', color: 'text.secondary' }, `${p.code} • ${money(p.price_minor / 100, p.currency_code)}/month • ${p.features?.length || 0} features`)
                  ),
                  h(Chip, { label: p.active ? 'Active' : 'Hidden', size: 'small', color: p.active ? 'success' : 'default' })
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
    )
  );
}

function PlatformTemplatesView({ templates, request, notify, refreshView }) {
  const [editModal, setEditModal] = useState({ open: false, template: null });

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
              templates.map(t =>
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

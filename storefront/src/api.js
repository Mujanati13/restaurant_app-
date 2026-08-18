/**
 * TastyIgniter API Client
 * Wraps REST calls to /api/* with token handling and JSON:API response normalization.
 */
function _uuid() { return (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }); }

const API_BASE = '/api';

function createIncludedIndex(response) {
  return new Map((response.included || []).map(resource => [`${resource.type}:${resource.id}`, resource]));
}

function relation(response, resource, name, index = createIncludedIndex(response)) {
  const linkage = resource?.relationships?.[name]?.data;
  if (!linkage) return Array.isArray(linkage) ? [] : null;
  const resolve = item => index.get(`${item.type}:${item.id}`) || item;
  return Array.isArray(linkage) ? linkage.map(resolve) : resolve(linkage);
}

function relationAttributes(response, resource, name, index) {
  const related = relation(response, resource, name, index);
  if (Array.isArray(related)) return related.map(item => item.attributes || item);
  return related?.attributes || related || null;
}

function menuOptions(response, resource, index) {
  return (relation(response, resource, 'menu_options', index) || []).map(option => {
    const attrs = option.attributes || option;
    const values = relation(response, option, 'menu_option_values', index) || [];
    return {
      name: attrs.option_name || attrs.name || 'Option',
      values: values.map(value => {
        const optionValue = value.attributes || value;
        return {
          name: optionValue.name || optionValue.option_value?.name || 'Option',
          price: Number(optionValue.override_price ?? optionValue.price ?? 0),
        };
      }),
    };
  });
}

class ApiClient {
  constructor() {
    this.tenantId = null;
    this.token = null;
    this.refreshToken = null;
    this.refreshPromise = null;
    this.storefrontConfig = null;
  }

  setTenant(tenantId) {
    this.tenantId = tenantId;
    this.token = localStorage.getItem(this.storageKey('auth_token')) || null;
    this.refreshToken = localStorage.getItem(this.storageKey('refresh_token')) || null;
  }

  isAuthenticated() { return Boolean(this.token); }

  storageKey(suffix) {
    return `vondo:${this.tenantId || 'bootstrap'}:${suffix}`;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem(this.storageKey('auth_token'), token);
    } else {
      localStorage.removeItem(this.storageKey('auth_token'));
    }
  }

  setSession(session = {}) {
    this.setToken(session.token || null);
    this.refreshToken = session.refresh_token || null;
    if (this.refreshToken) localStorage.setItem(this.storageKey('refresh_token'), this.refreshToken);
    else localStorage.removeItem(this.storageKey('refresh_token'));
  }

  async logout() {
    try {
      if (this.token) await this.request('/storefront/token', { method: 'DELETE' });
    } finally {
      this.setSession();
    }
  }

  getHeaders() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.tenantId) headers['X-Vondo-Restaurant'] = this.tenantId;
    return headers;
  }

  async request(endpoint, options = {}, retried = false) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        if (response.status === 401 && !retried && this.refreshToken && !endpoint.endsWith('/refresh')) {
          await this.refreshSession();
          return this.request(endpoint, options, true);
        }
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        const validationMessage = errorData.errors
          ? Object.values(errorData.errors).flat().join(' ')
          : null;
        const error = new Error(validationMessage || errorData.message || `API request failed with status ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return await response.json();
    } catch (err) {
      console.error(`[API Client] ${endpoint} failed: ${err.message}`);
      throw err;
    }
  }

  async refreshSession() {
    if (!this.refreshPromise) {
      this.refreshPromise = fetch(`${API_BASE}/v1/storefront/refresh`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      }).then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Your session has expired.');
        this.setSession(data);
        return data;
      }).catch(error => {
        this.setSession();
        throw error;
      }).finally(() => { this.refreshPromise = null; });
    }
    return this.refreshPromise;
  }

  // --- API Endpoints ---

  /** Fetch all categories */
  async getCategories() {
    const res = await this.request('/v1/storefront/categories?limit=100');
    return (res.data || []).map(item => ({
        id: item.id || item.attributes?.category_id,
        name: item.attributes?.name || item.name || 'Category',
        description: item.attributes?.description || '',
        slug: item.attributes?.permalink_slug || item.attributes?.slug || ''
      }));
  }

  /** Fetch menu items with included media and options */
  async getMenus(categoryId = null, searchQuery = '') {
    const params = new URLSearchParams();
    if (categoryId) params.set('category_id', categoryId);
    if (searchQuery) params.set('search', searchQuery);
    params.set('limit', '100');
    const res = await this.request(`/v1/storefront/menus?${params}`);
    let items = (res.data || []).map(item => {
        const attrs = item;
        let imageUrl = attrs.image || null;
        if (!imageUrl) {
          imageUrl = this.getFallbackImage(attrs.menu_name || attrs.name);
        }
        return {
          id: item.id || attrs.menu_id,
          name: attrs.menu_name || attrs.name || 'Delicious Dish',
          description: attrs.menu_description || attrs.description || 'Prepared fresh by our executive chef.',
          price: parseFloat(attrs.menu_price || attrs.price || 0),
          category_id: attrs.category_ids?.[0] || null,
          image: imageUrl,
          is_special: attrs.is_special || false,
          options: attrs.options || []
        };
    });

    if (categoryId) {
      items = items.filter(i => i.category_id == categoryId);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return items;
  }

  /** Fetch single menu item */
  async getMenu(id) {
    const res = await this.request(`/v1/storefront/menus/${id}`);
    if (res.data) {
      const attrs = res.data.attributes || res.data;
      return {
        id: res.data.id || attrs.menu_id,
        name: attrs.menu_name || attrs.name,
        description: attrs.menu_description || attrs.description,
        price: parseFloat(attrs.menu_price || attrs.price || 0),
        image: attrs.image || this.getFallbackImage(attrs.name),
        options: attrs.options || []
      };
    }
    return null;
  }

  /** Fetch locations with working hours and media */
  async getLocations() {
    const res = await this.request('/v1/storefront/locations');
    return (res.data || []).map(item => {
        const attrs = item;

        return {
          id: item.id,
          name: attrs.name || 'Restaurant location',
          address: attrs.address || '',
          phone: attrs.phone || '',
          email: attrs.email || '',
          workingHours: [],
          image: attrs.image || null
        };
    });
  }

  /** Fetch public storefront settings supplied by the backend. */
  async getStorefrontConfig() {
    if (!this.storefrontConfig) {
      const response = await this.request('/v1/storefront/bootstrap');
      this.storefrontConfig = {
        ...response.data,
        default_country_id: response.data.defaults?.country_id,
        default_order_status_id: response.data.defaults?.order_status_id,
        default_reservation_status_id: response.data.defaults?.reservation_status_id,
      };
    }
    return this.storefrontConfig;
  }

  /** Fetch only tables that can accommodate the requested reservation. */
  async getAvailableTables({ locationId, date, time, guestNum, duration = 90 }) {
    const params = new URLSearchParams({ location_id: locationId, date, time, guest_num: guestNum, duration });
    const res = await this.request(`/storefront/tables/availability?${params}`);
    return (res.data || []).map(table => ({
      id: table.id,
      name: table.name,
      minCapacity: Number(table.min_capacity),
      maxCapacity: Number(table.max_capacity),
    }));
  }

  /** Customer Login */
  async login(email, password) {
    try {
      const res = await this.request('/v1/storefront/token', {
        method: 'POST',
        body: JSON.stringify({ email, password, device_name: 'Storefront SPA', is_admin: false })
      });
      if (res.token) {
        this.setSession(res);
        return { success: true, token: res.token };
      }
      return { success: false, error: 'Unable to create a customer session.' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /** Customer Registration */
  async registerCustomer(customerData) {
    try {
      const res = await this.request('/v1/storefront/register', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });
      if (res.data) return this.login(customerData.email, customerData.password);
      return { success: false, error: 'Account could not be created.' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /** Get Current User Profile */
  async getUserProfile() {
    if (!this.token) return null;
    const res = await this.request('/v1/storefront/account');
    return res.data || null;
  }

  /** Update Customer Profile */
  async updateProfile(profileData) {
    try {
      const res = await this.request('/v1/storefront/account', {
        method: 'PATCH',
        body: JSON.stringify(profileData)
      });
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /** Fetch Customer Orders */
  async getOrders() {
    const res = await this.request('/v1/storefront/orders');
    if (res && res.data) {
      return res.data.map(item => {
        const attrs = item;
        return {
          id: attrs.id,
          order_type: attrs.type || 'delivery',
          order_time: attrs.created_at,
          status_name: attrs.status?.name || 'Received',
          status_color: attrs.status?.color || '#3b82f6',
          total: attrs.total || 0,
          menus: attrs.items || [],
          location: attrs.location || 'Restaurant',
          created_at: attrs.created_at
        };
      });
    }
    return [];
  }

  /** Fetch Single Order Details */
  async getOrder(id) {
    const res = await this.request(`/v1/storefront/orders/${id}`);
    if (res && res.data) {
      const attrs = res.data;
      return {
        id: attrs.id,
        order_type: attrs.type,
        status_name: attrs.status?.name || 'Received',
        status_color: attrs.status?.color || '#3b82f6',
        order_menus: attrs.items || [],
        total: attrs.total,
        location: attrs.location,
        created_at: attrs.created_at
      };
    }
    return null;
  }

  /** Fetch Customer Reservations */
  async getReservations() {
    const res = await this.request('/v1/storefront/reservations');
    if (res && res.data) {
      return res.data.map(item => {
        const attrs = item;
        return {
          id: attrs.id,
          guest_num: attrs.guests,
          reserve_date: attrs.date,
          reserve_time: attrs.time,
          status_name: attrs.status?.name || 'Confirmed',
          status_color: attrs.status?.color || '#10b981',
          location_name: attrs.location || 'Restaurant',
          comment: attrs.comment,
          created_at: attrs.created_at
        };
      });
    }
    return [];
  }

  /** Fetch Customer Saved Addresses */
  async getAddresses() {
    const res = await this.request('/v1/storefront/addresses');
    if (res && res.data) {
      return res.data.map(item => {
        return {
          id: item.id,
          address_1: item.address_1,
          address_2: item.address_2,
          city: item.city,
          state: item.state,
          postcode: item.postcode,
          country: item.country || ''
        };
      });
    }
    return [];
  }

  /** Add Customer Address */
  async createAddress(addressData) {
    try {
      const res = await this.request('/v1/storefront/addresses', {
        method: 'POST',
        body: JSON.stringify(addressData)
      });
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /** Place Order */
  async createOrder(orderData) {
    try {
      const res = await this.request('/v1/storefront/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': _uuid() },
        body: JSON.stringify(orderData)
      });
      if (res.data) return { success: true, orderId: res.data.id };
      return { success: false, error: 'The order could not be created.' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /** Place Reservation */
  async createReservation(reservationData) {
    try {
      const res = await this.request('/v1/storefront/reservations', {
        method: 'POST',
        headers: { 'Idempotency-Key': _uuid() },
        body: JSON.stringify(reservationData)
      });
      if (res.data) return { success: true, reservationId: res.data.id };
      return { success: false, error: 'The reservation could not be created.' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // --- Fallback Mock Data ---

  getMockCategories() {
    return [
      { id: 1, name: '🔥 Chef Specials', slug: 'specials' },
      { id: 2, name: '🍔 Artisan Burgers', slug: 'burgers' },
      { id: 3, name: '🍕 Woodfired Pizza', slug: 'pizza' },
      { id: 4, name: '🥗 Organic Bowls', slug: 'bowls' },
      { id: 5, name: '🍰 Handcrafted Desserts', slug: 'desserts' },
      { id: 6, name: '🍹 Signature Drinks', slug: 'drinks' }
    ];
  }

  getMockMenus(categoryId = null, searchQuery = '') {
    const mockItems = [
      {
        id: 101,
        name: 'Truffle Wagyu Gourmet Burger',
        description: 'Prime dry-aged Wagyu beef patty, black truffle aioli, caramelised shallots, aged Swiss gruyère on a brioche bun.',
        price: 24.99,
        category_id: 2,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        is_special: true,
        options: [
          { name: 'Doneness', values: [{ name: 'Medium Rare', price: 0 }, { name: 'Medium', price: 0 }] },
          { name: 'Add-ons', values: [{ name: 'Extra Truffle Sauce', price: 3.50 }, { name: 'Double Patty', price: 8.00 }] }
        ]
      },
      {
        id: 102,
        name: 'Neapolitan Burrata & Prosciutto Pizza',
        description: 'San Marzano tomato base, fresh creamy burrata, 24-month aged Prosciutto di Parma, wild rocket, and extra virgin olive oil drizzle.',
        price: 22.50,
        category_id: 3,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        is_special: true
      },
      {
        id: 103,
        name: 'Seared Wild Salmon Power Bowl',
        description: 'Pan-seared Atlantic salmon fillet, quinoa, avocado, edamame, roasted sweet potatoes, and citrus sesame dressing.',
        price: 19.95,
        category_id: 4,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 104,
        name: 'Smoked Prime Ribeye Steak (12oz)',
        description: 'Hickory-smoked USDA Prime Ribeye cooked to perfection, served with garlic herb butter and truffle parmesan fries.',
        price: 38.00,
        category_id: 1,
        image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
        is_special: true
      },
      {
        id: 105,
        name: 'Matcha Lava Cake with Vanilla Gelato',
        description: 'Warm Uji matcha green tea molten cake served with Madagascar vanilla bean gelato and toasted sesame brittle.',
        price: 12.50,
        category_id: 5,
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 106,
        name: 'Smoked Bourbon Old Fashioned',
        description: 'Small-batch Kentucky bourbon, aromatic bitters, orange peel, and applewood smoke infusion.',
        price: 14.00,
        category_id: 6,
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80'
      }
    ];

    let results = mockItems;
    if (categoryId) {
      results = results.filter(i => i.category_id == categoryId);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return results;
  }

  getFallbackImage(name = '') {
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';
  }
}

export const api = new ApiClient();

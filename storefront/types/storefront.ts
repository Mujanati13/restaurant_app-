export interface PaymentMethod {
  code: string
  name: string
  instructions?: string
  min_order?: number
  max_order?: number
  publishable_key?: string
  client_id?: string
  sandbox?: boolean
  test_mode?: boolean
  bank_name?: string
  account_number?: string
  routing_number?: string
}

export interface TenantBootstrap {
  restaurant: {
    id: string
    name: string
    slug: string
    status: string
    email?: string | null
    phone?: string | null
    address?: string | null
  }
  brand: {
    identity: { name: string; tagline?: string; logo_url?: string }
    theme: Record<string, string | number>
    content: Record<string, string | null>
    navigation: Array<{ label: string; href: string }>
    sections: Array<{ id: string; type: string; visible: boolean; position: number }>
  }
  currency: { code: string; symbol: string; symbol_position: boolean; decimal_position: number }
  settings: {
    tax_rate: number
    tax_id?: string | null
    guest_checkout_enabled: boolean
    tipping_enabled: boolean
    tip_presets: number[]
    cancellation_window_minutes: number
    social_links: {
      facebook?: string | null
      instagram?: string | null
      twitter?: string | null
      tiktok?: string | null
      google_maps?: string | null
    }
  }
  payment_methods: PaymentMethod[]
  capabilities: Record<string, boolean>
  defaults: {
    country_id: number
    order_status_id: number
    reservation_status_id: number
  }
  pages: Array<{ slug: string; title: string; is_home: boolean }>
  deep_links: { base_url: string; routes: Record<string, string>; custom_scheme: string }
}

export interface MenuItem { id: number; name: string; description?: string; price: number; image?: string; category_ids?: number[]; is_special?: boolean }
export interface Category { id: number; name: string; description?: string; slug?: string }
export interface Location {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
  image?: string
  is_default?: boolean
  offer_delivery?: boolean
  offer_collection?: boolean
  min_delivery_order?: number
  delivery_charge?: number
  delivery_radius_km?: number
  prep_time_minutes?: number
  delivery_lead_time_minutes?: number
}


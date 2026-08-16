export interface TenantBootstrap {
  restaurant: { id: string; name: string; slug: string; status: string }
  brand: {
    identity: { name: string; tagline?: string; logo_url?: string }
    theme: Record<string, string | number>
    content: Record<string, string | null>
    navigation: Array<{ label: string; href: string }>
    sections: Array<{ id: string; type: string; visible: boolean; position: number }>
  }
  currency: { code: string; symbol: string; symbol_position: boolean; decimal_position: number }
  capabilities: Record<string, boolean>
  pages: Array<{ slug: string; title: string; is_home: boolean }>
  deep_links: { base_url: string; routes: Record<string, string>; custom_scheme: string }
}

export interface MenuItem { id: number; name: string; description?: string; price: number; image?: string; category_ids?: number[]; is_special?: boolean }
export interface Category { id: number; name: string; description?: string; slug?: string }
export interface Location { id: number; name: string; address?: string; phone?: string; email?: string; image?: string }

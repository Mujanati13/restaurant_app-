import type { MenuItem } from '~/types/storefront'

export interface CartLine extends MenuItem { quantity: number; selected_options?: Array<{ option_id: number; values: Array<{ value_id: number; quantity?: number }> }> }

export function useTenantCart() {
  const bootstrap = useNuxtData<any>('tenant-bootstrap')
  const tenant = computed(() => bootstrap.data.value?.data.restaurant.id || 'bootstrap')
  const lines = useState<CartLine[]>('tenant-cart-lines', () => [])
  const loadedTenant = useState<string | null>('tenant-cart-loaded', () => null)
  const storageKey = computed(() => `vondo:${tenant.value}:cart_items`)
  const hydrate = () => {
    if (!import.meta.client || loadedTenant.value === tenant.value) return
    try { lines.value = JSON.parse(localStorage.getItem(storageKey.value) || '[]') } catch { lines.value = [] }
    loadedTenant.value = tenant.value
  }
  const persist = () => { if (import.meta.client) localStorage.setItem(storageKey.value, JSON.stringify(lines.value)) }
  const add = (item: MenuItem, selectedOptions: CartLine['selected_options'] = []) => { hydrate(); const signature = JSON.stringify(selectedOptions); const existing = lines.value.find(line => line.id === item.id && JSON.stringify(line.selected_options || []) === signature); if (existing) existing.quantity += 1; else lines.value.push({ ...item, quantity: 1, selected_options: selectedOptions }); persist() }
  const remove = (id: number) => { lines.value = lines.value.filter(line => line.id !== id); persist() }
  const clear = () => { lines.value = []; persist() }
  hydrate()
  return { lines, add, remove, clear, count: computed(() => lines.value.reduce((n, line) => n + line.quantity, 0)),
    subtotal: computed(() => lines.value.reduce((n, line) => n + line.price * line.quantity, 0)) }
}

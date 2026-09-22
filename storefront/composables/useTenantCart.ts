import type { MenuItem } from '~/types/storefront'
import { generateUUID } from '~/utils/uuid'

export interface CartOption { option_id: number; values: Array<{ value_id: number; quantity?: number; price?: number; name?: string }> }
export interface CartLine extends MenuItem { line_id: string; quantity: number; note?: string; selected_options: CartOption[] }

export function optionTotal(line: Pick<CartLine, 'selected_options'>): number {
  return line.selected_options.reduce((total, option) => total + option.values.reduce((optionTotal, value) => optionTotal + Number(value.price || 0) * Number(value.quantity || 1), 0), 0)
}

export function useTenantCart() {
  const bootstrap = useActiveTenant()
  const tenant = computed(() => bootstrap.value?.restaurant.id || 'bootstrap')
  const lines = useState<CartLine[]>('tenant-cart-lines', () => [])
  const loadedTenant = useState<string | null>('tenant-cart-loaded', () => null)
  const storageKey = computed(() => `vondo:${tenant.value}:cart_items`)
  const hydrate = () => {
    if (!import.meta.client || loadedTenant.value === tenant.value) return
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey.value) || '[]')
      lines.value = Array.isArray(stored) ? stored.map((line: Partial<CartLine>) => ({
        ...line, line_id: line.line_id || generateUUID(), quantity: Number(line.quantity || 1), selected_options: line.selected_options || [],
      })) as CartLine[] : []
      persist()
    } catch { lines.value = [] }
    loadedTenant.value = tenant.value
  }
  const persist = () => { if (import.meta.client) localStorage.setItem(storageKey.value, JSON.stringify(lines.value)) }
  const add = (item: MenuItem, selectedOptions: CartOption[] = [], note = '') => { hydrate(); const signature = JSON.stringify(selectedOptions); const existing = lines.value.find(line => line.id === item.id && line.note === note && JSON.stringify(line.selected_options || []) === signature); if (existing) existing.quantity += 1; else lines.value.push({ ...item, line_id: generateUUID(), quantity: 1, note, selected_options: selectedOptions }); persist() }
  const remove = (lineId: string) => { lines.value = lines.value.filter(line => line.line_id !== lineId); persist() }
  const setQuantity = (lineId: string, quantity: number) => { const line = lines.value.find(item => item.line_id === lineId); if (!line) return; if (quantity < 1) remove(lineId); else { line.quantity = Math.min(50, quantity); persist() } }
  const clear = () => { lines.value = []; persist() }
  hydrate()
  return { lines, add, remove, setQuantity, clear, count: computed(() => lines.value.reduce((n, line) => n + line.quantity, 0)),
    subtotal: computed(() => lines.value.reduce((n, line) => n + (line.price + optionTotal(line)) * line.quantity, 0)) }
}

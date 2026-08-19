import type { TenantBootstrap } from '~/types/storefront'

export function useTenant() {
  const route = useRoute()
  const restaurantCookie = useCookie<string | null>('vondo-restaurant')

  const activeSlug = computed(() => {
    return (route.query.restaurant as string) || restaurantCookie.value || null
  })

  // Sync cookie on client
  if (import.meta.client && route.query.restaurant) {
    restaurantCookie.value = route.query.restaurant as string
  }

  const requestHeaders = import.meta.server
    ? useRequestHeaders(['host', 'x-forwarded-host', 'x-forwarded-proto', 'cookie'])
    : undefined

  const queryParams = computed(() => {
    return activeSlug.value ? { restaurant: activeSlug.value } : {}
  })

  const fetchResult = useFetch<{ data: TenantBootstrap }>('/api/v1/storefront/bootstrap', {
    key: `tenant-bootstrap-${activeSlug.value || 'default'}`,
    query: queryParams,
    headers: requestHeaders,
    retry: 1,
    timeout: 8000,
    transform: response => response,
  })

  const activeState = useState<TenantBootstrap | null>('active-tenant-bootstrap', () => null)
  if (fetchResult.data.value?.data) {
    activeState.value = fetchResult.data.value.data
  }
  watchEffect(() => {
    if (fetchResult.data.value?.data) {
      activeState.value = fetchResult.data.value.data
    }
  })

  return fetchResult
}

export function useActiveTenant() {
  const state = useState<TenantBootstrap | null>('active-tenant-bootstrap', () => null)
  const route = useRoute()
  const restaurantCookie = useCookie<string | null>('vondo-restaurant')
  const activeSlug = computed(() => (route.query.restaurant as string) || restaurantCookie.value || 'default')
  const nuxtData = useNuxtData<{ data: TenantBootstrap }>(`tenant-bootstrap-${activeSlug.value}`)
  return computed(() => state.value || nuxtData.data.value?.data || null)
}

export function useStorefrontHeaders() {
  return import.meta.server
    ? useRequestHeaders(['host', 'x-forwarded-host', 'x-forwarded-proto', 'cookie'])
    : undefined
}

export function tenantHref(href: string) {
  const clean = href.replace(/^#/, '')
  const route = useRoute()
  const slug = route.query.restaurant
  if (slug && clean && !clean.startsWith('http')) {
    const separator = clean.includes('?') ? '&' : '?'
    return `${clean}${separator}restaurant=${encodeURIComponent(String(slug))}`
  }
  return clean || '/'
}


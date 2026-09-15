import type { TenantBootstrap } from '~/types/storefront'

export function useIsMarketplace() {
  const route = useRoute()
  const requestUrl = useRequestURL()
  const config = useRuntimeConfig()
  const baseDomain = ((config.public.baseDomain as string) || 'deliveriano.ch').toLowerCase()
  const host = (requestUrl.host || '').replace(/:\d+$/, '').toLowerCase()

  return computed(() => {
    // If explicit query param ?restaurant= is passed, treat as restaurant experience
    if (route.query.restaurant) {
      return false
    }

    // Check if on subdomain (e.g. pizzeria.deliveriano.ch)
    if (host.endsWith('.' + baseDomain)) {
      const subdomain = host.slice(0, -(baseDomain.length + 1))
      if (!['www', 'api', 'backend', 'marketplace', 'admin'].includes(subdomain)) {
        return false
      }
    }

    // On localhost or custom domain without query
    const isLocalDev = host === 'localhost' || host === '127.0.0.1' || host === 'webserver'
    const isBase = host === baseDomain || host === `www.${baseDomain}` || host === `marketplace.${baseDomain}`

    return isBase || isLocalDev
  })
}

export function useTenantSlug() {
  const route = useRoute()
  const requestUrl = useRequestURL()
  const config = useRuntimeConfig()
  const baseDomain = ((config.public.baseDomain as string) || 'deliveriano.ch').toLowerCase()
  const host = (requestUrl.host || '').replace(/:\d+$/, '').toLowerCase()
  const isMarketplace = useIsMarketplace()

  return computed(() => {
    // 1. Subdomain of base domain takes first priority
    if (host.endsWith('.' + baseDomain)) {
      const subdomain = host.slice(0, -(baseDomain.length + 1))
      if (!['www', 'api', 'backend', 'marketplace', 'admin'].includes(subdomain)) {
        return subdomain
      }
    }

    // 2. Explicit query param (e.g. ?restaurant=slug)
    if (route.query.restaurant) {
      return route.query.restaurant as string
    }

    // 3. If marketplace, never fallback to cookie or default restaurant
    if (isMarketplace.value) {
      return null
    }

    // 4. Custom domain or legacy cookie on restaurant pages
    return null
  })
}

export function useTenant() {
  const isMarketplace = useIsMarketplace()
  const activeSlug = useTenantSlug()
  const route = useRoute()
  const restaurantCookie = useCookie<string | null>('vondo-restaurant')

  // Only sync cookie if NOT on marketplace and restaurant was explicitly in query
  if (import.meta.client && route.query.restaurant && !isMarketplace.value) {
    restaurantCookie.value = route.query.restaurant as string
  }

  const requestHeaders = import.meta.server
    ? useRequestHeaders(['host', 'x-forwarded-host', 'x-forwarded-proto', 'cookie'])
    : undefined

  const queryParams = computed(() => {
    return activeSlug.value ? { restaurant: activeSlug.value } : {}
  })

  const fetchResult = useFetch<{ data: TenantBootstrap }>('/api/v1/storefront/bootstrap', {
    key: computed(() => `tenant-bootstrap-${activeSlug.value || 'none'}`).value,
    query: queryParams,
    headers: requestHeaders,
    retry: 1,
    timeout: 8000,
    immediate: !isMarketplace.value,
    transform: response => response,
  })

  const activeState = useState<TenantBootstrap | null>('active-tenant-bootstrap', () => null)
  if (fetchResult.data.value?.data && !isMarketplace.value) {
    activeState.value = fetchResult.data.value.data
  }
  watchEffect(() => {
    if (fetchResult.data.value?.data && !isMarketplace.value) {
      activeState.value = fetchResult.data.value.data
    } else if (isMarketplace.value) {
      activeState.value = null
    }
  })

  return fetchResult
}

export function useActiveTenant() {
  const state = useState<TenantBootstrap | null>('active-tenant-bootstrap', () => null)
  const isMarketplace = useIsMarketplace()
  const activeSlug = useTenantSlug()
  const nuxtData = useNuxtData<{ data: TenantBootstrap }>(`tenant-bootstrap-${activeSlug.value || 'none'}`)
  return computed(() => {
    if (isMarketplace.value) return null
    return state.value || nuxtData.data.value?.data || null
  })
}

export function useStorefrontHeaders() {
  const slug = useTenantSlug()
  const forwarded = import.meta.server
    ? useRequestHeaders(['host', 'x-forwarded-host', 'x-forwarded-proto'])
    : {}
  return { ...forwarded, ...(slug.value ? { 'X-Vondo-Restaurant': slug.value } : {}) }
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

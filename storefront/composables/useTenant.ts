import type { TenantBootstrap } from '~/types/storefront'

export function useTenant() {
  const requestHeaders = import.meta.server ? useRequestHeaders(['host', 'x-forwarded-host', 'x-forwarded-proto']) : undefined
  return useFetch<{ data: TenantBootstrap }>('/api/v1/storefront/bootstrap', {
    key: 'tenant-bootstrap',
    headers: requestHeaders,
    retry: 1,
    timeout: 8000,
    transform: response => response,
  })
}

export function tenantHref(href: string) {
  const clean = href.replace(/^#/, '')
  return clean || '/'
}

import type { H3Event } from 'h3'

export async function serverTenant(event: H3Event): Promise<any> {
  const config = useRuntimeConfig(event)
  const host = getRequestHost(event, { xForwardedHost: true })
  const hostname = host.replace(/:\d+$/, '').toLowerCase()
  const tenantHeader = ['localhost', '127.0.0.1'].includes(hostname)
    ? { 'x-vondo-restaurant': config.defaultRestaurant }
    : {}
  return $fetch<any>(`${config.apiInternalBase}/v1/storefront/bootstrap`, {
    headers: { 'x-forwarded-host': host, 'x-forwarded-proto': getRequestProtocol(event), ...tenantHeader } as Record<string, string>,
  })
}

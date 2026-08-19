import type { H3Event } from 'h3'
import { buildTenantHeaders } from './restaurant'

export async function serverTenant(event: H3Event): Promise<any> {
  const config = useRuntimeConfig(event)
  const host = getRequestHost(event, { xForwardedHost: true })
  const tenantHeaders = buildTenantHeaders(event)
  return $fetch<any>(`${config.apiInternalBase}/v1/storefront/bootstrap`, {
    headers: { 'x-forwarded-host': host, 'x-forwarded-proto': getRequestProtocol(event), ...tenantHeaders } as Record<string, string>,
  })
}

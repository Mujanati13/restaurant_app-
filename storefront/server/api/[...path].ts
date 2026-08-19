import { getRequestHost, getRequestProtocol, getRouterParam, proxyRequest } from 'h3'
import { buildTenantHeaders } from '../utils/restaurant'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') || ''
  const config = useRuntimeConfig(event)
  const originalHost = getRequestHost(event, { xForwardedHost: true })
  const tenantHeaders = buildTenantHeaders(event)
  return proxyRequest(event, `${config.apiInternalBase}/${path}`, {
    fetchOptions: { headers: { 'x-forwarded-host': originalHost, 'x-forwarded-proto': getRequestProtocol(event), ...tenantHeaders } as Record<string, string> },
  })
})

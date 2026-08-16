import { getRequestHost, getRequestProtocol, getRouterParam, proxyRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') || ''
  const config = useRuntimeConfig(event)
  const originalHost = getRequestHost(event, { xForwardedHost: true })
  const hostname = originalHost.replace(/:\d+$/, '').toLowerCase()
  const tenantHeader = ['localhost', '127.0.0.1'].includes(hostname)
    ? { 'x-vondo-restaurant': config.defaultRestaurant }
    : {}
  return proxyRequest(event, `${config.apiInternalBase}/${path}`, {
    fetchOptions: { headers: { 'x-forwarded-host': originalHost, 'x-forwarded-proto': getRequestProtocol(event), ...tenantHeader } },
  })
})

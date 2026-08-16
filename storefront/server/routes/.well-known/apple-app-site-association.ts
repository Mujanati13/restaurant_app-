import { serverTenant } from '../../utils/tenant'

export default defineEventHandler(async (event): Promise<Record<string, unknown>> => {
  const tenant: any = (await serverTenant(event)).data
  const ios: any = tenant.brand.mobile?.ios || {}
  setHeader(event, 'content-type', 'application/json')
  return { applinks: { apps: [], details: ios.team_id && ios.bundle_id ? [{ appID: `${ios.team_id}.${ios.bundle_id}`, paths: ['/menu/*', '/account/orders/*', '/reservations'] }] : [] } }
})

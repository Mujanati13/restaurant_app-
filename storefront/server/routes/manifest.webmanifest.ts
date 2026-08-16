import { serverTenant } from '../utils/tenant'

export default defineEventHandler(async (event): Promise<Record<string, unknown>> => {
  const tenant: any = (await serverTenant(event)).data
  setHeader(event, 'content-type', 'application/manifest+json')
  setHeader(event, 'cache-control', 'public, max-age=300')
  return { id: `/${tenant.restaurant.id}`, name: tenant.brand.identity.name, short_name: tenant.brand.identity.name.slice(0, 12),
    description: tenant.brand.identity.tagline, start_url: '/', scope: '/', display: 'standalone',
    background_color: tenant.brand.theme.background, theme_color: tenant.brand.theme.primary,
    icons: tenant.brand.identity.logo_url ? [{ src: tenant.brand.identity.logo_url, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }] : [] }
})

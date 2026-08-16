import { serverTenant } from '../utils/tenant'

export default defineEventHandler(async (event): Promise<string> => {
  const tenant: any = (await serverTenant(event)).data
  const origin = `${getRequestProtocol(event)}://${getRequestHost(event, { xForwardedHost: true })}`
  const fixed = ['/', '/menu', '/locations', '/reservations']
  const urls: string[] = [...fixed, ...tenant.pages.filter((page: any) => !page.is_home).map((page: any) => `/pages/${page.slug}`)]
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=300')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(path => `<url><loc>${escapeXml(origin + path)}</loc></url>`).join('')}</urlset>`
})

function escapeXml(value: string) { return value.replace(/[<>&'\"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]!) }

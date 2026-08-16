export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  const origin = `${getRequestProtocol(event)}://${getRequestHost(event, { xForwardedHost: true })}`
  return `User-agent: *\nAllow: /\nDisallow: /checkout\nDisallow: /account\nSitemap: ${origin}/sitemap.xml\n`
})

import type { H3Event } from 'h3'
import { getCookie, getQuery, getRequestHost } from 'h3'

/**
 * Resolve the restaurant slug for the current request.
 * Priority: Subdomain > Verified custom domain > ?restaurant= query param > (cookie only on restaurant context).
 * Base marketplace domain (deliveriano.ch) never resolves a default restaurant or gets hijacked by an old cookie.
 */
export function resolveRestaurantSlug(event: H3Event): string | null {
  const host = (getRequestHost(event, { xForwardedHost: true }) || '').replace(/:\d+$/, '').toLowerCase()
  const config = useRuntimeConfig(event)
  const baseDomain = ((config.baseDomain as string) || 'deliveriano.ch').toLowerCase()
  const query = getQuery(event)
  const fromQuery = query.restaurant as string | undefined

  // 1. Check subdomain of base domain (e.g. pizzeria.deliveriano.ch)
  if (host && host.endsWith('.' + baseDomain)) {
    const subdomain = host.slice(0, -(baseDomain.length + 1))
    if (!['www', 'api', 'backend', 'marketplace', 'admin'].includes(subdomain)) {
      return subdomain
    }
  }

  // 2. Check if this is the marketplace base domain or local dev root
  const isMarketplaceHost = host === baseDomain || host === `www.${baseDomain}` || host === `marketplace.${baseDomain}`
  const isLocalDev = host === 'localhost' || host === '127.0.0.1' || host === 'webserver'

  if (isMarketplaceHost || (isLocalDev && !fromQuery)) {
    // Explicit query overrides for dev/preview only
    if (fromQuery) return fromQuery
    // Do NOT allow cookie or default restaurant to hijack marketplace
    return null
  }

  // 3. Explicit query parameter (e.g. during dev or preview links)
  if (fromQuery && isLocalDev) return fromQuery

  // 4. Custom domain or explicit cookie fallback for existing tenant sessions
  if (!isMarketplaceHost && !isLocalDev) {
    // If it's a custom domain, return host or null so backend handles verified domain
    return null
  }

  const fromCookie = getCookie(event, 'vondo-restaurant')
  if (fromCookie && !isMarketplaceHost) {
    return fromCookie
  }

  return (config.defaultRestaurant as string) || null
}

/**
 * Build the x-vondo-restaurant header object for upstream API calls.
 */
export function buildTenantHeaders(event: H3Event): Record<string, string> {
  const slug = resolveRestaurantSlug(event)
  return slug ? { 'x-vondo-restaurant': slug } : {}
}

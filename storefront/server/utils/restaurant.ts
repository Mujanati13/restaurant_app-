import type { H3Event } from 'h3'
import { getCookie, getQuery } from 'h3'

/**
 * Resolve the restaurant slug for the current request.
 * Priority: ?restaurant= query param > vondo-restaurant cookie > runtime config default.
 */
export function resolveRestaurantSlug(event: H3Event): string {
  const query = getQuery(event)
  const fromQuery = query.restaurant as string | undefined
  if (fromQuery) return fromQuery

  const fromCookie = getCookie(event, 'vondo-restaurant')
  if (fromCookie) return fromCookie

  const config = useRuntimeConfig(event)
  return config.defaultRestaurant as string || 'default'
}

/**
 * Build the x-vondo-restaurant header object for upstream API calls.
 */
export function buildTenantHeaders(event: H3Event): Record<string, string> {
  const slug = resolveRestaurantSlug(event)
  return { 'x-vondo-restaurant': slug }
}

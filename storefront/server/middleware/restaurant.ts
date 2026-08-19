import { getCookie, setCookie, getQuery } from 'h3'

/**
 * Server middleware that captures the `?restaurant=<slug>` query parameter
 * and persists it in a cookie so that every subsequent page navigation
 * and API proxy call knows which tenant storefront to render.
 */
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const slug = query.restaurant as string | undefined

  if (slug) {
    // Persist for 30 days so the user doesn't need the query param on every click
    setCookie(event, 'vondo-restaurant', slug, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      sameSite: 'lax',
    })
  }
})

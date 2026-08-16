import type { TenantBootstrap } from '~/types/storefront'

interface SessionPayload { token: string; refresh_token?: string | null; expires_at: string }

export function useStorefrontApi() {
  const bootstrap = useNuxtData<{ data: TenantBootstrap }>('tenant-bootstrap')
  const tenantId = computed(() => bootstrap.data.value?.data.restaurant.id || 'bootstrap')
  const authenticated = useState('storefront-authenticated', () => false)
  let refreshPromise: Promise<void> | null = null
  const key = (name: string) => `vondo:${tenantId.value}:${name}`
  const read = (name: string) => import.meta.client ? localStorage.getItem(key(name)) : null
  const saveSession = (session?: Partial<SessionPayload>) => {
    if (!import.meta.client) return
    if (session?.token) localStorage.setItem(key('auth_token'), session.token); else localStorage.removeItem(key('auth_token'))
    if (session?.refresh_token) localStorage.setItem(key('refresh_token'), session.refresh_token); else if (session) localStorage.removeItem(key('refresh_token'))
    authenticated.value = Boolean(session?.token)
  }
  if (import.meta.client) authenticated.value = Boolean(read('auth_token'))

  async function refresh() {
    if (!refreshPromise) refreshPromise = $fetch<SessionPayload>('/api/v1/storefront/refresh', {
      method: 'POST', headers: { 'X-Vondo-Restaurant': tenantId.value }, body: { refresh_token: read('refresh_token') },
    }).then(saveSession).finally(() => { refreshPromise = null })
    return refreshPromise
  }

  async function request<T>(path: string, options: Record<string, unknown> = {}, retried = false): Promise<T> {
    const headers = { Accept: 'application/json', 'X-Vondo-Restaurant': tenantId.value,
      ...(read('auth_token') ? { Authorization: `Bearer ${read('auth_token')}` } : {}), ...((options.headers as object) || {}) }
    try { return await $fetch<T>(`/api/v1/storefront${path}`, { ...options, headers }) }
    catch (error: any) {
      if (error?.statusCode === 401 && !retried && read('refresh_token')) { await refresh(); return request<T>(path, options, true) }
      if (error?.statusCode === 401) saveSession()
      throw error
    }
  }

  return { request, authenticated, saveSession, tenantId }
}

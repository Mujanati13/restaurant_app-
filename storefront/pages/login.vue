<script setup lang="ts">
declare global {
  interface Window { google?: any }
}

const tenant = useActiveTenant()
const api = useStorefrontApi()
const route = useRoute()
const config = useRuntimeConfig()
const mode = ref<'login' | 'register'>('login')
const busy = ref(false)
const message = ref('')
const error = ref('')
const googleButton = ref<HTMLElement | null>(null)
const form = reactive({ first_name: '', last_name: '', email: '', telephone: '', password: '', password_confirmation: '' })
const googleClientId = String(config.public.googleClientId || '')

async function finish(session: any) {
  api.saveSession(session)
  await navigateTo(String(route.query.redirect || '/account'))
}

async function submit() {
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    if (mode.value === 'register') await api.request('/register', { method: 'POST', body: form })
    const session = await api.request<any>('/token', {
      method: 'POST', body: { email: form.email, password: form.password, device_name: 'Nuxt storefront' },
    })
    await finish(session)
  } catch (reason: any) {
    error.value = reason?.data?.message || reason?.message || 'Unable to continue.'
  } finally {
    busy.value = false
  }
}

async function useGoogle(credential: string) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const session = await api.request<any>('/google', {
      method: 'POST', body: { id_token: credential, device_name: 'Deliveriano web' },
    })
    await finish(session)
  } catch (reason: any) {
    error.value = reason?.data?.message || reason?.message || 'Google sign-in could not be completed.'
  } finally {
    busy.value = false
  }
}

function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google sign-in could not be loaded.')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google sign-in could not be loaded.'))
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  if (!googleClientId || !googleButton.value) return
  try {
    await loadGoogleIdentity()
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response: { credential?: string }) => response.credential && useGoogle(response.credential),
      auto_select: false,
      cancel_on_tap_outside: true,
    })
    window.google.accounts.id.renderButton(googleButton.value, {
      type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: 360,
    })
  } catch (reason: any) {
    error.value = reason?.message || 'Google sign-in could not be loaded.'
  }
})

useSeoMeta({ title: () => `Account — ${tenant.value?.brand?.identity?.name || 'Account'}`, robots: 'noindex,nofollow' })
</script>

<template>
  <div class="page section">
    <div class="container auth-layout">
      <section class="card auth-card">
        <span class="section-kicker">Customer account</span>
        <h1>{{ mode === 'login' ? 'Welcome back' : 'Create your account' }}</h1>
        <div class="segmented">
          <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Sign in</button>
          <button :class="{ active: mode === 'register' }" @click="mode = 'register'">Register</button>
        </div>
        <p v-if="error" class="notice error" role="alert">{{ error }}</p>
        <p v-if="message" class="notice">{{ message }}</p>
        <div v-if="googleClientId" class="google-auth">
          <div ref="googleButton" class="google-auth-button" aria-label="Continue with Google" />
          <p>Use your Google account for a quick, secure sign-in.</p>
          <div class="auth-divider"><span>or continue with email</span></div>
        </div>
        <form class="form-grid" @submit.prevent="submit">
          <template v-if="mode === 'register'">
            <label><span>First name</span><input v-model="form.first_name" required maxlength="48" autocomplete="given-name"></label>
            <label><span>Last name</span><input v-model="form.last_name" required maxlength="48" autocomplete="family-name"></label>
            <label class="full"><span>Telephone</span><input v-model="form.telephone" required maxlength="64" autocomplete="tel"></label>
          </template>
          <label class="full"><span>Email</span><input v-model="form.email" type="email" required autocomplete="email"></label>
          <label class="full"><span>Password</span><input v-model="form.password" type="password" required minlength="8" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"></label>
          <label v-if="mode === 'register'" class="full"><span>Confirm password</span><input v-model="form.password_confirmation" type="password" required minlength="8" autocomplete="new-password"></label>
          <button class="btn primary full" :disabled="busy">{{ busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account' }}</button>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.google-auth { margin: 1.25rem 0 1.5rem; text-align: center; }
.google-auth-button { display: flex; justify-content: center; min-height: 44px; }
.google-auth p { margin: .65rem 0 0; color: var(--text-muted, #6d6864); font-size: .85rem; }
.auth-divider { display: flex; align-items: center; gap: .75rem; margin-top: 1.2rem; color: var(--text-muted, #6d6864); font-size: .8rem; }
.auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--border, #e7e3df); }
</style>

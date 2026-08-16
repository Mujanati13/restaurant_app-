<script setup lang="ts">
const tenant = useNuxtData<any>('tenant-bootstrap'); const api = useStorefrontApi(); const route = useRoute()
const mode = ref<'login' | 'register'>('login'); const busy = ref(false); const message = ref(''); const error = ref('')
const form = reactive({ first_name: '', last_name: '', email: '', telephone: '', password: '', password_confirmation: '' })
async function submit() {
  busy.value = true; error.value = ''; message.value = ''
  try {
    if (mode.value === 'register') await api.request('/register', { method: 'POST', body: form })
    const session = await api.request<any>('/token', { method: 'POST', body: { email: form.email, password: form.password, device_name: 'Nuxt storefront' } })
    api.saveSession(session); await navigateTo(String(route.query.redirect || '/account'))
  } catch (reason: any) { error.value = reason?.data?.message || reason?.message || 'Unable to continue.' }
  finally { busy.value = false }
}
useSeoMeta({ title: () => `Account — ${tenant.data.value.data.brand.identity.name}`, robots: 'noindex,nofollow' })
</script>
<template><div class="page section"><div class="container auth-layout"><section class="card auth-card"><span class="section-kicker">Customer account</span><h1>{{ mode === 'login' ? 'Welcome back' : 'Create your account' }}</h1><div class="segmented"><button :class="{ active: mode === 'login' }" @click="mode = 'login'">Sign in</button><button :class="{ active: mode === 'register' }" @click="mode = 'register'">Register</button></div><p v-if="error" class="notice error" role="alert">{{ error }}</p><p v-if="message" class="notice">{{ message }}</p><form class="form-grid" @submit.prevent="submit"><template v-if="mode === 'register'"><label><span>First name</span><input v-model="form.first_name" required maxlength="48" autocomplete="given-name"></label><label><span>Last name</span><input v-model="form.last_name" required maxlength="48" autocomplete="family-name"></label><label class="full"><span>Telephone</span><input v-model="form.telephone" required maxlength="64" autocomplete="tel"></label></template><label class="full"><span>Email</span><input v-model="form.email" type="email" required autocomplete="email"></label><label class="full"><span>Password</span><input v-model="form.password" type="password" required minlength="8" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"></label><label v-if="mode === 'register'" class="full"><span>Confirm password</span><input v-model="form.password_confirmation" type="password" required minlength="8" autocomplete="new-password"></label><button class="btn primary full" :disabled="busy">{{ busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account' }}</button></form></section></div></div></template>

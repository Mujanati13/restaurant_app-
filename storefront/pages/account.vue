<script setup lang="ts">
const tenant = useActiveTenant()
const api = useStorefrontApi()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const saved = ref('')
const account = reactive({ first_name: '', last_name: '', email: '', telephone: '' })
const orders = ref<any[]>([])
const reservations = ref<any[]>([])
const addresses = ref<any[]>([])
const favorites = ref<any[]>([])
const address = reactive({ address_1: '', address_2: '', city: '', postcode: '' })

async function load() {
  if (!api.authenticated.value) return navigateTo('/login?redirect=/account')
  loading.value = true; error.value = ''
  try {
    const [profile, orderResult, reservationResult, addressResult, favoriteResult, menuResult] = await Promise.all([
      api.request<any>('/account'), api.request<any>('/orders?limit=10'), api.request<any>('/reservations?limit=10'), api.request<any>('/addresses'), api.request<any>('/favorites'), api.request<any>('/menus?limit=100'),
    ])
    Object.assign(account, profile.data)
    orders.value = orderResult.data; reservations.value = reservationResult.data; addresses.value = addressResult.data
    favorites.value = (menuResult.data || []).filter((item: any) => (favoriteResult.data || []).includes(item.id))
  } catch (reason: any) { error.value = reason?.data?.message || reason?.message || 'We could not load your account.' }
  finally { loading.value = false }
}
async function saveProfile() {
  saving.value = true; saved.value = ''; error.value = ''
  try { await api.request('/account', { method: 'PATCH', body: account }); saved.value = 'Profile saved.' }
  catch (reason: any) { error.value = reason?.data?.message || reason?.message || 'We could not save your profile.' }
  finally { saving.value = false }
}
async function saveAddress() {
  saving.value = true; saved.value = ''; error.value = ''
  try { await api.request('/addresses', { method: 'POST', body: address }); Object.assign(address, { address_1: '', address_2: '', city: '', postcode: '' }); await load(); saved.value = 'Address saved.' }
  catch (reason: any) { error.value = reason?.data?.message || reason?.message || 'We could not save your address.' }
  finally { saving.value = false }
}
async function deleteAddress(id: number) {
  saving.value = true; saved.value = ''; error.value = ''
  try { await api.request(`/addresses/${id}`, { method: 'DELETE' }); await load(); saved.value = 'Address removed.' }
  catch (reason: any) { error.value = reason?.data?.message || reason?.message || 'We could not remove your address.' }
  finally { saving.value = false }
}
async function logout() { try { await api.request('/token', { method: 'DELETE' }) } finally { api.saveSession(); await navigateTo('/login') } }
onMounted(load)
useSeoMeta({ title: () => `My account — ${tenant.value?.brand?.identity?.name || 'Account'}`, robots: 'noindex,nofollow' })
</script>

<template>
  <div class="page section"><div class="container">
    <AsyncState :loading="loading" :error="error" :empty="false" @retry="load">
      <div class="section-headline"><div><span class="section-kicker">Your Deliveriano account</span><h1>Hello, {{ account.first_name }}</h1></div><button class="btn outline" type="button" @click="logout">Sign out</button></div>
      <p v-if="saved" class="notice" role="status">{{ saved }}</p>
      <div class="account-grid account-dashboard">
        <section class="card"><h2>Profile</h2><form class="form-grid" @submit.prevent="saveProfile"><label><span>First name</span><input v-model="account.first_name" required></label><label><span>Last name</span><input v-model="account.last_name" required></label><label class="full"><span>Email</span><input v-model="account.email" type="email" required></label><label class="full"><span>Telephone</span><input v-model="account.telephone" type="tel" required></label><button class="btn primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save profile' }}</button></form></section>
        <section class="card"><h2>Saved addresses</h2><div v-if="addresses.length" class="timeline-list"><article v-for="item in addresses" :key="item.id"><div><strong>{{ item.address_1 }}</strong><small>{{ [item.address_2, item.postcode, item.city].filter(Boolean).join(', ') }}</small></div><button class="btn outline" type="button" :disabled="saving" @click="deleteAddress(item.id)">Remove</button></article></div><p v-else>No saved addresses yet.</p><form class="form-grid" @submit.prevent="saveAddress"><label class="full"><span>Street address</span><input v-model="address.address_1" required></label><label><span>Postal code</span><input v-model="address.postcode"></label><label><span>City</span><input v-model="address.city" required></label><button class="btn outline" :disabled="saving">Save address</button></form></section>
        <section class="card"><h2>Recent orders</h2><div v-if="orders.length" class="timeline-list"><article v-for="order in orders" :key="order.id"><div><NuxtLink :to="`/orders/${order.id}`"><strong>{{ order.number }}</strong></NuxtLink><small>{{ order.location }} · {{ order.status.name }}</small></div><strong>{{ new Intl.NumberFormat(undefined, { style: 'currency', currency: tenant?.currency?.code || 'CHF' }).format(order.total) }}</strong></article></div><p v-else>No orders yet. <NuxtLink to="/menu">Choose something delicious</NuxtLink>.</p></section>
        <section class="card"><h2>Favorites</h2><div v-if="favorites.length" class="timeline-list"><article v-for="item in favorites" :key="item.id"><NuxtLink :to="`/menu/${item.id}`"><strong>{{ item.name }}</strong><small>{{ new Intl.NumberFormat(undefined, { style: 'currency', currency: tenant?.currency?.code || 'CHF' }).format(item.price) }}</small></NuxtLink></article></div><p v-else>Save menu items to find them here later.</p></section>
        <section class="card"><h2>Reservations</h2><div v-if="reservations.length" class="timeline-list"><article v-for="reservation in reservations" :key="reservation.id"><div><strong>{{ reservation.date }} at {{ reservation.time }}</strong><small>{{ reservation.location }} · {{ reservation.status.name }}</small></div><span>{{ reservation.guests }} guests</span></article></div><p v-else>No upcoming reservations. <NuxtLink to="/reservations">Book a table</NuxtLink>.</p></section>
      </div>
    </AsyncState>
  </div></div>
</template>

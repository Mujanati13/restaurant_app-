<script setup lang="ts">
import type { Location } from '~/types/storefront'
const tenant = useNuxtData<any>('tenant-bootstrap'); const api = useStorefrontApi(); const route = useRoute()
const headers = import.meta.server ? useRequestHeaders(['host', 'x-forwarded-host', 'x-forwarded-proto']) : undefined
const { data: locations, error: loadError } = await useFetch<{ data: Location[] }>('/api/v1/storefront/locations', { headers })
const form = reactive({ location_id: Number(route.query.location || 0), guest_num: 2, reserve_date: '', reserve_time: '19:00', duration: 90, first_name: '', last_name: '', telephone: '', comment: '' })
const busy = ref(false); const error = ref(''); const success = ref('')
async function submit() {
  if (!api.authenticated.value) return navigateTo('/login?redirect=/reservations')
  busy.value = true; error.value = ''; success.value = ''
  try { const result = await api.request<any>('/reservations', { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: form }); success.value = `Reservation ${result.data.id} is confirmed.` }
  catch (reason: any) { error.value = reason?.data?.message || reason?.message || 'Reservation could not be created.' }
  finally { busy.value = false }
}
useSeoMeta({ title: () => `Reservations — ${tenant.data.value.data.brand.identity.name}` })
</script>
<template><div class="page"><section class="page-hero"><div class="container"><span class="section-kicker">Book a table</span><h1>Plan your visit</h1><p>Tell us when you are coming and we’ll find the best available table.</p></div></section><section class="section"><div class="container form-shell"><p v-if="loadError" class="notice error" role="alert">Locations could not be loaded.</p><p v-if="error" class="notice error" role="alert">{{ error }}</p><p v-if="success" class="notice success" role="status">{{ success }}</p><form class="card form-grid" @submit.prevent="submit"><label class="full"><span>Location</span><select v-model.number="form.location_id" required><option :value="0" disabled>Select a location</option><option v-for="location in locations?.data" :key="location.id" :value="location.id">{{ location.name }}</option></select></label><label><span>Date</span><input v-model="form.reserve_date" type="date" required></label><label><span>Time</span><input v-model="form.reserve_time" type="time" required></label><label><span>Guests</span><input v-model.number="form.guest_num" type="number" min="1" max="100" required></label><label><span>Duration</span><select v-model.number="form.duration"><option :value="60">1 hour</option><option :value="90">1.5 hours</option><option :value="120">2 hours</option></select></label><label><span>First name</span><input v-model="form.first_name" required maxlength="48"></label><label><span>Last name</span><input v-model="form.last_name" required maxlength="48"></label><label class="full"><span>Telephone</span><input v-model="form.telephone" required maxlength="64"></label><label class="full"><span>Notes (optional)</span><textarea v-model="form.comment" maxlength="520" rows="3"/></label><button class="btn primary full" :disabled="busy || !locations?.data?.length">{{ busy ? 'Checking availability…' : 'Reserve table' }}</button></form></div></section></div></template>

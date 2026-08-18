<script setup lang="ts">
import type { Location } from '~/types/storefront'

const tenant = useNuxtData<any>('tenant-bootstrap')
const api = useStorefrontApi()
const route = useRoute()
const headers = import.meta.server ? useRequestHeaders(['host', 'x-forwarded-host', 'x-forwarded-proto']) : undefined
const { data: locations, error: loadError } = await useFetch<{ data: Location[] }>('/api/v1/storefront/locations', { headers })

const bootstrapData = computed(() => tenant.data.value?.data)
const settings = computed(() => bootstrapData.value?.settings || {})

const form = reactive({
  location_id: Number(route.query.location || 0),
  guest_num: 2,
  reserve_date: new Date().toISOString().split('T')[0],
  reserve_time: '19:00',
  duration: 90,
  first_name: '',
  last_name: '',
  email: '',
  telephone: '',
  comment: '',
})

// Auto-select default location
watchEffect(() => {
  if (locations.value?.data?.length && (!form.location_id || form.location_id === 0)) {
    const def = locations.value.data.find(l => l.is_default) || locations.value.data[0]
    if (def) form.location_id = def.id
  }
})

const busy = ref(false)
const error = ref('')
const success = ref('')

async function submit() {
  const isGuestAllowed = settings.value?.guest_checkout_enabled !== false
  if (!api.authenticated.value && !isGuestAllowed) {
    return navigateTo('/login?redirect=/reservations')
  }

  busy.value = true
  error.value = ''
  success.value = ''

  try {
    const result = await api.request<any>('/reservations', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: form,
    })
    success.value = `Table reservation #${result.data.id} is confirmed! We look forward to welcoming you.`
  } catch (reason: any) {
    error.value = reason?.data?.message || reason?.message || 'Reservation could not be created.'
  } finally {
    busy.value = false
  }
}

useSeoMeta({
  title: () => `Reservations — ${bootstrapData.value?.brand?.identity?.name || 'Restaurant'}`,
})
</script>

<template>
  <div class="page">
    <section class="page-hero">
      <div class="container">
        <span class="section-kicker">Book a Table</span>
        <h1>Plan Your Visit</h1>
        <p>Tell us when you are coming and we’ll reserve the best table for your party.</p>
      </div>
    </section>

    <section class="section">
      <div class="container form-shell">
        <p v-if="loadError" class="notice error" role="alert">
          Locations could not be loaded.
        </p>
        <p v-if="error" class="notice error" role="alert">
          {{ error }}
        </p>
        <div v-if="success" class="notice success" role="status">
          <i class="ri-checkbox-circle-line" />
          <p>{{ success }}</p>
        </div>

        <form v-if="!success" class="card form-grid" @submit.prevent="submit">
          <label class="full">
            <span>Branch Location</span>
            <select v-model.number="form.location_id" required>
              <option :value="0" disabled>Select a location</option>
              <option
                v-for="location in locations?.data"
                :key="location.id"
                :value="location.id"
              >
                {{ location.name }} — {{ location.address }}
              </option>
            </select>
          </label>

          <label>
            <span>Date</span>
            <input v-model="form.reserve_date" type="date" required>
          </label>

          <label>
            <span>Time</span>
            <input v-model="form.reserve_time" type="time" required>
          </label>

          <label>
            <span>Guests / Party Size</span>
            <input v-model.number="form.guest_num" type="number" min="1" max="100" required>
          </label>

          <label>
            <span>Dining Duration</span>
            <select v-model.number="form.duration">
              <option :value="60">1 hour</option>
              <option :value="90">1.5 hours</option>
              <option :value="120">2 hours</option>
            </select>
          </label>

          <label>
            <span>First Name</span>
            <input v-model="form.first_name" required maxlength="48">
          </label>

          <label>
            <span>Last Name</span>
            <input v-model="form.last_name" required maxlength="48">
          </label>

          <label class="full">
            <span>Email Address</span>
            <input v-model="form.email" type="email" :required="!api.authenticated.value">
          </label>

          <label class="full">
            <span>Telephone</span>
            <input v-model="form.telephone" type="tel" required maxlength="64">
          </label>

          <label class="full">
            <span>Special Requests / Dietary Notes (optional)</span>
            <textarea v-model="form.comment" maxlength="520" rows="3" placeholder="High chairs, anniversary, allergies, etc..." />
          </label>

          <button
            class="btn primary full"
            :disabled="busy || !locations?.data?.length"
          >
            {{ busy ? 'Checking table availability…' : 'Confirm Table Booking' }}
          </button>
        </form>
      </div>
    </section>
  </div>
</template>


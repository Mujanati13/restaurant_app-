<script setup lang="ts">
import type { Location, PaymentMethod } from '~/types/storefront'
import { generateUUID } from '~/utils/uuid'

const bootstrapData = useActiveTenant()
const api = useStorefrontApi()
const cart = useTenantCart()
const headers = useStorefrontHeaders()
const { data: locations } = await useFetch<{ data: Location[] }>('/api/v1/storefront/locations', { headers })

const currencyCode = computed(() => bootstrapData.value?.currency?.code || 'USD')
const currencySymbol = computed(() => bootstrapData.value?.currency?.symbol || '$')
const settings = computed(() => (bootstrapData.value?.settings || {}) as any)
const paymentMethods = computed<PaymentMethod[]>(() => bootstrapData.value?.payment_methods || [{ code: 'cod', name: 'Cash on Delivery' }])

const form = reactive({
  location_id: 0,
  order_type: 'collection',
  first_name: '',
  last_name: '',
  email: '',
  telephone: '',
  comment: '',
  address_1: '',
  city: '',
  postcode: '',
  payment_method: 'cod',
  tip_percent: 0,
  custom_tip: 0,
})

// Auto-select default location or first location
watchEffect(() => {
  if (locations.value?.data?.length && (!form.location_id || form.location_id === 0)) {
    const def = locations.value.data.find(l => l.is_default) || locations.value.data[0]
    if (def) form.location_id = def.id
  }
})

// Auto-select first active payment method
watchEffect(() => {
  if (paymentMethods.value.length && !form.payment_method) {
    form.payment_method = paymentMethods.value[0]?.code || 'cod'
  }
})

const selectedLocation = computed(() => {
  return locations.value?.data?.find(l => l.id === form.location_id)
})

const subtotal = computed(() => cart.subtotal.value)
const deliveryFee = computed(() => {
  if (form.order_type !== 'delivery') return 0
  return Number(selectedLocation.value?.delivery_charge || 0)
})

const taxRate = computed(() => Number(settings.value?.tax_rate || 0))
const taxAmount = computed(() => {
  if (taxRate.value <= 0) return 0
  return Math.round(subtotal.value * (taxRate.value / 100) * 100) / 100
})

const tipAmount = computed(() => {
  if (!settings.value?.tipping_enabled) return 0
  if (form.tip_percent > 0) {
    return Math.round(subtotal.value * (form.tip_percent / 100) * 100) / 100
  }
  return Number(form.custom_tip || 0)
})

const totalAmount = computed(() => {
  return Math.round((subtotal.value + deliveryFee.value + taxAmount.value + tipAmount.value) * 100) / 100
})

const selectedPayment = computed(() => {
  return paymentMethods.value.find(p => p.code === form.payment_method)
})

const minDeliveryOrder = computed(() => Number(selectedLocation.value?.min_delivery_order || 0))
const meetsMinOrder = computed(() => {
  if (form.order_type !== 'delivery' || minDeliveryOrder.value <= 0) return true
  return subtotal.value >= minDeliveryOrder.value
})

const busy = ref(false)
const error = ref('')
const success = ref<number | null>(null)

function formatMoney(amount: number) {
  return `${currencySymbol.value}${Number(amount || 0).toFixed(2)}`
}

async function submit() {
  const isGuestAllowed = settings.value?.guest_checkout_enabled !== false
  if (!api.authenticated.value && !isGuestAllowed) {
    return navigateTo('/login?redirect=/checkout')
  }

  if (form.order_type === 'delivery' && !meetsMinOrder.value) {
    error.value = `Minimum order amount for delivery is ${formatMoney(minDeliveryOrder.value)}.`
    return
  }

  busy.value = true
  error.value = ''

  const body: any = {
    location_id: form.location_id,
    order_type: form.order_type,
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email || undefined,
    telephone: form.telephone,
    payment_method: form.payment_method,
    tip_amount: tipAmount.value,
    comment: form.comment || undefined,
    items: cart.lines.value.map(line => ({
      menu_id: line.id,
      quantity: line.quantity,
      options: line.selected_options || [],
    })),
  }

  if (form.order_type === 'delivery') {
    body.address = {
      address_1: form.address_1,
      city: form.city,
      postcode: form.postcode,
      country_id: bootstrapData.value?.defaults?.country_id || 1,
    }
  }

  try {
    const result = await api.request<any>('/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': generateUUID() },
      body,
    })
    success.value = result.data.id
    cart.clear()
  } catch (reason: any) {
    error.value = reason?.data?.message || reason?.message || 'Your order could not be placed.'
  } finally {
    busy.value = false
  }
}

useSeoMeta({
  title: () => `Checkout — ${bootstrapData.value?.brand?.identity?.name || 'Store'}`,
  robots: 'noindex,nofollow',
})
</script>

<template>
  <div class="page section">
    <div class="container">
      <div v-if="success" class="content-state success-state" role="status">
        <i class="ri-checkbox-circle-line" />
        <h1>Order Confirmed!</h1>
        <p>Thank you! Your order number is <strong>#{{ success }}</strong>.</p>
        <NuxtLink class="btn primary" to="/account">
          Track Your Order
        </NuxtLink>
      </div>

      <div v-else class="checkout-layout">
        <section>
          <span class="section-kicker">Secure Checkout</span>
          <h1>Complete Your Order</h1>
          <p v-if="error" class="notice error" role="alert">
            {{ error }}
          </p>

          <form class="card form-grid" @submit.prevent="submit">
            <!-- 1. Fulfillment Location -->
            <label class="full">
              <span>Select Location</span>
              <select v-model.number="form.location_id" required>
                <option :value="0" disabled>Select a location</option>
                <option
                  v-for="loc in locations?.data"
                  :key="loc.id"
                  :value="loc.id"
                >
                  {{ loc.name }} — {{ loc.address }}
                </option>
              </select>
            </label>

            <!-- 2. Order Type -->
            <fieldset class="full">
              <legend>Fulfillment Method</legend>
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                <label class="radio">
                  <input
                    v-model="form.order_type"
                    type="radio"
                    value="collection"
                  > Pickup / Collection
                </label>
                <label class="radio">
                  <input
                    v-model="form.order_type"
                    type="radio"
                    value="delivery"
                    :disabled="selectedLocation?.offer_delivery === false"
                  > Home Delivery
                  <small v-if="selectedLocation?.delivery_charge"> (+{{ formatMoney(selectedLocation.delivery_charge) }})</small>
                </label>
              </div>
              <small v-if="form.order_type === 'delivery' && minDeliveryOrder > 0" style="display: block; margin-top: 0.4rem; color: #746a62;">
                Minimum delivery order: {{ formatMoney(minDeliveryOrder) }}
              </small>
            </fieldset>

            <!-- 3. Customer Info -->
            <label>
              <span>First Name</span>
              <input v-model="form.first_name" required>
            </label>
            <label>
              <span>Last Name</span>
              <input v-model="form.last_name" required>
            </label>
            <label class="full">
              <span>Email Address</span>
              <input v-model="form.email" type="email" :required="!api.authenticated.value">
            </label>
            <label class="full">
              <span>Telephone Number</span>
              <input v-model="form.telephone" type="tel" required>
            </label>

            <!-- 4. Delivery Address -->
            <template v-if="form.order_type === 'delivery'">
              <label class="full">
                <span>Street Address</span>
                <input v-model="form.address_1" required>
              </label>
              <label>
                <span>City</span>
                <input v-model="form.city" required>
              </label>
              <label>
                <span>Postal / Zip Code</span>
                <input v-model="form.postcode" required>
              </label>
            </template>

            <!-- 5. Payment Gateway Selection -->
            <fieldset class="full">
              <legend>Payment Method</legend>
              <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.5rem;">
                <label
                  v-for="method in paymentMethods"
                  :key="method.code"
                  class="radio"
                  style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"
                >
                  <input
                    v-model="form.payment_method"
                    type="radio"
                    :value="method.code"
                  >
                  <div>
                    <strong>{{ method.name }}</strong>
                    <small v-if="method.instructions" style="display: block; color: #746a62;">{{ method.instructions }}</small>
                  </div>
                </label>
              </div>
            </fieldset>

            <!-- 6. Tipping (if enabled in Vondo Control) -->
            <fieldset v-if="settings?.tipping_enabled" class="full">
              <legend>Tip the Kitchen Staff</legend>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
                <button
                  type="button"
                  :class="['btn', form.tip_percent === 0 && !form.custom_tip ? 'primary' : 'outline']"
                  style="padding: 0.4rem 0.8rem; font-size: 0.85rem;"
                  @click="form.tip_percent = 0; form.custom_tip = 0;"
                >
                  No Tip
                </button>
                <button
                  v-for="preset in (settings.tip_presets || [10, 15, 20])"
                  :key="preset"
                  type="button"
                  :class="['btn', form.tip_percent === preset ? 'primary' : 'outline']"
                  style="padding: 0.4rem 0.8rem; font-size: 0.85rem;"
                  @click="form.tip_percent = preset; form.custom_tip = 0;"
                >
                  {{ preset }}% ({{ formatMoney(subtotal * (preset / 100)) }})
                </button>
              </div>
            </fieldset>

            <!-- 7. Order Notes -->
            <label class="full">
              <span>Kitchen & Delivery Notes</span>
              <textarea v-model="form.comment" rows="3" maxlength="500" placeholder="Any dietary preferences or delivery instructions..." />
            </label>

            <button
              class="btn primary full"
              :disabled="busy || !cart.lines.value.length || !meetsMinOrder"
            >
              {{ busy ? 'Placing order…' : `Pay ${formatMoney(totalAmount)} • Complete Order` }}
            </button>
          </form>
        </section>

        <!-- Order Summary Sidebar -->
        <aside class="card order-summary">
          <h2>Your Order</h2>
          <p v-if="!cart.lines.value.length">
            Your cart is empty. <NuxtLink to="/menu">Browse the menu</NuxtLink>.
          </p>

          <div
            v-for="line in cart.lines.value"
            :key="line.id"
            class="summary-line"
          >
            <div>
              <strong>{{ line.name }}</strong>
              <small>Qty {{ line.quantity }} • {{ formatMoney(line.price * line.quantity) }}</small>
            </div>
            <button aria-label="Remove item" class="icon-btn" @click="cart.remove(line.id)">
              ×
            </button>
          </div>

          <div style="margin-top: 1.5rem; border-top: 1px solid #eadfd4; padding-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
              <span>Items Subtotal</span>
              <strong>{{ formatMoney(subtotal) }}</strong>
            </div>

            <div v-if="form.order_type === 'delivery'" style="display: flex; justify-content: space-between; font-size: 0.95rem;">
              <span>Delivery Fee</span>
              <strong>{{ deliveryFee > 0 ? formatMoney(deliveryFee) : 'Free' }}</strong>
            </div>

            <div v-if="taxRate > 0" style="display: flex; justify-content: space-between; font-size: 0.95rem; color: #746a62;">
              <span>Sales Tax ({{ taxRate }}%)</span>
              <strong>{{ formatMoney(taxAmount) }}</strong>
            </div>

            <div v-if="tipAmount > 0" style="display: flex; justify-content: space-between; font-size: 0.95rem; color: #2e7d32;">
              <span>Staff Tip</span>
              <strong>{{ formatMoney(tipAmount) }}</strong>
            </div>

            <div class="summary-total" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 2px solid #29231f;">
              <span>Total Payable</span>
              <strong>{{ formatMoney(totalAmount) }}</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
const route = useRoute()
const tenant = useActiveTenant()
const api = useStorefrontApi()
const order = ref<any>(null)
const loading = ref(true)
const error = ref('')
const cancelling = ref(false)
const review = reactive({ rating: 5, comment: '' })
const reviewMessage = ref('')
let poll: ReturnType<typeof setInterval> | undefined

const money = (amount: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: tenant.value?.currency?.code || 'CHF' }).format(amount || 0)
async function load() {
  if (!api.authenticated.value) return navigateTo(`/login?redirect=/orders/${route.params.id}`)
  loading.value = true
  try { order.value = (await api.request<any>(`/orders/${route.params.id}`)).data; error.value = '' }
  catch (reason: any) { error.value = reason?.data?.message || reason?.message || 'We could not load this order.' }
  finally { loading.value = false }
}
async function cancel() {
  cancelling.value = true
  try { order.value = (await api.request<any>(`/orders/${route.params.id}/cancel`, { method: 'POST' })).data }
  catch (reason: any) { error.value = reason?.data?.message || reason?.message || 'This order could not be cancelled.' }
  finally { cancelling.value = false }
}
async function submitReview() {
  try { await api.request(`/orders/${route.params.id}/review`, { method: 'POST', body: review }); reviewMessage.value = 'Thanks for your review.' }
  catch (reason: any) { reviewMessage.value = reason?.data?.message || reason?.message || 'Your review could not be saved.' }
}
onMounted(async () => { await load(); poll = setInterval(() => { if (order.value && !order.value.cancelled_at) load() }, 15000) })
onBeforeUnmount(() => { if (poll) clearInterval(poll) })
useSeoMeta({ title: () => order.value ? `${order.value.number} — order tracking` : 'Order tracking', robots: 'noindex,nofollow' })
</script>

<template>
  <div class="page section"><div class="container narrow-content">
    <AsyncState :loading="loading" :error="error" :empty="!order" empty-title="Order not found" @retry="load">
      <template v-if="order">
        <NuxtLink to="/account">← Back to your account</NuxtLink>
        <section class="card order-tracking"><div class="section-headline"><div><span class="section-kicker">Order tracking</span><h1>{{ order.number }}</h1><p>{{ order.location }} · {{ order.type }}</p></div><span class="status-pill" :style="{ background: order.status.color || '#222' }">{{ order.status.name }}</span></div>
          <p><strong>Payment:</strong> {{ order.payment_state === 'paid' ? 'Paid' : order.payment_state === 'pending' ? 'Payment pending' : 'Pay at restaurant' }}</p>
          <ol class="order-timeline"><li v-for="entry in order.timeline" :key="`${entry.status}-${entry.created_at}`"><strong>{{ entry.status }}</strong><span>{{ entry.comment }}</span><time>{{ entry.created_at ? new Date(entry.created_at).toLocaleString() : '' }}</time></li></ol>
          <p v-if="order.cancelled_at" class="notice error">Cancelled {{ new Date(order.cancelled_at).toLocaleString() }}<span v-if="order.cancel_reason"> — {{ order.cancel_reason }}</span></p>
          <button v-else class="btn outline" type="button" :disabled="cancelling" @click="cancel">{{ cancelling ? 'Cancelling…' : 'Cancel order' }}</button>
        </section>
        <section class="card"><h2>Receipt</h2><div class="timeline-list"><article v-for="item in order.items" :key="item.name"><div><strong>{{ item.quantity }} × {{ item.name }}</strong><small v-for="option in item.options" :key="option.name">{{ option.quantity }} × {{ option.name }}</small></div><span>{{ money(item.price * item.quantity) }}</span></article></div><div class="summary-total"><span>Total</span><strong>{{ money(order.total) }}</strong></div></section>
        <form v-if="!order.cancelled_at" class="card form-grid" @submit.prevent="submitReview"><h2 class="full">Rate this order</h2><label><span>Rating</span><select v-model.number="review.rating"><option v-for="rating in [5,4,3,2,1]" :key="rating" :value="rating">{{ rating }} stars</option></select></label><label class="full"><span>Review</span><textarea v-model="review.comment" maxlength="500" rows="3" placeholder="Tell us about your order" /></label><p v-if="reviewMessage" class="full notice">{{ reviewMessage }}</p><button class="btn primary" type="submit">Send review</button></form>
      </template>
    </AsyncState>
  </div></div>
</template>

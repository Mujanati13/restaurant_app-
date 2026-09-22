<script setup lang="ts">
import type { MenuDetail } from '~/types/storefront'

const route = useRoute()
const tenant = useActiveTenant()
const cart = useTenantCart()
const headers = useStorefrontHeaders()
const { data, error, status, refresh } = await useFetch<{ data: MenuDetail }>(`/api/v1/storefront/menus/${route.params.id}`, { headers })
const selected = reactive<Record<number, Record<number, number>>>({})
const note = ref('')
const choiceError = ref('')
const api = useStorefrontApi()
const isFavorite = ref(false)
const favoriteBusy = ref(false)

function toggle(option: MenuDetail['options'][number], value: MenuDetail['options'][number]['values'][number], checked: boolean) {
  const choices = selected[option.id] ||= {}
  if (option.display_type === 'radio') selected[option.id] = checked ? { [value.id]: 1 } : {}
  else if (checked) choices[value.id] = 1
  else delete choices[value.id]
}
function quantity(option: MenuDetail['options'][number], value: MenuDetail['options'][number]['values'][number], amount: number) {
  const choices = selected[option.id] ||= {}
  if (amount > 0) choices[value.id] = amount
  else delete choices[value.id]
}
function addConfigured() {
  const item = data.value?.data
  if (!item) return
  choiceError.value = ''
  for (const option of item.options || []) {
    const total = Object.values(selected[option.id] || {}).reduce((sum, value) => sum + value, 0)
    if (option.required && total === 0) return void (choiceError.value = `${option.name} is required.`)
    if (option.min_selected && total < option.min_selected) return void (choiceError.value = `Choose at least ${option.min_selected} for ${option.name}.`)
    if (option.max_selected && total > option.max_selected) return void (choiceError.value = `Choose at most ${option.max_selected} for ${option.name}.`)
  }
  const options = Object.entries(selected).map(([optionId, values]) => ({
    option_id: Number(optionId),
    values: Object.entries(values).map(([valueId, quantity]) => {
      const value = item.options.find(option => option.id === Number(optionId))?.values.find(candidate => candidate.id === Number(valueId))
      return { value_id: Number(valueId), quantity, price: value?.price || 0, name: value?.name }
    }),
  })).filter(option => option.values.length)
  cart.add(item, options, note.value.trim())
  navigateTo('/checkout')
}
async function toggleFavorite() {
  if (!api.authenticated.value) return navigateTo(`/login?redirect=/menu/${route.params.id}`)
  favoriteBusy.value = true
  try {
    await api.request(isFavorite.value ? `/favorites/${route.params.id}` : `/favorites/${route.params.id}`, { method: isFavorite.value ? 'DELETE' : 'POST' })
    isFavorite.value = !isFavorite.value
  } finally { favoriteBusy.value = false }
}
onMounted(async () => {
  if (!api.authenticated.value) return
  try { isFavorite.value = (await api.request<{ data: number[] }>('/favorites')).data.includes(Number(route.params.id)) } catch { /* Favorites remain optional when offline. */ }
})
useSeoMeta({ title: () => data.value?.data ? `${data.value.data.name} — ${tenant.value?.brand?.identity?.name || 'Menu'}` : 'Menu item' })
</script>

<template>
  <div class="page section"><div class="container">
    <AsyncState :loading="status === 'pending'" :error="error?.message" :empty="!data?.data" @retry="refresh">
      <article v-if="data?.data" class="menu-detail">
        <div class="menu-detail-image"><img v-if="data.data.image" :src="data.data.image" :alt="data.data.name"><i v-else class="ri-restaurant-2-line" /></div>
        <div class="menu-detail-content">
          <NuxtLink to="/menu">← Back to menu</NuxtLink><h1>{{ data.data.name }}</h1><p>{{ data.data.description }}</p><button class="btn outline" type="button" :disabled="favoriteBusy" @click="toggleFavorite"><i :class="isFavorite ? 'ri-heart-fill' : 'ri-heart-line'" /> {{ isFavorite ? 'Saved' : 'Save favourite' }}</button>
          <strong class="detail-price">{{ new Intl.NumberFormat(undefined, { style: 'currency', currency: tenant?.currency?.code || 'CHF' }).format(data.data.price) }}</strong>
          <section v-for="option in data.data.options" :key="option.id" class="option-group">
            <h2>{{ option.name }} <small>{{ option.required ? 'Required' : 'Optional' }}</small></h2>
            <div v-for="value in option.values" :key="value.id" class="option-row">
              <label v-if="option.display_type !== 'quantity'"><input :type="option.display_type === 'radio' ? 'radio' : 'checkbox'" :name="`option-${option.id}`" @change="toggle(option, value, ($event.target as HTMLInputElement).checked)"> <span>{{ value.name }}</span></label>
              <label v-else><span>{{ value.name }}</span><input class="quantity-input" type="number" min="0" :max="option.max_selected || 50" value="0" @input="quantity(option, value, Number(($event.target as HTMLInputElement).value))"></label>
              <span v-if="value.price">+{{ new Intl.NumberFormat(undefined, { style: 'currency', currency: tenant?.currency?.code || 'CHF' }).format(value.price) }}</span>
            </div>
          </section>
          <label class="option-group"><h2>Special instructions <small>Optional</small></h2><textarea v-model="note" maxlength="300" rows="3" placeholder="Allergies, preparation or delivery notes" /></label>
          <p v-if="choiceError" class="notice error" role="alert">{{ choiceError }}</p><button class="btn primary" type="button" @click="addConfigured">Add to cart</button>
        </div>
      </article>
    </AsyncState>
  </div></div>
</template>

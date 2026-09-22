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

const selectedOptionsPrice = computed(() => {
  const item = data.value?.data
  if (!item) return 0
  return (item.options || []).reduce((total, option) => total + option.values.reduce((optionTotal, value) => {
    return optionTotal + ((selected[option.id]?.[value.id] || 0) * Number(value.price || 0))
  }, 0), 0)
})
const configuredPrice = computed(() => Number(data.value?.data.price || 0) + selectedOptionsPrice.value)
const formatPrice = (value: number) => new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: tenant.value?.currency?.code || 'CHF',
}).format(value)
const selectionHint = (option: MenuDetail['options'][number]) => {
  if (option.max_selected && option.min_selected) return `Choose ${option.min_selected}–${option.max_selected}`
  if (option.max_selected) return `Choose up to ${option.max_selected}`
  return option.required ? 'Choose one' : 'Choose any that you like'
}

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
  <div class="page section menu-detail-page"><div class="container">
    <AsyncState :loading="status === 'pending'" :error="error?.message" :empty="!data?.data" @retry="refresh">
      <article v-if="data?.data" class="menu-detail">
        <div class="menu-detail-media">
          <div class="menu-detail-image"><img v-if="data.data.image" :src="data.data.image" :alt="data.data.name"><i v-else class="ri-restaurant-2-line" /></div>
          <p class="image-caption"><i class="ri-restaurant-2-line" /> Prepared fresh by this restaurant</p>
        </div>
        <div class="menu-detail-content">
          <div class="detail-top-row">
            <NuxtLink class="back-to-menu" to="/menu"><i class="ri-arrow-left-line" /> Back to menu</NuxtLink>
            <button class="favorite-button" type="button" :disabled="favoriteBusy" :aria-label="isFavorite ? 'Remove from favourites' : 'Save favourite'" @click="toggleFavorite"><i :class="isFavorite ? 'ri-heart-fill' : 'ri-heart-line'" /><span>{{ isFavorite ? 'Saved' : 'Save' }}</span></button>
          </div>
          <span class="menu-item-kicker">Made to order</span>
          <h1>{{ data.data.name }}</h1>
          <p class="menu-detail-description">{{ data.data.description }}</p>
          <div class="price-summary"><span>Starting at</span><strong class="detail-price">{{ formatPrice(data.data.price) }}</strong></div>
          <section v-for="option in data.data.options" :key="option.id" class="option-group">
            <div class="option-group-heading"><div><h2>{{ option.name }} <small :class="{ required: option.required }">{{ option.required ? 'Required' : 'Optional' }}</small></h2><p>{{ selectionHint(option) }}</p></div></div>
            <div v-for="value in option.values" :key="value.id" class="option-row" :class="{ selected: selected[option.id]?.[value.id] }">
              <label v-if="option.display_type !== 'quantity'"><input :type="option.display_type === 'radio' ? 'radio' : 'checkbox'" :name="`option-${option.id}`" @change="toggle(option, value, ($event.target as HTMLInputElement).checked)"> <span>{{ value.name }}</span></label>
              <label v-else><span>{{ value.name }}</span><input class="quantity-input" type="number" min="0" :max="option.max_selected || 50" value="0" @input="quantity(option, value, Number(($event.target as HTMLInputElement).value))"></label>
              <span v-if="value.price" class="option-price">+{{ formatPrice(value.price) }}</span>
            </div>
          </section>
          <label class="option-group special-instructions"><div class="option-group-heading"><div><h2>Special instructions <small>Optional</small></h2><p>Let the kitchen know about preferences or allergies.</p></div><span>{{ note.length }}/300</span></div><textarea v-model="note" maxlength="300" rows="3" placeholder="e.g. no onions, sauce on the side" /></label>
          <p v-if="choiceError" class="notice error" role="alert">{{ choiceError }}</p>
          <div class="add-to-cart-bar"><div><span>Total</span><strong>{{ formatPrice(configuredPrice) }}</strong></div><button class="btn primary add-to-cart-button" type="button" @click="addConfigured"><i class="ri-shopping-bag-3-line" /> Add to cart</button></div>
        </div>
      </article>
    </AsyncState>
  </div></div>
</template>

<style scoped>
.menu-detail-page {
  min-height: calc(100vh - 140px);
  padding-top: clamp(2rem, 5vw, 4.5rem);
  background: linear-gradient(180deg, #fffaf6 0%, #ffffff 34rem);
}

.menu-detail {
  grid-template-columns: minmax(300px, 0.84fr) minmax(0, 1.16fr);
  gap: clamp(1.5rem, 4vw, 3.5rem);
  padding: clamp(1rem, 3vw, 1.5rem);
  border-color: #e9e4de;
  border-radius: 22px;
  box-shadow: 0 20px 50px rgba(52, 42, 33, 0.09);
}

.menu-detail-media {
  position: sticky;
  top: 1.5rem;
}

.menu-detail-image {
  min-height: 420px;
  border-radius: 16px;
  background: #eef8f0;
  color: var(--brand-primary, #06c167);
}

.image-caption {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0.75rem 0 0;
  color: #637168;
  font-size: 0.8rem;
  font-weight: 600;
}

.image-caption i {
  color: var(--brand-primary, #06c167);
}

.menu-detail-content {
  padding: clamp(0.4rem, 1.5vw, 1rem) clamp(0.25rem, 1vw, 0.75rem) 0;
}

.detail-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.6rem;
}

.back-to-menu,
.favorite-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 0;
  background: transparent;
  color: #3e3832;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
}

.back-to-menu:hover {
  color: var(--brand-primary, #06c167);
}

.favorite-button {
  padding: 0.5rem 0.7rem;
  border: 1px solid #e4dfd9;
  border-radius: 999px;
  cursor: pointer;
}

.favorite-button:hover:not(:disabled) {
  border-color: var(--brand-primary, #06c167);
  color: var(--brand-primary, #06c167);
}

.favorite-button i {
  font-size: 1rem;
}

.menu-item-kicker {
  display: inline-block;
  margin-bottom: 0.35rem;
  color: var(--brand-primary, #06c167);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.menu-detail h1 {
  margin: 0 0 0.65rem;
  font-size: clamp(2.1rem, 4vw, 3.3rem);
}

.menu-detail-description {
  max-width: 42rem;
  margin-bottom: 1.1rem !important;
}

.price-summary {
  display: inline-flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-bottom: 0.25rem;
}

.price-summary > span,
.add-to-cart-bar span {
  color: #786f66;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.detail-price {
  margin: 0;
  color: var(--brand-primary, #06c167);
  font-size: 1.75rem;
}

.option-group {
  margin: 1.25rem 0;
  padding-top: 1.25rem;
}

.option-group-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.option-group h2 {
  margin: 0 0 0.2rem;
}

.option-group-heading p {
  margin: 0;
  color: #766d64;
  font-size: 0.82rem;
  line-height: 1.4;
}

.option-group h2 small.required {
  background: #e4f8eb;
  color: #078b4b;
}

.option-row {
  min-height: 54px;
  margin-bottom: 0.45rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 10px;
  background: #fbfaf9;
  transition: border-color 0.15s, background-color 0.15s;
}

.option-row:hover {
  background: #f7f5f2;
}

.option-row.selected {
  border-color: color-mix(in srgb, var(--brand-primary, #06c167) 50%, transparent);
  background: color-mix(in srgb, var(--brand-primary, #06c167) 7%, #ffffff);
}

.option-row input:not(.quantity-input) {
  accent-color: var(--brand-primary, #06c167);
}

.option-price {
  color: #39332d;
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
}

.special-instructions textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid #dfdad4;
  border-radius: 10px;
  padding: 0.75rem;
  color: #2d2925;
  font: inherit;
  line-height: 1.45;
}

.special-instructions textarea:focus {
  border-color: var(--brand-primary, #06c167);
  outline: 3px solid color-mix(in srgb, var(--brand-primary, #06c167) 18%, transparent);
}

.add-to-cart-bar {
  position: sticky;
  bottom: 1rem;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 0.85rem 1rem;
  border: 1px solid #e2ddd7;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 26px rgba(55, 45, 36, 0.12);
  backdrop-filter: blur(10px);
}

.add-to-cart-bar > div {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.add-to-cart-bar strong {
  color: #25211d;
  font-size: 1.25rem;
}

.add-to-cart-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 46px;
  padding-inline: 1.2rem;
}

@media (max-width: 900px) {
  .menu-detail-media {
    position: static;
  }
  .menu-detail-image {
    min-height: 300px;
  }
}

@media (max-width: 560px) {
  .menu-detail-page {
    padding-top: 1rem;
  }
  .menu-detail {
    margin-inline: -0.15rem;
    border-radius: 14px;
    padding: 0.75rem;
  }
  .menu-detail-image {
    min-height: 260px;
  }
  .detail-top-row {
    margin-bottom: 1.25rem;
  }
  .add-to-cart-bar {
    bottom: 0.5rem;
  }
  .add-to-cart-button {
    flex: 1;
  }
}
</style>

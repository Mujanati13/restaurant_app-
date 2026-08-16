<script setup lang="ts">
const route = useRoute(); const tenant = useNuxtData<any>('tenant-bootstrap'); const cart = useTenantCart()
const headers = import.meta.server ? useRequestHeaders(['host', 'x-forwarded-host', 'x-forwarded-proto']) : undefined
const { data, error, status, refresh } = await useFetch<any>(`/api/v1/storefront/menus/${route.params.id}`, { headers })
const selected = reactive<Record<number, Record<number, number>>>({})
const choiceError = ref('')
function toggle(option: any, value: any, checked: boolean) {
  const choices = selected[option.id] ||= {}
  if (option.display_type === 'radio') selected[option.id] = checked ? { [value.id]: 1 } : {}
  else if (checked) choices[value.id] = 1; else delete choices[value.id]
}
function quantity(option: any, value: any, amount: number) { const choices = selected[option.id] ||= {}; if (amount > 0) choices[value.id] = amount; else delete choices[value.id] }
function addConfigured() {
  choiceError.value = ''
  for (const option of data.value.data.options || []) {
    const total = Object.values(selected[option.id] || {}).reduce((sum, value) => sum + value, 0)
    if (option.required && total === 0) return choiceError.value = `${option.name} is required.`
    if (option.min_selected && total < option.min_selected) return choiceError.value = `Choose at least ${option.min_selected} for ${option.name}.`
    if (option.max_selected && total > option.max_selected) return choiceError.value = `Choose at most ${option.max_selected} for ${option.name}.`
  }
  const options = Object.entries(selected).map(([optionId, values]) => ({ option_id: Number(optionId), values: Object.entries(values).map(([valueId, qty]) => ({ value_id: Number(valueId), quantity: qty })) })).filter(item => item.values.length)
  cart.add(data.value.data, options)
  navigateTo('/checkout')
}
useSeoMeta({ title: () => data.value?.data ? `${data.value.data.name} — ${tenant.data.value.data.brand.identity.name}` : 'Menu item' })
</script>
<template><div class="page section"><div class="container"><AsyncState :loading="status === 'pending'" :error="error?.message" :empty="!data?.data" @retry="refresh"><article v-if="data?.data" class="menu-detail"><div class="menu-detail-image"><img v-if="data.data.image" :src="data.data.image" :alt="data.data.name"><i v-else class="ri-restaurant-2-line"/></div><div><NuxtLink to="/menu">← Back to menu</NuxtLink><h1>{{ data.data.name }}</h1><p>{{ data.data.description }}</p><strong class="detail-price">{{ new Intl.NumberFormat(undefined, { style: 'currency', currency: tenant.data.value.data.currency.code }).format(data.data.price) }}</strong><div v-for="option in data.data.options" :key="option.id" class="option-group"><h2>{{ option.name }} <small>{{ option.required ? 'Required' : 'Optional' }}</small></h2><div v-for="value in option.values" :key="value.id" class="option-row"><label v-if="option.display_type !== 'quantity'"><input :type="option.display_type === 'radio' ? 'radio' : 'checkbox'" :name="`option-${option.id}`" @change="toggle(option, value, ($event.target as HTMLInputElement).checked)"> <span>{{ value.name }}</span></label><label v-else><span>{{ value.name }}</span><input class="quantity-input" type="number" min="0" :max="option.max_selected || 50" value="0" @input="quantity(option, value, Number(($event.target as HTMLInputElement).value))"></label><span v-if="value.price">+{{ new Intl.NumberFormat(undefined, { style: 'currency', currency: tenant.data.value.data.currency.code }).format(value.price) }}</span></div></div><p v-if="choiceError" class="notice error" role="alert">{{ choiceError }}</p><button class="btn primary" @click="addConfigured">Add to cart</button></div></article></AsyncState></div></div></template>

<script setup lang="ts">
import type { MenuItem, Category } from '~/types/storefront'
const route = useRoute(); const tenant = useActiveTenant(); const cart = useTenantCart()
const category = ref(String(route.query.category || '')); const search = ref('')
const query = computed(() => ({ limit: 100, ...(category.value ? { category_id: category.value } : {}), ...(search.value ? { search: search.value } : {}) }))
const headers = useStorefrontHeaders()
const { data, error, status, refresh } = await useFetch<{ data: MenuItem[] }>('/api/v1/storefront/menus', { query, headers, watch: [query] })
const { data: categories } = await useFetch<{ data: Category[] }>('/api/v1/storefront/categories?limit=100', { headers })
useSeoMeta({ title: () => `Menu — ${tenant.value?.brand?.identity?.name || 'Menu'}` })
</script>
<template><div class="page"><section class="page-hero"><div class="container"><span class="section-kicker">Made to order</span><h1>Our menu</h1><p>Fresh dishes from this restaurant’s current published catalog.</p></div></section><section class="section"><div class="container"><form class="catalog-tools" @submit.prevent><label><span>Search menu</span><input v-model.trim="search" type="search" placeholder="Search dishes"></label><label><span>Category</span><select v-model="category"><option value="">All categories</option><option v-for="item in categories?.data" :key="item.id" :value="item.id">{{ item.name }}</option></select></label></form><AsyncState :loading="status === 'pending'" :error="error?.message" :empty="!data?.data?.length" empty-title="No dishes found" empty-text="Try another search or category." @retry="refresh"><div class="home-menu-grid"><MenuCard v-for="item in data?.data" :key="item.id" :item="item" :currency="tenant?.currency?.code || 'USD'" @add="cart.add" /></div></AsyncState></div></section></div></template>

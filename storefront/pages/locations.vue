<script setup lang="ts">
import type { Location } from '~/types/storefront'
const tenant = useNuxtData<any>('tenant-bootstrap')
const headers = import.meta.server ? useRequestHeaders(['host', 'x-forwarded-host', 'x-forwarded-proto']) : undefined
const { data, error, status, refresh } = await useFetch<{ data: Location[] }>('/api/v1/storefront/locations', { headers })
useSeoMeta({ title: () => `Locations — ${tenant.data.value.data.brand.identity.name}` })
</script>
<template><div class="page"><section class="page-hero"><div class="container"><span class="section-kicker">Visit us</span><h1>Our locations</h1><p>Choose the restaurant branch that works best for you.</p></div></section><section class="section"><div class="container"><AsyncState :loading="status === 'pending'" :error="error?.message" :empty="!data?.data?.length" empty-title="No active locations" @retry="refresh"><div class="locations-grid"><article v-for="location in data?.data" :key="location.id" class="card location-card"><div class="location-image"><img v-if="location.image" :src="location.image" :alt="location.name"><i v-else class="ri-map-pin-2-line"/></div><h2>{{ location.name }}</h2><address>{{ location.address || 'Address available soon' }}</address><a v-if="location.phone" :href="`tel:${location.phone}`">{{ location.phone }}</a><a v-if="location.email" :href="`mailto:${location.email}`">{{ location.email }}</a><NuxtLink class="btn" :to="`/reservations?location=${location.id}`">Reserve here</NuxtLink></article></div></AsyncState></div></section></div></template>

<script setup lang="ts">
import { useIsMarketplace, useTenant } from '~/composables/useTenant'

const isMarketplace = useIsMarketplace()
const { data: bootstrap, status, error, refresh } = await useTenant()
const route = useRoute()
const tenant = computed(() => bootstrap.value?.data)
const theme = computed(() => tenant.value?.brand.theme || {})

const rootStyle = computed(() => {
  if (isMarketplace.value) {
    return {
      '--brand-primary': '#c95028',
      '--brand-secondary': '#29231f',
      '--brand-accent': '#e06336',
      '--bg-primary': '#fbf8f3',
      '--bg-card': '#ffffff',
      '--text-primary': '#29231f',
      '--radius-md': '16px',
    }
  }
  return {
    '--brand-primary': theme.value.primary || '#c95028',
    '--brand-secondary': theme.value.secondary || '#29231f',
    '--brand-accent': theme.value.accent || '#f6a623',
    '--bg-primary': theme.value.background || '#fffaf6',
    '--bg-card': theme.value.surface || '#ffffff',
    '--text-primary': theme.value.text || '#29231f',
    '--radius-md': `${theme.value.radius || 16}px`,
  }
})

const requestUrl = useRequestURL()
const canonical = computed(() => `${requestUrl.protocol}//${requestUrl.host}${route.path === '/' ? '/' : route.path.replace(/\/$/, '')}`)

const title = computed(() => {
  if (isMarketplace.value) {
    return 'Deliveriano — Discover & Order From Nearby Restaurants in Switzerland'
  }
  return tenant.value ? `${tenant.value.brand.identity.name} — Order & Reserve` : 'Restaurant unavailable'
})

const description = computed(() => {
  if (isMarketplace.value) {
    return 'Find independent artisanal pizzerias, sushi bars, and local restaurants near you. Fast delivery and takeaway across Switzerland.'
  }
  return tenant.value?.brand.identity.tagline || 'Order fresh food or make a reservation online.'
})

const socialImage = computed(() => {
  if (isMarketplace.value) return undefined
  return tenant.value?.brand.content.hero_image_url || tenant.value?.brand.identity.logo_url || undefined
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: socialImage,
  ogUrl: canonical,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: socialImage,
})

useHead({
  link: [
    { rel: 'canonical', href: canonical },
    { rel: 'manifest', href: '/manifest.webmanifest' },
  ],
  meta: [
    { name: 'theme-color', content: () => String(isMarketplace.value ? '#c95028' : (theme.value.primary || '#c95028')) },
  ],
})
</script>

<template>
  <div :style="rootStyle" class="nuxt-storefront">
    <!-- Marketplace Experience -->
    <template v-if="isMarketplace">
      <NuxtLayout name="marketplace">
        <NuxtPage />
      </NuxtLayout>
    </template>

    <!-- Restaurant Tenant Experience -->
    <template v-else>
      <div v-if="status === 'pending'" class="page-state" role="status">
        <span class="spinner" />
        <p>Preparing this restaurant…</p>
      </div>

      <main v-else-if="error || !tenant" id="main-content" class="page-state boot-error">
        <span class="state-icon" aria-hidden="true">!</span>
        <h1>Restaurant unavailable</h1>
        <p>{{ error?.message || 'This restaurant could not be loaded.' }}</p>
        <button class="btn primary" @click="() => refresh()">Try again</button>
      </main>

      <NuxtLayout v-else name="restaurant">
        <NuxtPage />
      </NuxtLayout>
    </template>
  </div>
</template>

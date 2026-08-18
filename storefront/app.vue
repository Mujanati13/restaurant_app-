<script setup lang="ts">
const { data: bootstrap, status, error, refresh } = await useTenant()
const route = useRoute()
const tenant = computed(() => bootstrap.value?.data)
const theme = computed(() => tenant.value?.brand.theme || {})
const rootStyle = computed(() => ({
  '--brand-primary': theme.value.primary || '#c95028',
  '--brand-secondary': theme.value.secondary || '#29231f',
  '--brand-accent': theme.value.accent || '#f6a623',
  '--bg-primary': theme.value.background || '#fffaf6',
  '--bg-card': theme.value.surface || '#ffffff',
  '--text-primary': theme.value.text || '#29231f',
  '--radius-md': `${theme.value.radius || 16}px`,
}))
const requestUrl = useRequestURL()
const canonical = computed(() => `${requestUrl.protocol}//${requestUrl.host}${route.path === '/' ? '/' : route.path.replace(/\/$/, '')}`)
const description = computed(() => tenant.value?.brand.identity.tagline || 'Order fresh food or make a reservation online.')
const socialImage = computed(() => tenant.value?.brand.content.hero_image_url || tenant.value?.brand.identity.logo_url || undefined)

useSeoMeta({
  title: () => tenant.value ? `${tenant.value.brand.identity.name} — Order & Reserve` : 'Restaurant unavailable',
  description,
  ogTitle: () => tenant.value?.brand.identity.name,
  ogDescription: description,
  ogImage: socialImage,
  ogUrl: canonical,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => tenant.value?.brand.identity.name,
  twitterDescription: description,
  twitterImage: socialImage,
})

useHead({
  link: [
    { rel: 'canonical', href: canonical },
    { rel: 'manifest', href: '/manifest.webmanifest' },
  ],
  meta: [
    { name: 'theme-color', content: () => String(theme.value.primary || '#c95028') },
  ],
})

const cart = useTenantCart()
const mobileOpen = ref(false)
</script>

<template>
  <div :style="rootStyle" class="nuxt-storefront">
    <a class="skip-link" href="#main-content">Skip to content</a>

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

    <template v-else>
      <!-- Top Announcement / Kitchen Status Strip -->
      <div class="top-status-bar">
        <div class="container top-status-inner">
          <div class="status-left">
            <span class="online-pulse" />
            <span>Accepting Delivery & Dine-In Orders</span>
          </div>
          <div class="status-right">
            <span><i class="ri-map-pin-2-line" /> Multiple Pickup Locations</span>
            <span><i class="ri-phone-line" /> Direct Support</span>
          </div>
        </div>
      </div>

      <!-- Main Sticky Header -->
      <header class="site-header">
        <div class="container header-inner">
          <NuxtLink class="logo" to="/" :aria-label="`${tenant.brand.identity.name} home`">
            <img v-if="tenant.brand.identity.logo_url" :src="tenant.brand.identity.logo_url" alt="" width="44" height="44">
            <span v-else class="brand-glyph" aria-hidden="true">
              <i class="ri-restaurant-fill" />
            </span>
            <div class="brand-text">
              <strong class="brand-name">{{ tenant.brand.identity.name }}</strong>
              <small v-if="tenant.brand.identity.tagline" class="brand-sub">{{ tenant.brand.identity.tagline }}</small>
            </div>
          </NuxtLink>

          <button
            class="menu-toggle"
            type="button"
            :aria-expanded="mobileOpen"
            aria-controls="primary-navigation"
            @click="mobileOpen = !mobileOpen"
          >
            <span class="sr-only">Toggle navigation</span>
            <i :class="mobileOpen ? 'ri-close-line' : 'ri-menu-line'" />
          </button>

          <nav
            id="primary-navigation"
            :class="['primary-nav', { open: mobileOpen }]"
            aria-label="Primary navigation"
          >
            <NuxtLink
              v-for="item in tenant.brand.navigation"
              :key="item.href"
              :to="tenantHref(item.href)"
              @click="mobileOpen = false"
            >
              {{ item.label }}
            </NuxtLink>
            <NuxtLink to="/account" @click="mobileOpen = false">
              <i class="ri-user-3-line" /> Account
            </NuxtLink>
            <NuxtLink class="cart-link" to="/checkout" @click="mobileOpen = false">
              <i class="ri-shopping-bag-3-line" />
              <span>Cart</span>
              <span class="cart-count">{{ cart.count }}</span>
            </NuxtLink>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <NuxtPage />
      </main>

      <!-- Enhanced Multi-Column Footer -->
      <footer class="site-footer">
        <div class="container footer-content">
          <div class="footer-grid">
            <div class="footer-brand-col">
              <NuxtLink class="footer-logo" to="/">
                <span class="brand-glyph-sm" aria-hidden="true"><i class="ri-restaurant-fill" /></span>
                <strong class="footer-brand">{{ tenant.brand.identity.name }}</strong>
              </NuxtLink>
              <p class="footer-tagline">{{ tenant.brand.identity.tagline || 'Exquisite dining and freshly prepared culinary favourites.' }}</p>
              <p class="footer-copy-text">{{ tenant.brand.content.footer_text || `© ${new Date().getFullYear()} ${tenant.brand.identity.name}. All rights reserved.` }}</p>
            </div>

            <div class="footer-nav-col">
              <h4>Quick Links</h4>
              <nav aria-label="Footer navigation">
                <NuxtLink to="/">Home</NuxtLink>
                <NuxtLink to="/menu">Our Menu</NuxtLink>
                <NuxtLink to="/reservations">Reservations</NuxtLink>
                <NuxtLink to="/locations">Locations & Hours</NuxtLink>
                <NuxtLink to="/account">My Account</NuxtLink>
              </nav>
            </div>

            <div class="footer-info-col">
              <h4>Dining Experience</h4>
              <ul class="footer-info-list">
                <li><i class="ri-time-line" /> Mon–Sun: 10:00 AM – 11:00 PM</li>
                <li><i class="ri-e-bike-2-line" /> Fast Delivery & Collection</li>
                <li><i class="ri-shield-check-line" /> 100% Quality Guaranteed</li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom-bar">
            <p>© {{ new Date().getFullYear() }} {{ tenant.brand.identity.name }}. Handcrafted culinary excellence.</p>
            <div class="footer-links-inline">
              <NuxtLink to="/menu">Order Online</NuxtLink>
              <span>•</span>
              <NuxtLink to="/reservations">Reservations</NuxtLink>
            </div>
          </div>
        </div>
      </footer>
    </template>
  </div>
</template>

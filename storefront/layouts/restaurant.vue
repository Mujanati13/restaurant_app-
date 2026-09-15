<script setup lang="ts">
import { useActiveTenant, tenantHref } from '~/composables/useTenant'

const tenant = useActiveTenant()
const cart = useTenantCart()
const mobileOpen = ref(false)
const route = useRoute()
const orderContext = useCookie<{ location: number; orderType: string } | null>('deliveriano-order-' + (tenant.value?.restaurant.id || 'none'), { sameSite: 'lax', maxAge: 3600 })
watchEffect(() => {
  const location = Number(route.query.location)
  if (Number.isInteger(location) && location > 0 && ['delivery', 'collection'].includes(String(route.query.order_type))) {
    orderContext.value = { location, orderType: String(route.query.order_type) }
  }
})

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
</script>

<template>
  <div v-if="tenant" :style="rootStyle" class="nuxt-storefront restaurant-layout">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <!-- Top Announcement / Contact Strip -->
    <div class="top-status-bar">
      <div class="container top-status-inner">
        <div class="status-left">
          <span>{{ tenant.brand.identity.tagline || 'Welcome to our table' }}</span>
        </div>
        <div class="status-right">
          <span v-if="tenant.restaurant.address">
            <i class="ri-map-pin-2-line" /> {{ tenant.restaurant.address }}
          </span>
          <a v-if="tenant.restaurant.phone" :href="`tel:${tenant.restaurant.phone}`" style="color: inherit; text-decoration: none;">
            <i class="ri-phone-line" /> {{ tenant.restaurant.phone }}
          </a>
        </div>
      </div>
    </div>

    <!-- Main Sticky Restaurant Header -->
    <header class="site-header">
      <div class="container header-inner">
        <NuxtLink class="logo" :to="tenantHref('/')" :aria-label="`${tenant.brand.identity.name} home`">
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
          <NuxtLink :to="tenantHref('/account')" @click="mobileOpen = false">
            <i class="ri-user-3-line" /> Account
          </NuxtLink>
          <NuxtLink class="cart-link" :to="tenantHref('/checkout')" @click="mobileOpen = false">
            <i class="ri-shopping-bag-3-line" />
            <span>Cart</span>
            <span class="cart-count">{{ cart.count }}</span>
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main id="main-content">
      <slot />
    </main>

    <!-- Multi-Column Restaurant Footer -->
    <footer class="site-footer">
      <div class="container footer-content">
        <div class="footer-grid">
          <div class="footer-brand-col">
            <NuxtLink class="footer-logo" :to="tenantHref('/')">
              <span class="brand-glyph-sm" aria-hidden="true"><i class="ri-restaurant-fill" /></span>
              <strong class="footer-brand">{{ tenant.brand.identity.name }}</strong>
            </NuxtLink>
            <p class="footer-tagline">{{ tenant.brand.identity.tagline || 'Fresh culinary favourites prepared to order.' }}</p>

            <div v-if="tenant.settings?.social_links" style="display: flex; gap: 0.75rem; margin: 1rem 0;">
              <a v-if="tenant.settings.social_links.instagram" :href="tenant.settings.social_links.instagram" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style="color: inherit; font-size: 1.25rem;"><i class="ri-instagram-line" /></a>
              <a v-if="tenant.settings.social_links.facebook" :href="tenant.settings.social_links.facebook" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style="color: inherit; font-size: 1.25rem;"><i class="ri-facebook-box-line" /></a>
              <a v-if="tenant.settings.social_links.twitter" :href="tenant.settings.social_links.twitter" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" style="color: inherit; font-size: 1.25rem;"><i class="ri-twitter-x-line" /></a>
              <a v-if="tenant.settings.social_links.google_maps" :href="tenant.settings.social_links.google_maps" target="_blank" rel="noopener noreferrer" aria-label="Google Maps" style="color: inherit; font-size: 1.25rem;"><i class="ri-map-pin-line" /></a>
            </div>

            <p class="footer-copy-text">{{ tenant.brand.content.footer_text || `© ${new Date().getFullYear()} ${tenant.brand.identity.name}. All rights reserved.` }}</p>
          </div>

          <div class="footer-nav-col">
            <h4>Quick Links</h4>
            <nav aria-label="Footer navigation">
              <NuxtLink :to="tenantHref('/')">Home</NuxtLink>
              <NuxtLink :to="tenantHref('/menu')">Our Menu</NuxtLink>
              <NuxtLink :to="tenantHref('/reservations')">Reservations</NuxtLink>
              <NuxtLink :to="tenantHref('/locations')">Locations & Hours</NuxtLink>
              <NuxtLink :to="tenantHref('/account')">My Account</NuxtLink>
            </nav>
          </div>

          <div class="footer-info-col">
            <h4>Contact & Hours</h4>
            <ul class="footer-info-list">
              <li v-if="tenant.restaurant.phone"><i class="ri-phone-line" /> {{ tenant.restaurant.phone }}</li>
              <li v-if="tenant.restaurant.email"><i class="ri-mail-line" /> {{ tenant.restaurant.email }}</li>
              <li v-if="tenant.restaurant.address"><i class="ri-map-pin-line" /> {{ tenant.restaurant.address }}</li>
              <li><i class="ri-e-bike-2-line" /> Fresh Delivery & Collection</li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom-bar">
          <p>© {{ new Date().getFullYear() }} {{ tenant.brand.identity.name }}.</p>
          <div class="footer-links-inline">
            <NuxtLink :to="tenantHref('/menu')">Order Online</NuxtLink>
            <span>•</span>
            <NuxtLink :to="tenantHref('/reservations')">Reservations</NuxtLink>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

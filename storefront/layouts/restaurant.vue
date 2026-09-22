<script setup lang="ts">
import { useActiveTenant, tenantHref } from '~/composables/useTenant'

const tenant = useActiveTenant()
const cart = useTenantCart()
const mobileOpen = ref(false)
const cartOpen = ref(false)
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
          <button class="cart-link cart-button" type="button" :aria-expanded="cartOpen" aria-controls="cart-drawer" @click="cartOpen = true; mobileOpen = false">
            <i class="ri-shopping-bag-3-line" />
            <span>Cart</span>
            <span class="cart-count">{{ cart.count }}</span>
          </button>
        </nav>
      </div>
    </header>

    <main id="main-content">
      <slot />
    </main>

    <div v-if="cartOpen" class="cart-backdrop" @click.self="cartOpen = false">
      <aside id="cart-drawer" class="cart-drawer" role="dialog" aria-modal="true" aria-label="Your cart" tabindex="-1" @keydown.esc="cartOpen = false">
        <div class="cart-drawer-head"><h2>Your order</h2><button class="icon-btn" type="button" aria-label="Close cart" @click="cartOpen = false">×</button></div>
        <p v-if="!cart.lines.value.length">Your cart is empty. Add a dish to get started.</p>
        <div v-else class="cart-drawer-lines">
          <article v-for="line in cart.lines.value" :key="line.line_id">
            <div><strong>{{ line.name }}</strong><small v-if="line.note">{{ line.note }}</small><small>{{ line.quantity }} × {{ Number(line.price).toFixed(2) }}</small></div>
            <div class="cart-line-actions"><button type="button" aria-label="Decrease quantity" @click="cart.setQuantity(line.line_id, line.quantity - 1)">−</button><span>{{ line.quantity }}</span><button type="button" aria-label="Increase quantity" @click="cart.setQuantity(line.line_id, line.quantity + 1)">+</button></div>
          </article>
          <div class="cart-drawer-total"><strong>Subtotal</strong><strong>{{ tenant.currency.symbol }}{{ cart.subtotal.value.toFixed(2) }}</strong></div>
          <NuxtLink class="btn primary" :to="tenantHref('/checkout')" @click="cartOpen = false">Go to checkout</NuxtLink>
        </div>
      </aside>
    </div>

    <NuxtLink v-if="cart.count.value" class="mobile-cart-bar" :to="tenantHref('/checkout')">
      <span><i class="ri-shopping-bag-3-line" /> {{ cart.count.value }} item{{ cart.count.value === 1 ? '' : 's' }}</span>
      <strong>View cart</strong>
    </NuxtLink>

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

<style scoped>
.cart-button { border:0; cursor:pointer; font:inherit; }
.cart-backdrop { position:fixed; inset:0; z-index:100; background:rgba(0,0,0,.42); display:flex; justify-content:flex-end; }
.cart-drawer { width:min(420px,100%); height:100%; overflow:auto; padding:1.25rem; background:#fff; color:#1f1a17; box-shadow:-12px 0 32px rgba(0,0,0,.2); }
.cart-drawer-head,.cart-drawer-total,.cart-drawer-lines article,.cart-line-actions { display:flex; align-items:center; }
.cart-drawer-head,.cart-drawer-total { justify-content:space-between; gap:.75rem; }
.cart-drawer-head { border-bottom:1px solid #eee; padding-bottom:1rem; }
.cart-drawer-head h2 { margin:0; }
.cart-drawer-lines { display:grid; gap:.9rem; margin-top:1rem; }
.cart-drawer-lines article { justify-content:space-between; gap:1rem; border-bottom:1px solid #eee; padding-bottom:.85rem; }
.cart-drawer-lines small { display:block; color:#655d56; margin-top:.2rem; }
.cart-line-actions { gap:.55rem; }
.cart-line-actions button { width:2rem; height:2rem; border:1px solid #d9d4d0; border-radius:50%; background:#fff; font-size:1.1rem; cursor:pointer; }
.cart-drawer-total { padding-top:.4rem; font-size:1.05rem; }
.mobile-cart-bar { display:none; }
@media (max-width: 768px) {
  .mobile-cart-bar { position:fixed; z-index:60; right:1rem; bottom:1rem; left:1rem; display:flex; align-items:center; justify-content:space-between; padding:1rem 1.15rem; border-radius:14px; background:#000; color:#fff; box-shadow:0 12px 32px rgba(0,0,0,.28); font-weight:700; }
}
</style>

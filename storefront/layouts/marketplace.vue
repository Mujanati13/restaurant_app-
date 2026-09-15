<script setup lang="ts">
import { useDiscovery } from '~/composables/useDiscovery'
import AddressModal from '~/components/discovery/AddressModal.vue'

const { selectedAddress, isAddressModalOpen } = useDiscovery()
const portalUrl = useRuntimeConfig().public.ownerPortalUrl as string
const mobileNavOpen = ref(false)
</script>

<template>
  <div class="marketplace-layout">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <!-- Sticky Header -->
    <header class="marketplace-header">
      <div class="container header-inner">
        <!-- Logo -->
        <NuxtLink to="/" class="brand-logo" aria-label="Deliveriano Switzerland">
          <div class="logo-mark">
            <i class="ri-restaurant-fill" />
          </div>
          <span class="brand-text">
            <strong>Deliveriano</strong>
            <small>Switzerland</small>
          </span>
        </NuxtLink>

        <!-- Address Bar Pill (Quick change) -->
        <button
          type="button"
          class="header-address-pill"
          aria-label="Change delivery location"
          @click="isAddressModalOpen = true"
        >
          <i class="ri-map-pin-2-fill pill-pin" />
          <span class="pill-address">{{ selectedAddress || 'Choose your address' }}</span>
          <i class="ri-arrow-down-s-line pill-arrow" />
        </button>

        <!-- Right Actions -->
        <div class="header-actions"><a :href="portalUrl" class="header-link">For restaurants <i class="ri-arrow-right-up-line" /></a></div>
      </div>
    </header>

    <!-- Main Content -->
    <main id="main-content">
      <slot />
    </main>

    <!-- Marketplace Footer -->
    <footer class="marketplace-footer">
      <div class="container footer-inner">
        <div class="footer-cols">
          <div class="footer-brand-col">
            <NuxtLink to="/" class="footer-logo">
              <div class="logo-mark sm">
                <i class="ri-restaurant-fill" />
              </div>
              <strong>Deliveriano</strong>
            </NuxtLink>
            <p class="footer-about">
              Discover and support Switzerland’s finest independent restaurants, artisanal pizzerias, and local culinary creators.
            </p>
            <div class="swiss-badge">
              <span class="flag">🇨🇭</span>
              <span>Proudly based in Switzerland</span>
            </div>
          </div>

          <div class="footer-links-col">
            <h4>Popular Cities</h4>
            <ul>
              <li><button type="button" class="city-link" @click="isAddressModalOpen = true">Zürich</button></li>
              <li><button type="button" class="city-link" @click="isAddressModalOpen = true">Genève</button></li>
              <li><button type="button" class="city-link" @click="isAddressModalOpen = true">Basel</button></li>
              <li><button type="button" class="city-link" @click="isAddressModalOpen = true">Bern</button></li>
              <li><button type="button" class="city-link" @click="isAddressModalOpen = true">Lausanne</button></li>
            </ul>
          </div>

          <div class="footer-links-col">
            <h4>For Partners</h4>
            <ul>
              <li><a :href="portalUrl" target="_blank" rel="noopener noreferrer">Restaurant Portal</a></li>
              
              
              
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© {{ new Date().getFullYear() }} Deliveriano Switzerland. All rights reserved.</p>
          <div class="bottom-links">
            <a href="#privacy">Privacy</a>
            <span>•</span>
            <a href="#terms">Terms</a>
            <span>•</span>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Global Address Search Modal -->
    <AddressModal />
  </div>
</template>

<style scoped>
.marketplace-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fbf8f3;
  color: #29231f;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #c95028;
  color: #ffffff;
  padding: 8px;
  z-index: 10000;
  text-decoration: none;
  border-radius: 4px;
}
.skip-link:focus {
  top: 0;
}

/* Header */
.marketplace-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #efe8df;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 64px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: inherit;
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background-color: #c95028;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}
.logo-mark.sm {
  width: 30px;
  height: 30px;
  font-size: 1rem;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.brand-text strong {
  font-size: 1.2rem;
  font-weight: 800;
  color: #1f1a17;
  letter-spacing: -0.02em;
}
.brand-text small {
  font-size: 0.72rem;
  color: #8c8278;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.header-address-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.9rem;
  background-color: #f7f3ed;
  border: 1px solid #e5dacd;
  border-radius: 999px;
  font-size: 0.875rem;
  color: #29231f;
  cursor: pointer;
  max-width: 360px;
  transition: all 0.2s;
}
.header-address-pill:hover {
  background-color: #ffffff;
  border-color: #c95028;
}

.pill-pin {
  color: #c95028;
  font-size: 1rem;
  flex-shrink: 0;
}
.pill-address {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}
.pill-arrow {
  color: #8c8278;
  font-size: 1rem;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  color: #595048;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
}
.header-link:hover {
  color: #29231f;
  background-color: #f7f3ed;
}

.header-cart-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: #fdf5f0;
  color: #c95028;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  text-decoration: none;
}
.header-cart-btn:hover {
  background-color: #fcece3;
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #c95028;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
}

/* Footer */
.marketplace-footer {
  margin-top: auto;
  background-color: #1f1a17;
  color: #ede4d8;
  padding: 4rem 0 2rem;
}

.footer-cols {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.footer-about {
  color: #b5aba0;
  line-height: 1.6;
  font-size: 0.9375rem;
  margin-bottom: 1.5rem;
  max-width: 360px;
}

.swiss-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #ded6cc;
}

.footer-links-col h4 {
  color: #ffffff;
  font-size: 1rem;
  margin: 0 0 1.25rem;
  font-weight: 700;
}

.footer-links-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.footer-links-col a, .city-link {
  color: #b5aba0;
  text-decoration: none;
  font-size: 0.9rem;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}
.footer-links-col a:hover, .city-link:hover {
  color: #ffffff;
  text-decoration: underline;
}

.footer-bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.84rem;
  color: #8c8278;
}

.bottom-links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.bottom-links a {
  color: inherit;
  text-decoration: none;
}
.bottom-links a:hover {
  color: #ffffff;
}

@media (max-width: 768px) {
  .header-address-pill {
    display: none;
  }
  .footer-cols {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
</style>

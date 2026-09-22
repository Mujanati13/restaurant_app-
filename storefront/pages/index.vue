<script setup lang="ts">
import { useIsMarketplace, useActiveTenant, tenantHref } from '~/composables/useTenant'
import type { MenuItem, Category } from '~/types/storefront'
import MarketplaceView from '~/components/discovery/MarketplaceView.vue'

const isMarketplace = useIsMarketplace()
const tenant = useActiveTenant()
const brand = computed<any>(() => tenant.value?.brand || {})

const headers = useStorefrontHeaders()
const { data: menuData, error, refresh, status } = await useFetch<{ data: MenuItem[] }>('/api/v1/storefront/menus?limit=12', {
  headers,
  immediate: !isMarketplace.value,
})
const { data: categories } = await useFetch<{ data: Category[] }>('/api/v1/storefront/categories?limit=12', {
  headers,
  immediate: !isMarketplace.value,
})

const { data: locationData } = await useFetch<{ data: import('~/types/storefront').Location[] }>('/api/v1/storefront/locations', { headers, immediate: !isMarketplace.value })
const restaurantLocations = computed(() => locationData.value?.data || [])
const selectedCategoryId = ref<number | null>(null)

const filteredMenu = computed(() => {
  const items = menuData.value?.data || []
  if (!selectedCategoryId.value) return items
  return items.filter((item: MenuItem) => {
    if (item.category_ids && item.category_ids.length > 0) {
      return item.category_ids.includes(selectedCategoryId.value!)
    }
    return true
  })
})

function selectCategory(id: number | null) {
  selectedCategoryId.value = id
}

const currencyCode = computed(() => tenant.value?.currency?.code || 'CHF')

// Story content
const restaurantStory = computed(() => {
  return brand.value?.content?.about_story ||
    tenant.value?.restaurant?.listing_description ||
    brand.value?.content?.hero_subtitle ||
    brand.value?.identity?.tagline ||
    null
})

const coverPhoto = computed(() => {
  return brand.value?.content?.hero_image_url || menuData.value?.data.find(item => item.image)?.image || null
})
</script>

<template>
  <div>
    <!-- 1. MARKETPLACE EXPERIENCE (deliveriano.ch) -->
    <template v-if="isMarketplace">
      <MarketplaceView />
    </template>

    <!-- 2. RESTAURANT SUBDOMAIN EXPERIENCE -->
    <div v-else-if="tenant" class="restaurant-home">
      <!-- Restaurant Cover & Hero Section -->
      <section class="restaurant-hero">
        <div v-if="coverPhoto" class="hero-cover-bg" :style="{ backgroundImage: `url(${coverPhoto})` }">
          <div class="hero-cover-overlay" />
        </div>
        <div v-else class="hero-cover-fallback" />

        <div class="container hero-inner">
          <div class="hero-card-surface">
            <div class="restaurant-identity-header">
              <img
                v-if="brand.identity?.logo_url"
                :src="brand.identity.logo_url"
                :alt="`${tenant.restaurant.name} logo`"
                class="restaurant-logo-lg"
              />
              <div v-else class="restaurant-logo-placeholder">
                <i class="ri-restaurant-2-fill" />
              </div>

              <div class="restaurant-titles">
                <h1 class="restaurant-display-name">{{ tenant.restaurant.name }}</h1>
                <p v-if="brand.identity?.tagline" class="restaurant-display-sub">
                  {{ brand.identity.tagline }}
                </p>
                <div v-if="tenant.restaurant.address" class="restaurant-location-info">
                  <i class="ri-map-pin-2-line" />
                  <span>{{ tenant.restaurant.address }}</span>
                </div>
              </div>
            </div>

            <div class="hero-actions-row">
              <NuxtLink class="btn primary hero-action-btn" :to="tenantHref('/menu')">
                <i class="ri-restaurant-line" />
                <span>Browse Menu & Order</span>
              </NuxtLink>
              <NuxtLink
                v-if="tenant.capabilities?.reservations"
                class="btn outline hero-action-btn"
                :to="tenantHref('/reservations')"
              >
                <i class="ri-calendar-line" />
                <span>Reserve a Table</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Menu Categories Exploration Section -->
      <section v-if="categories?.data?.length" class="section categories-section">
        <div class="container">
          <div class="section-headline">
            <div>
              <span class="section-kicker">Our Selection</span>
              <h2>Menu Categories</h2>
            </div>
            <NuxtLink class="section-link-action" :to="tenantHref('/menu')">
              <span>View full menu</span>
              <i class="ri-arrow-right-line" />
            </NuxtLink>
          </div>

          <div class="category-chips-bar">
            <button
              class="category-chip"
              :class="{ active: selectedCategoryId === null }"
              type="button"
              @click="selectCategory(null)"
            >
              <i class="ri-apps-2-line" />
              <span>All Dishes</span>
            </button>
            <button
              v-for="category in categories.data"
              :key="category.id"
              class="category-chip"
              :class="{ active: selectedCategoryId === category.id }"
              type="button"
              @click="selectCategory(category.id)"
            >
              <span>{{ category.name }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Featured / Popular Dishes Section (Real items) -->
      <section class="section surface-section featured-menu-section">
        <div class="container">
          <div class="section-headline">
            <div>
              <span class="section-kicker">Fresh from the kitchen</span>
              <h2>A taste of our menu</h2>
            </div>
            <div class="section-headline-meta">
              <span class="item-count-badge">{{ filteredMenu.length }} available</span>
              <NuxtLink :to="tenantHref('/menu')" class="subtle-link">See all menu items →</NuxtLink>
            </div>
          </div>

          <AsyncState
            :loading="status === 'pending'"
            :error="error?.message"
            :empty="!filteredMenu?.length"
            empty-title="No dishes found in this category"
            empty-text="Try selecting another category or browse our full menu."
            @retry="refresh"
          >
            <div class="home-menu-grid">
              <MenuCard
                v-for="item in filteredMenu"
                :key="item.id"
                :item="item"
                :currency="currencyCode"
              />
            </div>

            <div class="menu-bottom-cta">
              <NuxtLink class="btn secondary menu-cta-btn" :to="tenantHref('/menu')">
                <span>View all available dishes</span>
                <i class="ri-arrow-right-line" />
              </NuxtLink>
            </div>
          </AsyncState>
        </div>
      </section>

      <!-- Owner-Written Story / About Section -->
      <section v-if="restaurantStory" class="section story-section">
        <div class="container">
          <div class="story-card">
            <span class="section-kicker">Our Story</span>
            <h2>Welcome to {{ tenant.restaurant.name }}</h2>
            <p class="story-paragraph">{{ restaurantStory }}</p>

          </div>
        </div>
      </section>

      <!-- Location, Opening & Contact Section -->
      <section class="section contact-hours-section">
        <div class="container">
          <div class="contact-hours-grid">
            <div class="info-panel">
              <span class="section-kicker">Visit Us</span>
              <h2>Location & Contact</h2>
              <ul class="contact-info-list">
                <li v-for="location in restaurantLocations" :key="location.id"><i class="ri-map-pin-line" /><div><strong>{{ location.name }}</strong><p>{{ location.address }}</p><a v-if="location.phone" :href="`tel:${location.phone}`">{{ location.phone }}</a></div></li>
                <li v-if="tenant.restaurant.address">
                  <i class="ri-map-pin-2-fill text-primary" />
                  <div>
                    <strong>Address</strong>
                    <p>{{ tenant.restaurant.address }}</p>
                  </div>
                </li>
                <li v-if="tenant.restaurant.phone">
                  <i class="ri-phone-fill text-primary" />
                  <div>
                    <strong>Phone</strong>
                    <p><a :href="`tel:${tenant.restaurant.phone}`">{{ tenant.restaurant.phone }}</a></p>
                  </div>
                </li>
                <li v-if="tenant.restaurant.email">
                  <i class="ri-mail-fill text-primary" />
                  <div>
                    <strong>Email</strong>
                    <p><a :href="`mailto:${tenant.restaurant.email}`">{{ tenant.restaurant.email }}</a></p>
                  </div>
                </li>
              </ul>
            </div>

            <div class="hours-panel">
              <span class="section-kicker">Service</span>
              <h2>Ordering & Fulfilment</h2>
              <div class="fulfilment-features">
                <div v-if="restaurantLocations.some(l => l.offer_delivery)" class="fulfilment-card">
                  <i class="ri-e-bike-2-fill text-primary" />
                  <div>
                    <strong>Delivery Service</strong>
                    <p>Hot and freshly prepared meals delivered directly to your door.</p>
                  </div>
                </div>
                <div v-if="restaurantLocations.some(l => l.offer_collection)" class="fulfilment-card">
                  <i class="ri-store-2-fill text-primary" />
                  <div>
                    <strong>Takeaway & Collection</strong>
                    <p>Order online and collect from the restaurant.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.restaurant-hero {
  position: relative;
  min-height: 380px;
  display: flex;
  align-items: flex-end;
  padding-bottom: 2.5rem;
  background-color: #29231f;
}

.hero-cover-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.hero-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(41, 35, 31, 0.2) 0%, rgba(41, 35, 31, 0.75) 100%);
}

.hero-cover-fallback {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 70% 30%, #3e332c 0%, #201a17 100%);
}

.hero-inner {
  position: relative;
  z-index: 2;
  width: 100%;
}

.hero-card-surface {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.restaurant-identity-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  min-width: 280px;
}

.restaurant-logo-lg {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  object-fit: cover;
  border: 1px solid #f0e9e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.restaurant-logo-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background-color: #f7f3ee;
  color: var(--brand-primary, #c95028);
  font-size: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.restaurant-display-name {
  margin: 0 0 0.25rem;
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-weight: 700;
  color: #29231f;
}

.restaurant-display-sub {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #665c52;
}

.restaurant-location-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  color: #787067;
}

.hero-actions-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hero-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 12px;
}

/* Story Section */
.story-section {
  padding: 4rem 0;
  background-color: #fffaf6;
}

.story-card {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.story-card h2 {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  margin: 0 0 1.25rem;
  color: #29231f;
}

.story-paragraph {
  font-size: 1.125rem;
  line-height: 1.8;
  color: #595048;
  margin-bottom: 2rem;
}

.story-meta-row {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.story-meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--brand-primary, #c95028);
  font-size: 0.9rem;
}

/* Contact & Hours Section */
.contact-hours-section {
  padding: 4rem 0;
}

.contact-hours-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
}

.info-panel, .hours-panel {
  background-color: #ffffff;
  border: 1px solid #f0e9e1;
  border-radius: 20px;
  padding: 2rem;
}

.info-panel h2, .hours-panel h2 {
  margin: 0 0 1.5rem;
  font-size: 1.5rem;
  color: #29231f;
}

.contact-info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.contact-info-list li {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.contact-info-list i {
  font-size: 1.25rem;
  color: var(--brand-primary, #c95028);
  margin-top: 0.2rem;
}

.contact-info-list strong {
  display: block;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8c8278;
  margin-bottom: 0.2rem;
}

.contact-info-list p {
  margin: 0;
  font-size: 0.95rem;
  color: #29231f;
}

.contact-info-list a {
  color: inherit;
  text-decoration: none;
}
.contact-info-list a:hover {
  text-decoration: underline;
}

.fulfilment-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.fulfilment-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #fffaf6;
  border-radius: 12px;
  border: 1px solid #f7ece2;
}

.fulfilment-card i {
  font-size: 1.5rem;
  color: var(--brand-primary, #c95028);
}

.fulfilment-card strong {
  display: block;
  font-size: 0.95rem;
  color: #29231f;
  margin-bottom: 0.25rem;
}

.fulfilment-card p {
  margin: 0;
  font-size: 0.85rem;
  color: #665c52;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .contact-hours-grid {
    grid-template-columns: 1fr;
  }
  .hero-card-surface {
    padding: 1.25rem;
  }
  .restaurant-identity-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>

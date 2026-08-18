<script setup lang="ts">
import type { MenuItem, Category } from '~/types/storefront'

const tenant = useNuxtData<any>('tenant-bootstrap')
const brand = computed(() => tenant.data.value?.data?.brand || {})
const sections = computed(() => {
  const list = brand.value?.sections || []
  return [...list].filter((s: any) => s.visible).sort((a: any, b: any) => a.position - b.position)
})

const headers = import.meta.server ? useRequestHeaders(['host', 'x-forwarded-host', 'x-forwarded-proto']) : undefined
const { data: menuData, error, refresh, status } = await useFetch<{ data: MenuItem[] }>('/api/v1/storefront/menus?limit=12', { headers })
const { data: categories } = await useFetch<{ data: Category[] }>('/api/v1/storefront/categories?limit=12', { headers })

const cart = useTenantCart()
const has = (type: string) => sections.value.some((section: any) => section.type === type)

// Interactive category filter on the home page
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

const currencyCode = computed(() => tenant.data.value?.data?.currency?.code || 'USD')
</script>

<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section v-if="has('hero')" class="home-hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <div class="hero-kicker-wrap">
            <span class="hero-badge">
              <i class="ri-sparkling-fill" />
              {{ brand.identity?.tagline || 'Made fresh for you' }}
            </span>
          </div>

          <h1 class="hero-title">
            {{ brand.content?.hero_title || 'Restaurant-quality food, on your schedule.' }}
          </h1>

          <p class="hero-subtitle">
            {{ brand.content?.hero_subtitle || 'Order freshly prepared favourites or reserve your visit with ease.' }}
          </p>

          <div class="hero-actions">
            <NuxtLink class="btn primary hero-btn-main" to="/menu">
              <span>Explore full menu</span>
              <i class="ri-arrow-right-line" />
            </NuxtLink>
            <NuxtLink class="btn outline hero-btn-sub" to="/reservations">
              <i class="ri-calendar-line" />
              <span>Make a reservation</span>
            </NuxtLink>
          </div>

          <!-- Quick Metrics Strip -->
          <div class="hero-metrics">
            <div class="metric-item">
              <div class="metric-icon"><i class="ri-star-smile-fill" /></div>
              <div>
                <strong>4.9 / 5</strong>
                <span>Top Customer Rating</span>
              </div>
            </div>
            <div class="metric-divider" />
            <div class="metric-item">
              <div class="metric-icon"><i class="ri-time-line" /></div>
              <div>
                <strong>25–35 min</strong>
                <span>Average Prep & Delivery</span>
              </div>
            </div>
            <div class="metric-divider" />
            <div class="metric-item">
              <div class="metric-icon"><i class="ri-leaf-line" /></div>
              <div>
                <strong>100% Fresh</strong>
                <span>Artisan Ingredients</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Hero Visual Showcase -->
        <div class="hero-visual-wrapper">
          <div
            v-if="brand.content?.hero_image_url"
            class="hero-visual has-image"
            :style="{ backgroundImage: `url(${brand.content.hero_image_url})` }"
          >
            <div class="hero-status-pill">
              <span class="status-dot" />
              <span>Kitchen open & taking orders</span>
            </div>
          </div>

          <div v-else class="hero-visual showcase-card">
            <div class="visual-glow-backdrop" />
            <div class="showcase-content">
              <div class="showcase-top-badge">
                <i class="ri-restaurant-2-fill" />
                <span>Today's Chef Selection</span>
              </div>

              <div class="showcase-dish-preview">
                <div class="dish-illustration">
                  <i class="ri-bowl-fill" />
                </div>
                <div class="dish-info">
                  <h3>Special Catfish & Rice Deluxe</h3>
                  <p>Slow cooked in aromatic sauce, served fresh</p>
                  <div class="dish-meta">
                    <span class="dish-price">$13.99</span>
                    <NuxtLink to="/menu" class="dish-order-link">Order now →</NuxtLink>
                  </div>
                </div>
              </div>

              <!-- Floating Micro-Badges -->
              <div class="floating-badge badge-top-right">
                <i class="ri-fire-fill text-accent" />
                <div>
                  <strong>Freshly Prepared</strong>
                  <small>Cooked to order</small>
                </div>
              </div>

              <div class="floating-badge badge-bottom-left">
                <i class="ri-takeaway-fill text-primary" />
                <div>
                  <strong>Instant Dine-in & Delivery</strong>
                  <small>Zero waiting fees</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pillars / Why Us Section -->
    <section class="section service-pillars-section">
      <div class="container">
        <div class="pillars-grid">
          <div class="pillar-card">
            <div class="pillar-icon-box">
              <i class="ri-restaurant-line" />
            </div>
            <div class="pillar-text">
              <h3>Artisan Culinary Craft</h3>
              <p>Authentic recipes perfected daily using rich seasonings and quality farm produce.</p>
            </div>
          </div>

          <div class="pillar-card">
            <div class="pillar-icon-box">
              <i class="ri-e-bike-2-line" />
            </div>
            <div class="pillar-text">
              <h3>Hot & Fast Delivery</h3>
              <p>Carefully packaged meals delivered with utmost speed and temperature retention.</p>
            </div>
          </div>

          <div class="pillar-card">
            <div class="pillar-icon-box">
              <i class="ri-calendar-check-line" />
            </div>
            <div class="pillar-text">
              <h3>Instant Booking</h3>
              <p>Plan intimate dinners or group gatherings with hassle-free live confirmation.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Category Exploration Section -->
    <section v-if="has('categories')" class="section categories-section">
      <div class="container">
        <div class="section-headline">
          <div>
            <span class="section-kicker">Menu Explorer</span>
            <h2>Find your favourite dish</h2>
          </div>
          <NuxtLink class="section-link-action" to="/menu">
            <span>View full menu</span>
            <i class="ri-arrow-right-line" />
          </NuxtLink>
        </div>

        <!-- Filter Chips Bar -->
        <div class="category-chips-bar">
          <button
            class="category-chip"
            :class="{ active: selectedCategoryId === null }"
            type="button"
            @click="selectCategory(null)"
          >
            <i class="ri-apps-2-line" />
            <span>All Favourites</span>
          </button>
          <button
            v-for="category in categories?.data"
            :key="category.id"
            class="category-chip"
            :class="{ active: selectedCategoryId === category.id }"
            type="button"
            @click="selectCategory(category.id)"
          >
            <i class="ri-restaurant-2-line" />
            <span>{{ category.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Popular / Featured Dishes Grid Section -->
    <section v-if="has('featured_dishes')" class="section surface-section featured-menu-section">
      <div class="container">
        <div class="section-headline">
          <div>
            <span class="section-kicker">From our kitchen</span>
            <h2>Popular right now</h2>
          </div>
          <div class="section-headline-meta">
            <span class="item-count-badge">{{ filteredMenu.length }} available</span>
            <NuxtLink to="/menu" class="subtle-link">See all menu items →</NuxtLink>
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
              @add="cart.add"
            />
          </div>

          <div class="menu-bottom-cta">
            <NuxtLink class="btn secondary menu-cta-btn" to="/menu">
              <span>View all available dishes</span>
              <i class="ri-arrow-right-line" />
            </NuxtLink>
          </div>
        </AsyncState>
      </div>
    </section>

    <!-- Experience / How It Works Journey -->
    <section class="section experience-section">
      <div class="container">
        <div class="centered-headline">
          <span class="section-kicker">Effortless Dining</span>
          <h2>How it works</h2>
          <p>From menu selection to first bite, dining with us is smooth and memorable.</p>
        </div>

        <div class="journey-steps-grid">
          <div class="step-card">
            <div class="step-badge">01</div>
            <div class="step-icon-wrap">
              <i class="ri-book-open-line" />
            </div>
            <h3>Discover & Choose</h3>
            <p>Explore our carefully crafted menu featuring authentic dishes, salads, appetizers, and chef specials.</p>
          </div>

          <div class="step-card">
            <div class="step-badge">02</div>
            <div class="step-icon-wrap">
              <i class="ri-shopping-cart-2-line" />
            </div>
            <h3>Order or Reserve</h3>
            <p>Customize your food order for fast delivery or reserve your visit in just a few simple taps.</p>
          </div>

          <div class="step-card">
            <div class="step-badge">03</div>
            <div class="step-icon-wrap">
              <i class="ri-emotion-happy-line" />
            </div>
            <h3>Savour Every Bite</h3>
            <p>Enjoy piping-hot meals prepared fresh from our kitchen, served with warm hospitality.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Reservation CTA Banner -->
    <section v-if="has('reservation_cta')" class="section reservation-cta-section">
      <div class="container">
        <div class="reservation-card-banner">
          <div class="banner-ambient-glow" />
          <div class="banner-content">
            <span class="banner-kicker">
              <i class="ri-vip-crown-2-line" />
              Make it a moment
            </span>
            <h2>We are ready to welcome you.</h2>
            <p>
              Whether you are planning a relaxed dinner, family gathering, or romantic date night,
              let our kitchen take care of the rest.
            </p>

            <ul class="banner-features-list">
              <li><i class="ri-checkbox-circle-fill" /> Instant real-time confirmation</li>
              <li><i class="ri-checkbox-circle-fill" /> No booking or cancellation fees</li>
              <li><i class="ri-checkbox-circle-fill" /> Dietary & special requests welcome</li>
            </ul>

            <div class="banner-actions">
              <NuxtLink class="btn primary banner-primary-btn" to="/reservations">
                <span>Make a reservation now</span>
                <i class="ri-arrow-right-line" />
              </NuxtLink>
              <NuxtLink class="btn outline banner-secondary-btn" to="/locations">
                <span>View locations & hours</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useDiscovery, type DiscoveryRestaurant, type CuisineItem } from '~/composables/useDiscovery'
import RestaurantCard from './RestaurantCard.vue'

const { t } = useLocale()

const {
  selectedAddress,
  selectedCoordinates,
  orderType,
  searchQuery,
  selectedCuisine,
  isAddressModalOpen,
  requestGpsLocation,
  gpsStatus,
  gpsError,
  radiusKm,
  minRating,
  maxDeliveryFee,
  openNow,
  sort,
} = useDiscovery()

const page = ref(1)
watch([selectedCoordinates, searchQuery, selectedCuisine, orderType, radiusKm, minRating, maxDeliveryFee, openNow, sort], () => { page.value = 1 }, { flush: 'sync' })

// Fetch Cuisines
const { data: cuisinesData } = await useFetch<{ data: CuisineItem[] }>('/api/v1/discovery/cuisines')
const cuisines = computed(() => cuisinesData.value?.data || [])

// Fetch Restaurants based on active filters
const queryParams = computed(() => {
  const p: Record<string, any> = {
    order_type: orderType.value,
    page: page.value,
    radius_km: radiusKm.value,
    sort: sort.value,
  }
  if (selectedCoordinates.value) {
    p.latitude = selectedCoordinates.value.lat
    p.longitude = selectedCoordinates.value.lng
  }
  if (searchQuery.value.trim()) {
    p.search = searchQuery.value.trim()
  }
  if (selectedCuisine.value) {
    p.cuisine = selectedCuisine.value
  }
  if (minRating.value) p.min_rating = minRating.value
  if (maxDeliveryFee.value !== null) p.max_delivery_fee = maxDeliveryFee.value
  if (openNow.value) p.open_now = true
  return p
})

const {
  data: discoveryData,
  status,
  error,
  refresh,
} = await useFetch<{ data: DiscoveryRestaurant[]; meta: any }>('/api/v1/discovery/restaurants', {
  query: queryParams,
  watch: [queryParams],
})

const heroRestaurant = computed(() => discoveryData.value?.data.find(r => r.cover_photo_url))
const restaurants = computed(() => discoveryData.value?.data || [])
const meta = computed(() => discoveryData.value?.meta)

const selectCuisine = (cuisineName: string | null) => {
  if (selectedCuisine.value === cuisineName) {
    selectedCuisine.value = null
  } else {
    selectedCuisine.value = cuisineName
  }
}

const toggleOrderType = (type: 'delivery' | 'collection') => {
  orderType.value = type
}

const cuisineIcons: Record<string, string> = {
  Japanese: '🍣',
  Bakery: '🥐',
  Indian: '🍛',
  Vegetarian: '🥬',
  French: '🥖',
  Burgers: '🍔',
  Italian: '🍝',
  'Middle Eastern': '🧆',
  Thai: '🍜',
  Pizza: '🍕',
  Mexican: '🌮',
  Healthy: '🥗',
}

const cuisineIcon = (name: string) => cuisineIcons[name] || '🍽️'

const activeFilterCount = computed(() => [
  searchQuery.value,
  selectedCuisine.value,
  minRating.value,
  maxDeliveryFee.value,
  openNow.value,
  sort.value !== 'recommended',
].filter(Boolean).length)

const clearFilters = () => {
  searchQuery.value = ''
  selectedCuisine.value = null
  minRating.value = null
  maxDeliveryFee.value = null
  openNow.value = false
  sort.value = 'recommended'
}

const handleUseGpsHero = async () => {
  await requestGpsLocation()
}
</script>

<template>
  <div class="marketplace-page">
    <!-- Hero Section — Uber Eats Inspired -->
    <section class="marketplace-hero">
      <div class="container hero-container">
        <div class="hero-content">
          <p class="hero-eyebrow"><i class="ri-e-bike-2-line" /> {{ t('hero.eyebrow') }}</p>
          <h1 class="hero-title">
            {{ t('hero.title') }}<br /><span>{{ t('hero.titleAccent') }}</span>
          </h1>
          <p class="hero-support">{{ t('hero.support') }}</p>

          <!-- Address Bar -->
          <div class="hero-address-bar">
            <div class="address-card-heading">
              <span>{{ t('hero.addressHeading') }}</span>
              <span class="address-card-secure"><i class="ri-shield-check-line" /> {{ t('hero.secure') }}</span>
            </div>
            <!-- Delivery / Pickup Switcher -->
            <div class="fulfilment-toggle" role="tablist" aria-label="Order fulfilment type">
              <button
                type="button"
                role="tab"
                :aria-selected="orderType === 'delivery'"
                class="toggle-btn"
                :class="{ active: orderType === 'delivery' }"
                @click="toggleOrderType('delivery')"
              >
                <i class="ri-e-bike-2-fill" />
                <span>{{ t('hero.delivery') }}</span>
              </button>
              <button
                type="button"
                role="tab"
                :aria-selected="orderType === 'collection'"
                class="toggle-btn"
                :class="{ active: orderType === 'collection' }"
                @click="toggleOrderType('collection')"
              >
                <i class="ri-walk-fill" />
                <span>{{ t('hero.pickup') }}</span>
              </button>
            </div>

            <!-- Address Input Row -->
            <div class="address-input-row">
              <button
                type="button"
                class="address-trigger-btn"
                @click="isAddressModalOpen = true"
              >
                <i class="ri-map-pin-2-fill address-pin-icon" />
                <span class="trigger-val">{{ selectedAddress || t('hero.addressPlaceholder') }}</span>
              </button>

              <button
                type="button"
                class="btn-gps-hero"
                :disabled="gpsStatus === 'requesting'"
                aria-label="Use my current location"
                title="Use current location"
                @click="handleUseGpsHero"
              >
                <i v-if="gpsStatus === 'requesting'" class="ri-loader-4-line ri-spin" />
                <i v-else class="ri-crosshair-2-line" />
              </button>

              <button
                type="button"
                class="btn-find-food"
                @click="isAddressModalOpen = true"
              >
                {{ t('hero.findFood') }}
              </button>
            </div>
          </div>
          <div class="hero-benefits" aria-label="Ordering benefits">
            <span><i class="ri-store-2-line" /> {{ t('hero.localKitchens') }}</span>
            <span><i class="ri-time-line" /> {{ t('hero.flexible') }}</span>
          </div>
          <p v-if="gpsError" role="alert" class="location-notice">{{ gpsError }}</p>
        </div>
        <a v-if="heroRestaurant" class="hero-food" :href="heroRestaurant.subdomain_url">
          <img :src="heroRestaurant.cover_photo_url!" :alt="heroRestaurant.name" fetchpriority="high" />
          <span class="hero-food-caption"><i class="ri-restaurant-2-line" /> {{ t('hero.explore') }}</span>
        </a>
        <div v-else class="hero-editorial" aria-hidden="true">
          <i class="ri-restaurant-2-fill" />
        </div>
      </div>
    </section>

    <!-- Cuisine Filter Bar (Horizontal Scrollable) -->
    <section class="cuisine-bar-section">
      <div class="container">
        <div class="cuisine-scroll-container">
          <button
            type="button"
            class="cuisine-item"
            :class="{ active: selectedCuisine === null }"
            @click="selectCuisine(null)"
          >
            <span class="cuisine-icon-circle">
              <i class="ri-apps-2-fill" />
            </span>
            <span class="cuisine-label">All</span>
          </button>
          <button
            v-for="c in cuisines"
            :key="c.slug"
            type="button"
            class="cuisine-item"
            :class="{ active: selectedCuisine === c.name }"
            @click="selectCuisine(c.name)"
          >
            <span class="cuisine-icon-circle">
              {{ cuisineIcon(c.name) }}
            </span>
            <span class="cuisine-label">{{ c.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Discovery Results Section -->
    <section class="results-section">
      <div class="container">
        <p v-if="!selectedCoordinates" class="location-notice"><i class="ri-map-pin-2-line" /> Choose an address to check delivery coverage and see restaurants nearest to you.</p>
        <label v-if="orderType === 'collection' && selectedCoordinates" class="radius-control">
          Search within
          <select v-model.number="radiusKm"><option :value="10">10 km</option><option :value="25">25 km</option><option :value="50">50 km</option></select>
        </label>
        <!-- Results Controls Bar -->
        <div class="discovery-filters" aria-label="Restaurant filters">
          <label class="filter-select">
            <i class="ri-sort-desc" />
            <span>Sort</span>
            <select v-model="sort" aria-label="Sort restaurants"><option value="recommended">Recommended</option><option value="rating">Top rated</option><option value="delivery_fee">Lowest delivery fee</option><option value="eta">Fastest delivery</option><option v-if="selectedCoordinates" value="distance">Nearest</option></select>
          </label>
          <label class="filter-select">
            <i class="ri-star-line" />
            <span>Rating</span>
            <select v-model="minRating" aria-label="Minimum rating"><option :value="null">Any rating</option><option :value="4">4.0+</option><option :value="4.5">4.5+</option></select>
          </label>
          <label class="filter-select">
            <i class="ri-e-bike-2-line" />
            <span>Delivery fee</span>
            <select v-model="maxDeliveryFee" aria-label="Maximum delivery fee"><option :value="null">Any fee</option><option :value="0">Free delivery</option><option :value="3.5">Up to CHF 3.50</option></select>
          </label>
          <label class="open-now-filter"><input v-model="openNow" type="checkbox"><span>Open now</span></label>
        </div>
        <div class="results-toolbar">
          <div class="results-heading-wrap">
            <h2 class="results-title">
              <span v-if="selectedCuisine">{{ selectedCuisine }} Restaurants</span>
              <span v-else>{{ selectedCoordinates ? 'Restaurants near you' : 'Discover our local kitchens' }}</span>
            </h2>
            <span v-if="meta" class="results-count">
              {{ meta.total }} {{ meta.total === 1 ? 'place' : 'places' }} {{ selectedCoordinates ? 'in your area' : 'to explore' }}
            </span>
          </div>

          <!-- Name Search Field -->
          <div class="search-input-box">
            <i class="ri-search-line search-icon" />
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Search by restaurant name…"
              class="search-input"
              aria-label="Search restaurants"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="search-clear-btn"
              aria-label="Clear search"
              @click="searchQuery = ''"
            >
              <i class="ri-close-circle-fill" />
            </button>
          </div>
          <button
            v-if="activeFilterCount"
            type="button"
            class="clear-filter-btn"
            @click="clearFilters"
          >
            Clear filters
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="status === 'pending'" class="state-container" role="status">
          <div class="spinner-terracotta" />
          <p>Finding Deliveriano restaurants near your address…</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="state-container error-state" role="alert">
          <i class="ri-error-warning-line state-icon" />
          <h3>Could not load restaurants</h3>
          <p>{{ error.message || 'An error occurred while finding nearby restaurants.' }}</p>
          <button class="btn primary btn-retry" @click="() => refresh()">Try again</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="restaurants.length === 0" class="state-container empty-state">
          <div class="empty-icon-wrap">
            <i class="ri-restaurant-line" />
          </div>
          <h3>No restaurants found in this area</h3>
          <p v-if="searchQuery || selectedCuisine">
            No matches for your current filters. Try clearing your search or picking another cuisine.
          </p>
          <p v-else>
            We don't have Deliveriano partner restaurants covering this exact address yet. Try adjusting your delivery location or choosing Pickup.
          </p>
          <div class="empty-actions">
            <button
              v-if="searchQuery || selectedCuisine"
              type="button"
              class="btn outline"
              @click="() => { searchQuery = ''; selectedCuisine = null }"
            >
              Clear filters
            </button>
            <button
              type="button"
              class="btn primary"
              @click="isAddressModalOpen = true"
            >
              Change address
            </button>
          </div>
        </div>

        <!-- Results Grid -->
        <div v-else class="restaurants-grid">
          <RestaurantCard
            v-for="r in restaurants"
            :key="r.id"
            :restaurant="r"
            :order-type="orderType"
          />
        </div>
        <nav v-if="meta?.last_page > 1" class="results-pagination" aria-label="Restaurant results pages">
          <button class="btn outline" :disabled="page <= 1 || status === 'pending'" @click="page--">Previous</button>
          <span aria-live="polite">Page {{ page }} of {{ meta.last_page }}</span>
          <button class="btn outline" :disabled="page >= meta.last_page || status === 'pending'" @click="page++">Next</button>
        </nav>
      </div>
    </section>
  </div>
</template>

<style scoped>
.marketplace-page {
  min-height: 80vh;
  background-color: #ffffff;
}
.discovery-filters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  margin: 0 0 1.25rem;
  padding: 0.65rem;
  border: 1px solid #e7e7e7;
  border-radius: 14px;
  background: #f8f8f8;
}
.filter-select,
.open-now-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 52px;
  padding: 0.55rem 0.7rem;
  border: 1px solid #dedede;
  border-radius: 10px;
  background: #ffffff;
  color: #1f1f1f;
  font-size: 0.8125rem;
  font-weight: 700;
}
.filter-select i {
  color: #06c167;
  font-size: 1.05rem;
}
.filter-select span {
  white-space: nowrap;
}
.filter-select select {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #333333;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}
.open-now-filter {
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}
.open-now-filter:hover {
  border-color: #06c167;
  background-color: #f2fcf6;
}
.open-now-filter input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: #06c167;
}

/* ===== HERO ===== */
.marketplace-hero {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 4% 18%, rgba(6, 193, 103, 0.13) 0, rgba(6, 193, 103, 0) 25rem),
    linear-gradient(180deg, #ffffff 0%, #f8fcf9 100%);
  padding: clamp(3rem, 6vw, 5.25rem) 0 clamp(3.5rem, 6vw, 5rem);
}

.hero-container {
  max-width: 1240px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(380px, 0.88fr);
  gap: clamp(2rem, 6vw, 5rem);
  align-items: center;
}

.hero-title {
  max-width: 11ch;
  margin: 0 0 1rem;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(2.8rem, 5.4vw, 4.5rem);
  font-weight: 800;
  line-height: 1.05;
  color: #000000;
  letter-spacing: -0.03em;
}

.hero-title span {
  color: var(--brand-primary, #06c167);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 1rem;
  color: #277047;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-eyebrow i {
  color: var(--brand-primary, #06c167);
  font-size: 1rem;
}

.hero-support {
  max-width: 36rem;
  margin: 0 0 1.5rem;
  color: #5f675f;
  font-size: 1.04rem;
  line-height: 1.6;
}

/* ===== ADDRESS BAR ===== */
.hero-address-bar {
  max-width: 590px;
  padding: 1rem;
  border: 1px solid #dfe9e1;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 35px rgba(35, 65, 44, 0.1);
}

.address-card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: #333333;
  font-size: 0.84rem;
  font-weight: 800;
}

.address-card-secure {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #588066;
  font-size: 0.72rem;
  font-weight: 700;
}

.fulfilment-toggle {
  display: flex;
  width: fit-content;
  background-color: #f1f4f1;
  padding: 0.25rem;
  border-radius: 999px;
  margin-bottom: 1rem;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #545454;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background-color: #1f1f1f;
  color: #ffffff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12);
}

.address-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.address-trigger-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 52px;
  padding: 0.85rem 1rem;
  background-color: #f7f8f7;
  border: 1.5px solid #d9ded9;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, background-color 0.2s;
}

.address-trigger-btn:hover {
  border-color: #06C167;
  background-color: #ffffff;
}

.address-pin-icon {
  font-size: 1.25rem;
  color: #06C167;
  flex-shrink: 0;
}

.trigger-val {
  font-size: 0.95rem;
  color: #545454;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-gps-hero {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 10px;
  background-color: #f7f8f7;
  border: 1.5px solid #d9ded9;
  color: #545454;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.btn-gps-hero:hover:not(:disabled) {
  border-color: #06C167;
  color: #06C167;
  background-color: #f0faf5;
}
.btn-gps-hero:disabled {
  opacity: 0.5;
}

.btn-find-food {
  min-height: 52px;
  padding: 0.85rem 1.35rem;
  background-color: #06C167;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s;
  flex-shrink: 0;
}
.btn-find-food:hover {
  background-color: #05a85a;
}

.hero-benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  margin-top: 1.1rem;
  color: #526257;
  font-size: 0.78rem;
  font-weight: 650;
}

.hero-benefits span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.hero-benefits i {
  color: var(--brand-primary, #06c167);
  font-size: 1rem;
}

/* ===== HERO FOOD IMAGE ===== */
.hero-food {
  position: relative;
  display: block;
  aspect-ratio: 0.94;
  overflow: hidden;
  border-radius: 24px;
  box-shadow: 0 24px 48px rgba(39, 30, 20, 0.18);
}
.hero-food img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-food::after {
  position: absolute;
  inset: 45% 0 0;
  content: '';
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.56));
  pointer-events: none;
}

.hero-food-caption {
  position: absolute;
  z-index: 1;
  right: 1rem;
  bottom: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: #28231e;
  font-size: 0.8rem;
  font-weight: 800;
}

.hero-food-caption i {
  color: var(--brand-primary, #06c167);
}

.hero-editorial {
  aspect-ratio: 0.94;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 16px;
  color: #d0d0d0;
  font-size: 4rem;
}

/* ===== CUISINE BAR ===== */
.cuisine-bar-section {
  padding: 1.5rem 0;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 64px;
  z-index: 40;
}

.cuisine-scroll-container {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
  scrollbar-width: none;
}
.cuisine-scroll-container::-webkit-scrollbar {
  display: none;
}

.cuisine-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0.25rem;
  min-width: 70px;
  transition: all 0.2s;
}

.cuisine-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif;
  font-size: 1.5rem;
  color: #545454;
  transition: all 0.2s;
}

.cuisine-item:hover .cuisine-icon-circle {
  transform: translateY(-2px);
  border-color: #bceecf;
  background-color: #effaf4;
}

.cuisine-item.active .cuisine-icon-circle {
  background-color: #000000;
  color: #ffffff;
}

.cuisine-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #545454;
  white-space: nowrap;
}

.cuisine-item.active .cuisine-label {
  color: #000000;
}

/* ===== RESULTS SECTION ===== */
.results-section {
  padding: 2.5rem 0 4rem;
  background-color: #ffffff;
}

.results-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.results-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #000000;
}

.results-count {
  font-size: 0.875rem;
  color: #545454;
}

.search-input-box {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  max-width: 390px;
  min-height: 52px;
  background-color: #f8f8f8;
  border: 1.5px solid #dedede;
  border-radius: 10px;
  padding: 0.4rem 0.85rem;
}

.search-input-box:focus-within {
  border-color: #06C167;
  box-shadow: 0 0 0 3px rgba(6, 193, 103, 0.15);
  background-color: #ffffff;
}

.search-icon {
  font-size: 1.125rem;
  color: #999;
  margin-right: 0.5rem;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.875rem;
  color: #000000;
}

.search-clear-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0;
}
.clear-filter-btn {
  border: 0;
  padding: 0.5rem 0;
  background: transparent;
  color: #4d4d4d;
  font-size: 0.875rem;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}
.clear-filter-btn:hover {
  color: #000000;
}

.restaurants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* ===== STATE CONTAINERS ===== */
.state-container {
  text-align: center;
  padding: 4rem 1.5rem;
  background-color: #f9f9f9;
  border-radius: 12px;
  border: 1px dashed #e0e0e0;
  color: #666;
}

.spinner-terracotta {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(6, 193, 103, 0.2);
  border-top-color: #06C167;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-icon {
  font-size: 2.5rem;
  color: #06C167;
  margin-bottom: 0.5rem;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #f5f5f5;
  color: #999;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.empty-state h3, .error-state h3 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #000000;
}

.empty-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.location-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid #d9eee2;
  border-radius: 10px;
  background: #f4fbf7;
  color: #366149;
  line-height: 1.5;
  font-size: 0.9375rem;
}
.location-notice i { color: #06c167; font-size: 1.1rem; }
.results-pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 2rem; }
.radius-control { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }
.radius-control select { padding: .6rem; border: 1px solid #e0e0e0; border-radius: 8px; background: white; }

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  .address-input-row {
    flex-wrap: wrap;
  }
  .address-trigger-btn {
    min-width: 0;
  }
  .btn-find-food {
    width: 100%;
  }
  .hero-address-bar {
    max-width: none;
  }
  .search-input-box {
    max-width: 100%;
  }
  .cuisine-scroll-container {
    gap: 1rem;
  }
  .cuisine-icon-circle {
    width: 52px;
    height: 52px;
    font-size: 1.25rem;
  }
  .discovery-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .hero-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .hero-food {
    aspect-ratio: 16/9;
    border-radius: 16px;
  }
  .hero-editorial {
    display: none;
  }
  .hero-title {
    max-width: 12ch;
  }
}
@media (max-width: 480px) {
  .marketplace-hero {
    padding-top: 2.25rem;
  }
  .hero-title {
    font-size: 2.55rem;
  }
  .hero-support {
    font-size: 0.95rem;
  }
  .address-card-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.25rem;
  }
  .fulfilment-toggle {
    width: 100%;
  }
  .toggle-btn {
    flex: 1;
    justify-content: center;
  }
  .hero-benefits {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.45rem;
  }
}
@media (max-width: 480px) {
  .discovery-filters {
    grid-template-columns: 1fr;
  }
  .filter-select,
  .open-now-filter {
    min-height: 48px;
  }
  .results-toolbar {
    align-items: stretch;
  }
  .search-input-box {
    max-width: none;
  }
}
</style>

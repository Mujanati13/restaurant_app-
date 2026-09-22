<script setup lang="ts">
import { useDiscovery, type DiscoveryRestaurant, type CuisineItem } from '~/composables/useDiscovery'
import RestaurantCard from './RestaurantCard.vue'

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
          <h1 class="hero-title">
            Order delivery<br />near you
          </h1>

          <!-- Address Bar -->
          <div class="hero-address-bar">
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
                <span>Delivery</span>
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
                <span>Pickup</span>
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
                <span class="trigger-val">{{ selectedAddress || 'Enter delivery address' }}</span>
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
                Find Food
              </button>
            </div>
          </div>
          <p v-if="gpsError" role="alert" class="location-notice">{{ gpsError }}</p>
        </div>
        <a v-if="heroRestaurant" class="hero-food" :href="heroRestaurant.subdomain_url">
          <img :src="heroRestaurant.cover_photo_url!" :alt="heroRestaurant.name" fetchpriority="high" />
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
              <i class="ri-restaurant-line" />
            </span>
            <span class="cuisine-label">{{ c.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Discovery Results Section -->
    <section class="results-section">
      <div class="container">
        <p v-if="!selectedCoordinates" class="location-notice">Choose an address to check delivery coverage and see restaurants nearest to you.</p>
        <label v-if="orderType === 'collection' && selectedCoordinates" class="radius-control">
          Search within
          <select v-model.number="radiusKm"><option :value="10">10 km</option><option :value="25">25 km</option><option :value="50">50 km</option></select>
        </label>
        <!-- Results Controls Bar -->
        <div class="discovery-filters" aria-label="Restaurant filters">
          <label>Sort<select v-model="sort"><option value="recommended">Recommended</option><option value="rating">Top rated</option><option value="delivery_fee">Lowest delivery fee</option><option value="eta">Fastest delivery</option><option v-if="selectedCoordinates" value="distance">Nearest</option></select></label>
          <label>Rating<select v-model="minRating"><option :value="null">Any rating</option><option :value="4">4.0+</option><option :value="4.5">4.5+</option></select></label>
          <label>Delivery fee<select v-model="maxDeliveryFee"><option :value="null">Any fee</option><option :value="0">Free delivery</option><option :value="3.5">Up to CHF 3.50</option></select></label>
          <label class="open-now-filter"><input v-model="openNow" type="checkbox"> Open now</label>
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
.discovery-filters { display:flex; flex-wrap:wrap; gap:.65rem; margin:0 0 1rem; }
.discovery-filters label { display:flex; align-items:center; gap:.35rem; padding:.45rem .65rem; border:1px solid #ddd; border-radius:8px; background:#fff; font-size:.86rem; font-weight:600; }
.discovery-filters select { border:0; background:transparent; min-width:0; }
.open-now-filter { cursor:pointer; }

/* ===== HERO ===== */
.marketplace-hero {
  position: relative;
  background-color: #ffffff;
  padding: 4rem 0 3rem;
}

.hero-container {
  max-width: 1240px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 3rem;
  align-items: center;
}

.hero-title {
  margin: 0 0 2rem;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  font-weight: 800;
  line-height: 1.05;
  color: #000000;
  letter-spacing: -0.03em;
}

/* ===== ADDRESS BAR ===== */
.hero-address-bar {
  background-color: #ffffff;
  max-width: 540px;
}

.fulfilment-toggle {
  display: inline-flex;
  background-color: #f5f5f5;
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
  background-color: #ffffff;
  color: #000000;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
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
  padding: 0.85rem 1rem;
  background-color: #f5f5f5;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
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
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background-color: #f5f5f5;
  border: 1.5px solid #e0e0e0;
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
  padding: 0.85rem 1.5rem;
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

/* ===== HERO FOOD IMAGE ===== */
.hero-food {
  position: relative;
  display: block;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 16px;
}
.hero-food img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-editorial {
  aspect-ratio: 1;
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
  font-size: 1.5rem;
  color: #545454;
  transition: all 0.2s;
}

.cuisine-item:hover .cuisine-icon-circle {
  background-color: #e8e8e8;
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
  max-width: 320px;
  background-color: #f5f5f5;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
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

.location-notice { margin: 0.75rem 0; color: #666; line-height: 1.6; font-size: 0.9375rem; }
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
}
@media (max-width: 760px) {
  .hero-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .hero-food {
    aspect-ratio: 16/9;
    border-radius: 12px;
  }
  .hero-editorial {
    display: none;
  }
}
</style>

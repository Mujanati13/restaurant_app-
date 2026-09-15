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
} = useDiscovery()

const page = ref(1)
watch([selectedCoordinates, searchQuery, selectedCuisine, orderType, radiusKm], () => { page.value = 1 }, { flush: 'sync' })

// Fetch Cuisines
const { data: cuisinesData } = await useFetch<{ data: CuisineItem[] }>('/api/v1/discovery/cuisines')
const cuisines = computed(() => cuisinesData.value?.data || [])

// Fetch Restaurants based on active filters
const queryParams = computed(() => {
  const p: Record<string, any> = {
    order_type: orderType.value,
    page: page.value,
    radius_km: radiusKm.value,
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
    <!-- Food-Led Hero Section -->
    <section class="marketplace-hero">
      <div class="container hero-container">
        <div class="hero-content">
          <div class="hero-badge-wrap">
            <span class="hero-pill">
              <i class="ri-sparkling-fill text-terracotta" />
              <span>Deliveriano Switzerland</span>
            </span>
          </div>

          <h1 class="hero-title">
            Good food.<br />Closer than you think.
          </h1>

          <p class="hero-sub">
            Your next favourite meal is around the corner. Find a local kitchen, choose something delicious, and make yourself at home.
          </p>

          <!-- Address Bar Box -->
          <div class="hero-address-card">
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

            <!-- Address Picker Input trigger -->
            <div class="address-trigger-wrap">
              <button
                type="button"
                class="address-trigger-btn"
                @click="isAddressModalOpen = true"
              >
                <i class="ri-map-pin-2-fill address-pin-icon" />
                <div class="address-trigger-text">
                  <span class="trigger-label">{{ orderType === 'delivery' ? 'Your delivery address' : 'Find pickup near' }}</span>
                  <strong class="trigger-val">{{ selectedAddress || 'Where would you like to eat?' }}</strong>
                </div>
                <span class="btn-change-address">{{ selectedCoordinates ? 'Change' : 'Find food' }}</span>
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
                <span class="gps-label">Near me</span>
              </button>
            </div>
          </div>
          <p v-if="gpsError" role="alert" class="location-notice">{{ gpsError }}</p>
        </div>
        <a v-if="heroRestaurant" class="hero-food" :href="heroRestaurant.subdomain_url">
          <img :src="heroRestaurant.cover_photo_url!" :alt="heroRestaurant.name" fetchpriority="high" />
          <div><span>Meet your local kitchens</span><strong>{{ heroRestaurant.name }}</strong></div>
        </a>
        <div v-else class="hero-editorial" aria-hidden="true">
          <span>Made nearby.</span><em>Enjoyed here.</em>
          <p>A table for every taste.</p>
        </div>
      </div>
    </section>

    <!-- Cuisine Filter Bar (Horizontal Scrollable) -->
    <section class="cuisine-bar-section">
      <div class="container">
        <div class="cuisine-scroll-container">
          <button
            type="button"
            class="cuisine-chip"
            :class="{ active: selectedCuisine === null }"
            @click="selectCuisine(null)"
          >
            <i class="ri-apps-2-fill chip-icon" />
            <span>All Cuisines</span>
          </button>
          <button
            v-for="c in cuisines"
            :key="c.slug"
            type="button"
            class="cuisine-chip"
            :class="{ active: selectedCuisine === c.name }"
            @click="selectCuisine(c.name)"
          >
            <span class="chip-name">{{ c.name }}</span>
            <span v-if="c.restaurant_count > 0" class="chip-count">{{ c.restaurant_count }}</span>
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
  background-color: #fbf8f3;
}

/* Food-Led Hero */
.marketplace-hero {
  position: relative;
  background: radial-gradient(circle at 80% 20%, #faede1 0%, #f7f1e6 60%, #f4ecdc 100%);
  padding: 3.5rem 0 3rem;
  border-bottom: 1px solid #ede4d5;
}

.hero-container {
  max-width: 1240px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 3rem;
  align-items: center;
}

.hero-badge-wrap {
  margin-bottom: 1rem;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #ebd9c8;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #29231f;
}

.hero-title {
  margin: 0 0 1rem;
  font-family: 'Playfair Display', serif;
  font-size: clamp(2rem, 4.5vw, 3.25rem);
  font-weight: 800;
  line-height: 1.15;
  color: #1f1a17;
  letter-spacing: -0.02em;
}

.hero-sub {
  margin: 0 0 2rem;
  font-size: 1.125rem;
  color: #5c554e;
  line-height: 1.6;
  max-width: 680px;
}

/* Address Card */
.hero-address-card {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 1.25rem;
  box-shadow: 0 12px 36px rgba(41, 35, 31, 0.08);
  border: 1px solid #ebd9c8;
}

.fulfilment-toggle {
  display: inline-flex;
  background-color: #f5efe7;
  padding: 0.3rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.25rem;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: #6b635b;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background-color: #ffffff;
  color: #29231f;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.address-trigger-wrap {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.address-trigger-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background-color: #fbf8f3;
  border: 1.5px solid #dfd7cc;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, background-color 0.2s;
}

.address-trigger-btn:hover {
  border-color: #c95028;
  background-color: #ffffff;
}

.address-pin-icon {
  font-size: 1.5rem;
  color: #c95028;
  flex-shrink: 0;
}

.address-trigger-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.trigger-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8c8278;
  font-weight: 600;
}

.trigger-val {
  font-size: 1rem;
  color: #29231f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-change-address {
  font-size: 0.875rem;
  font-weight: 700;
  color: #c95028;
  padding: 0.35rem 0.65rem;
  background-color: #fdf5f0;
  border-radius: 8px;
}

.btn-gps-hero {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.65rem 1rem;
  border-radius: 14px;
  background-color: #fdf5f0;
  border: 1.5px solid #f2cfbf;
  color: #c95028;
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.btn-gps-hero:hover:not(:disabled) {
  background-color: #fcece3;
}
.btn-gps-hero:disabled {
  opacity: 0.6;
}

/* Cuisine Bar */
.cuisine-bar-section {
  padding: 1.25rem 0;
  background-color: #ffffff;
  border-bottom: 1px solid #f0e9e1;
  position: sticky;
  top: 60px;
  z-index: 40;
}

.cuisine-scroll-container {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding: 0.25rem 0;
  scrollbar-width: thin;
}

.cuisine-scroll-container::-webkit-scrollbar {
  height: 4px;
}
.cuisine-scroll-container::-webkit-scrollbar-thumb {
  background: #dfd7cc;
  border-radius: 4px;
}

.cuisine-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background-color: #fbf8f3;
  border: 1px solid #e8e0d5;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #595048;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.cuisine-chip:hover {
  border-color: #c95028;
  color: #29231f;
  background-color: #ffffff;
}

.cuisine-chip.active {
  background-color: #29231f;
  color: #ffffff;
  border-color: #29231f;
}

.chip-count {
  font-size: 0.75rem;
  background-color: rgba(201, 80, 40, 0.15);
  color: #c95028;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
}
.cuisine-chip.active .chip-count {
  background-color: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* Results Section */
.results-section {
  padding: 2.5rem 0 4rem;
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
  color: #29231f;
}

.results-count {
  font-size: 0.875rem;
  color: #787067;
}

.search-input-box {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  max-width: 320px;
  background-color: #ffffff;
  border: 1.5px solid #dfd7cc;
  border-radius: 12px;
  padding: 0.4rem 0.75rem;
}

.search-input-box:focus-within {
  border-color: #c95028;
  box-shadow: 0 0 0 3px rgba(201, 80, 40, 0.15);
}

.search-icon {
  font-size: 1.125rem;
  color: #8c8278;
  margin-right: 0.5rem;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.875rem;
  color: #29231f;
}

.search-clear-btn {
  background: none;
  border: none;
  color: #8c8278;
  cursor: pointer;
  padding: 0;
}

.restaurants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.75rem;
}

/* State Containers */
.state-container {
  text-align: center;
  padding: 4rem 1.5rem;
  background-color: #ffffff;
  border-radius: 20px;
  border: 1px dashed #dfd7cc;
  color: #5c554e;
}

.spinner-terracotta {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(201, 80, 40, 0.2);
  border-top-color: #c95028;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-icon {
  font-size: 2.5rem;
  color: #c95028;
  margin-bottom: 0.5rem;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #fbf8f3;
  color: #8c8278;
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
  color: #29231f;
}

.empty-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 1.75rem;
  }
  .address-trigger-wrap {
    flex-direction: column;
  }
  .btn-gps-hero {
    width: 100%;
    flex-direction: row;
    padding: 0.6rem;
  }
  .search-input-box {
    max-width: 100%;
  }
}
.hero-food { position: relative; display: block; aspect-ratio: 4/5; overflow: hidden; border-radius: 48% 48% 16px 16px; color: white; }
.hero-food img { width: 100%; height: 100%; object-fit: cover; }
.hero-food > div { position: absolute; inset: auto 0 0; padding: 3rem 1.5rem 1.5rem; background: linear-gradient(transparent, #21140de6); }
.hero-food span, .hero-food strong { display: block; }
.hero-food strong { font-size: 1.7rem; margin-top: .4rem; }
.hero-editorial { padding: 4rem 2rem; border: 1px solid #dbb9a0; border-radius: 50% 50% 12px 12px; background: #efd9bd; text-align: center; color: #783522; }
.hero-editorial span, .hero-editorial em { display: block; font: 2.8rem/1.3 'Playfair Display', serif; }
.hero-editorial p { margin-top: 2rem; }
.location-notice { margin: 1rem 0; color: #655448; line-height: 1.6; }
.results-pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 2rem; }
.radius-control { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }
.radius-control select { padding: .6rem; border: 1px solid #dbb9a0; border-radius: 8px; background: white; }
@media (max-width: 760px) { .hero-container { grid-template-columns: 1fr; gap: 1.5rem; } .hero-food { aspect-ratio: 16/9; border-radius: 20px; } .hero-editorial { display: none; } }
</style>

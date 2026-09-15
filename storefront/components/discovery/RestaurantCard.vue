<script setup lang="ts">
import type { DiscoveryRestaurant } from '~/composables/useDiscovery'

const props = defineProps<{
  restaurant: DiscoveryRestaurant
  orderType: 'delivery' | 'collection'
}>()

const loc = computed(() => props.restaurant.selected_location)

const requestUrl = useRequestURL()
const restaurantUrl = computed(() => {
  const local = ['localhost', '127.0.0.1'].includes(requestUrl.hostname)
  const url = new URL(local ? '/' : props.restaurant.subdomain_url, requestUrl.origin)
  if (local) url.searchParams.set('restaurant', props.restaurant.slug)
  url.searchParams.set('location', String(loc.value.id))
  url.searchParams.set('order_type', props.orderType)
  return url.toString()
})
const money = (value: number) => new Intl.NumberFormat('de-CH', { style: 'currency', currency: props.restaurant.currency_code }).format(value)
</script>

<template>
  <a
    :href="restaurantUrl"
    class="restaurant-card"
    :aria-label="`${restaurant.name}, ${restaurant.cuisine_tags.join(', ')}`"
  >
    <!-- Visual Image Wrapper -->
    <div class="card-media">
      <img
        v-if="restaurant.cover_photo_url"
        :src="restaurant.cover_photo_url"
        :alt="`${restaurant.name} cover photo`"
        class="card-img"
        loading="lazy"
      />
      <!-- Quiet branded placeholder if no imagery exists -->
      <div v-else class="card-img-placeholder" aria-hidden="true">
        <span class="placeholder-glyph">
          <i class="ri-restaurant-2-fill" />
        </span>
        <span class="placeholder-name">{{ restaurant.name }}</span>
      </div>

      <!-- Live Availability / Time Badge -->
      <div v-if="loc.is_open !== null" class="card-status-badge" :class="{ closed: !loc.is_open }">
        <span class="status-dot" :class="{ active: loc.is_open }" />
        <span v-if="loc.is_open">
          {{ loc.estimated_minutes ? `Est. ${loc.estimated_minutes} min` : 'Open' }}
        </span>
        <span v-else>Closed</span>
      </div>

      <!-- Distance Tag -->
      <div v-if="loc.distance_km !== null" class="card-distance-badge">
        <i class="ri-map-pin-range-line" />
        <span>{{ loc.distance_km }} km</span>
      </div>
    </div>

    <!-- Details Content -->
    <div class="card-body">
      <div class="card-header-row">
        <div class="card-titles">
          <h3 class="restaurant-name">{{ restaurant.name }}</h3>
          <p v-if="restaurant.listing_description" class="restaurant-tagline">
            {{ restaurant.listing_description }}
          </p>
        </div>
        <img
          v-if="restaurant.logo_url"
          :src="restaurant.logo_url"
          alt=""
          class="restaurant-logo"
          loading="lazy"
        />
      </div>

      <!-- Cuisine Tags -->
      <div v-if="restaurant.cuisine_tags?.length" class="cuisine-tags-row">
        <span
          v-for="tag in restaurant.cuisine_tags.slice(0, 3)"
          :key="tag"
          class="cuisine-tag"
        >
          {{ tag }}
        </span>
      </div>

      <!-- Fulfilment & Pricing Footer -->
      <div class="card-meta-footer">
        <div v-if="orderType === 'delivery'" class="meta-item">
          <i class="ri-e-bike-2-line" />
          <span>
            {{ loc.delivery_charge > 0 ? `${money(loc.delivery_charge)} delivery` : 'Free delivery' }}
          </span>
        </div>
        <div v-else class="meta-item">
          <i class="ri-walk-line" />
          <span>Pickup available</span>
        </div>

        <span class="meta-dot">•</span>

        <div v-if="orderType === 'delivery' && loc.min_delivery_order > 0" class="meta-item">
          <span>Min. {{ money(loc.min_delivery_order) }}</span>
        </div>
        <div v-else class="meta-item">
          <span>No minimum</span>
        </div>
      </div>
    </div>
  </a>
</template>

<style scoped>
.restaurant-card {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #efe8df;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;
}

.restaurant-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(41, 35, 31, 0.08);
  border-color: #e5dacd;
}

.restaurant-card:focus-visible {
  outline: 2px solid #c95028;
  outline-offset: 3px;
}

.card-media {
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
  background-color: #f7f3ed;
  overflow: hidden;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.restaurant-card:hover .card-img {
  transform: scale(1.03);
}

.card-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f7f3ed 0%, #ece5da 100%);
  color: #8c8278;
  gap: 0.5rem;
  padding: 1rem;
}

.placeholder-glyph {
  font-size: 2.25rem;
  color: #c95028;
  opacity: 0.8;
}

.placeholder-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: #595048;
}

.card-status-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.65rem;
  background-color: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(6px);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #29231f;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-status-badge.closed {
  color: #8c8278;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #9e958c;
}
.status-dot.active {
  background-color: #22c55e;
}

.card-distance-badge {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background-color: rgba(28, 24, 21, 0.8);
  backdrop-filter: blur(4px);
  color: #ffffff;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.card-body {
  padding: 1.1rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.card-titles {
  flex: 1;
  min-width: 0;
}

.restaurant-name {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #29231f;
  line-height: 1.3;
}

.restaurant-tagline {
  margin: 0;
  font-size: 0.84rem;
  color: #6b635b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.restaurant-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #efe8df;
  background-color: #ffffff;
  flex-shrink: 0;
}

.cuisine-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.85rem;
}

.cuisine-tag {
  padding: 0.2rem 0.5rem;
  background-color: #fbf8f3;
  color: #665c52;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.card-meta-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid #f7f3ee;
  font-size: 0.8125rem;
  color: #665c52;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.meta-dot {
  color: #d1c8be;
}
</style>

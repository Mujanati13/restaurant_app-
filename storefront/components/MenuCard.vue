<script setup lang="ts">
import type { MenuItem } from '~/types/storefront'

const props = defineProps<{
  item: MenuItem
  currency: string
}>()

const emit = defineEmits<{
  add: [item: MenuItem]
}>()

const isAdded = ref(false)

function handleAdd() {
  emit('add', props.item)
  isAdded.value = true
  setTimeout(() => {
    isAdded.value = false
  }, 1200)
}

const formattedPrice = computed(() => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: props.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(props.item.price)
  } catch {
    return `$${Number(props.item.price || 0).toFixed(2)}`
  }
})
</script>

<template>
  <article class="menu-card">
    <div class="menu-image">
      <img
        v-if="item.image"
        :src="item.image"
        :alt="item.name"
        loading="lazy"
      >
      <div v-else class="menu-image-fallback" aria-hidden="true">
        <div class="fallback-glow" />
        <i class="ri-restaurant-2-line" />
        <span class="fallback-label">Chef Prepared</span>
      </div>
      <span v-if="item.is_special" class="menu-badge special-badge">
        <i class="ri-sparkling-fill" /> Chef's Special
      </span>
      <span v-else class="menu-badge popular-badge">
        <i class="ri-fire-fill" /> Popular
      </span>
    </div>

    <div class="menu-card-body">
      <div class="menu-card-content">
        <h3 class="menu-item-title">
          <NuxtLink :to="`/menu/${item.id}`">{{ item.name }}</NuxtLink>
        </h3>
        <p v-if="item.description" class="menu-item-desc">{{ item.description }}</p>
        <p v-else class="menu-item-desc placeholder-desc">Freshly prepared with authentic culinary ingredients.</p>
      </div>

      <div class="menu-card-foot">
        <div class="price-wrap">
          <span class="price-label">Price</span>
          <strong class="menu-item-price">{{ formattedPrice }}</strong>
        </div>
        <button
          class="btn primary small card-add-btn"
          :class="{ 'btn-added': isAdded }"
          type="button"
          :aria-label="`Add ${item.name} to cart`"
          @click="handleAdd"
        >
          <i v-if="isAdded" class="ri-check-line" />
          <i v-else class="ri-shopping-bag-3-line" />
          <span>{{ isAdded ? 'Added' : 'Add to cart' }}</span>
        </button>
      </div>
    </div>
  </article>
</template>

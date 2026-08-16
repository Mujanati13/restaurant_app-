<script setup lang="ts">
defineProps<{ loading?: boolean; error?: string | null; empty?: boolean; emptyTitle?: string; emptyText?: string }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <div v-if="loading" class="content-state" role="status"><span class="spinner"/><p>Loading…</p></div>
  <div v-else-if="error" class="content-state error-state" role="alert"><i class="ri-error-warning-line"/><h2>Something went wrong</h2><p>{{ error }}</p><button class="btn" @click="$emit('retry')">Try again</button></div>
  <div v-else-if="empty" class="content-state"><i class="ri-restaurant-line"/><h2>{{ emptyTitle || 'Nothing here yet' }}</h2><p>{{ emptyText || 'Please check back soon.' }}</p></div>
  <slot v-else />
</template>

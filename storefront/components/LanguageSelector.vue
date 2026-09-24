<script setup lang="ts">
const { locale, locales, t } = useLocale()
</script>

<template>
  <label class="language-selector">
    <span class="sr-only">{{ t('language.label') }}</span>
    <i class="ri-global-line" aria-hidden="true" />
    <select v-model="locale" :aria-label="t('language.label')">
      <option v-for="item in locales" :key="item.code" :value="item.code">{{ item.label }}</option>
    </select>
  </label>
</template>

<style scoped>
.language-selector {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 36px;
  padding: 0.25rem 0.45rem;
  border: 1px solid currentColor;
  border-color: color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 9px;
  color: inherit;
  background: transparent;
}
.language-selector i { font-size: 1rem; }
.language-selector select {
  max-width: 8.5rem;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}
@media (max-width: 520px) {
  .language-selector select { max-width: 2.5rem; }
}
</style>

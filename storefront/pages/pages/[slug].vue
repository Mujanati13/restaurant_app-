<script setup lang="ts">
const route = useRoute(); const tenant = useNuxtData<any>('tenant-bootstrap'); const headers = import.meta.server ? useRequestHeaders(['host', 'x-forwarded-host', 'x-forwarded-proto']) : undefined
const { data, error, status, refresh } = await useFetch<any>(`/api/v1/storefront/pages/${route.params.slug}`, { headers })
useSeoMeta({ title: () => data.value?.data ? `${data.value.data.title} — ${tenant.data.value.data.brand.identity.name}` : tenant.data.value.data.brand.identity.name,
  description: () => data.value?.data?.sections?.find((s: any) => s.type === 'custom_text')?.content?.text?.slice(0, 160) })
</script>
<template><div class="page section"><div class="container"><AsyncState :loading="status === 'pending'" :error="error?.message" :empty="!data?.data" @retry="refresh"><article v-if="data?.data" class="content-page"><h1>{{ data.data.title }}</h1><section v-for="section in data.data.sections" :key="section.id" v-show="section.visible" class="content-section"><h2 v-if="section.content?.heading">{{ section.content.heading }}</h2><p v-if="section.content?.text">{{ section.content.text }}</p><img v-if="section.content?.image_url" :src="section.content.image_url" :alt="section.content?.heading || ''"></section></article></AsyncState></div></div></template>

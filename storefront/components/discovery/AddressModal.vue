<script setup lang="ts">
import { useDiscovery, type AddressMatch } from '~/composables/useDiscovery'

const {
  selectedAddress,
  isAddressModalOpen,
  gpsStatus,
  gpsError,
  requestGpsLocation,
  searchAddresses,
  selectAddress,
} = useDiscovery()

const inputQuery = ref('')
const searching = ref(false)
const searchResults = ref<AddressMatch[]>([])
const searchSubmitted = ref(false)
const searchError = ref('')
const dialogRef = ref<HTMLDialogElement | null>(null)
let previousFocus: HTMLElement | null = null
let previousOverflow = ''
let searchVersion = 0

// Focus management
const searchInputRef = ref<HTMLInputElement | null>(null)

watch(isAddressModalOpen, (isOpen) => {
  if (isOpen) {
    previousFocus = document.activeElement as HTMLElement
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    searchError.value = ''
    inputQuery.value = selectedAddress.value
    searchResults.value = []
    searchSubmitted.value = false
    nextTick(() => {
      dialogRef.value?.showModal()
      searchInputRef.value?.focus()
    })
  } else {
    searchVersion++
    searching.value = false
    dialogRef.value?.close()
    document.body.style.overflow = previousOverflow
    previousFocus?.focus()
  }
})
onBeforeUnmount(() => { if (import.meta.client && isAddressModalOpen.value) document.body.style.overflow = previousOverflow })

const handleSearch = async () => {
  if (!inputQuery.value.trim()) return
  const version = ++searchVersion
  searchError.value = ''
  searching.value = true
  searchSubmitted.value = true
  try {
    const matches = await searchAddresses(inputQuery.value)
    if (version === searchVersion) searchResults.value = matches
  } catch (error: any) {
    if (version === searchVersion) searchError.value = error?.data?.message || 'Address search is unavailable. Please try again or use your location.'
  } finally {
    if (version === searchVersion) searching.value = false
  }
}

const handleSelect = (match: AddressMatch) => {
  selectAddress(match)
}

const handleUseGps = async () => {
  const ok = await requestGpsLocation()
  if (ok) {
    isAddressModalOpen.value = false
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    isAddressModalOpen.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialogRef"
      class="address-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-modal-title"
      @keydown="handleKeydown"
      @cancel.prevent="isAddressModalOpen = false"
      @click.self="isAddressModalOpen = false"
    >
      <div class="address-modal-card">
        <div class="modal-header">
          <div>
            <p class="modal-eyebrow">Deliveriano</p>
            <h2 id="address-modal-title" class="modal-title">Where should we deliver?</h2>
          </div>
          <button
            class="modal-close-btn"
            type="button"
            aria-label="Close modal"
            @click="isAddressModalOpen = false"
          >
            <i class="ri-close-line" />
          </button>
        </div>

        <div class="modal-body">
          <p class="modal-intro">
            Enter an address to see the restaurants, delivery times, and fees available to you.
          </p>

          <!-- Address Form -->
          <form class="address-search-form" @submit.prevent="handleSearch">
            <div class="address-input-wrapper">
              <i class="ri-search-2-line address-input-icon" />
              <input
                ref="searchInputRef"
                v-model="inputQuery"
                type="text"
                class="address-search-input"
                placeholder="e.g. Bahnhofstrasse 1, Zürich or 8001"
                aria-label="Street address or postcode"
                minlength="2"
                required
              />
              <button
                type="submit"
                class="btn primary btn-search"
                :disabled="searching || !inputQuery.trim()"
              >
                <span v-if="searching" class="spinner-sm" />
                <span v-else>Search</span>
              </button>
            </div>
          </form>

          <!-- Use GPS Location Button -->
          <div class="location-divider"><span>or</span></div>

          <div class="gps-action-row">
            <button
              type="button"
              class="btn-gps"
              :disabled="gpsStatus === 'requesting'"
              @click="handleUseGps"
            >
              <i v-if="gpsStatus === 'requesting'" class="ri-loader-4-line ri-spin" />
              <i v-else class="ri-crosshair-2-line" />
              <span>Use current location</span>
            </button>
          </div>

          <!-- GPS Error Banner -->
          <div v-if="gpsError" class="alert-notice warning" role="alert">
            <i class="ri-error-warning-line" />
            <span>{{ gpsError }}</span>
          </div>

          <!-- Selectable Address Matches List -->
          <div v-if="searching" class="matches-loading">
            <span class="spinner-sm" />
            <span>Looking up address matches…</span>
          </div>

          <div v-else-if="searchError" role="alert" class="alert-notice warning">{{ searchError }}</div>
          <div v-else-if="searchSubmitted && searchResults.length === 0" class="matches-empty">
            <i class="ri-map-pin-user-line text-muted" />
            <p>No address matches found for "{{ inputQuery }}".</p>
            <small>Try searching with a Swiss postal code or city name.</small>
          </div>

          <div v-else-if="searchResults.length > 0" class="matches-list-wrap">
            <h3 class="matches-heading">Suggested addresses</h3>
            <ul class="matches-list">
              <li
                v-for="(match, idx) in searchResults"
                :key="idx"
                class="match-item"
                role="button"
                tabindex="0"
                @click="handleSelect(match)"
                @keydown.enter="handleSelect(match)"
                @keydown.space.prevent="handleSelect(match)"
              >
                <div class="match-icon">
                  <i class="ri-map-pin-line" />
                </div>
                <div class="match-text">
                  <strong>{{ match.formatted_address }}</strong>
                  <span v-if="match.locality || match.postal_code" class="match-sub">
                    {{ [match.postal_code, match.locality, match.country].filter(Boolean).join(', ') }}
                  </span>
                </div>
                <i class="ri-arrow-right-s-line match-chevron" />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.address-modal-backdrop:not([open]) { display: none; }
.address-modal-backdrop { width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; border: 0;
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: rgba(28, 24, 21, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.address-modal-card {
  width: 100%;
  max-width: 520px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  overflow: hidden;
  animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #000000;
}

.text-terracotta {
  color: #06C167;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-close-btn:hover {
  background-color: #f5f5f5;
  color: #000;
}

.modal-body {
  padding: 1.5rem;
}

.modal-intro {
  margin: 0 0 1.25rem;
  font-size: 0.9375rem;
  color: #666;
  line-height: 1.5;
}

.address-search-form {
  margin-bottom: 1rem;
}

.address-input-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  background-color: #f5f5f5;
  border: 1.5px solid #e0e0e0;
  border-radius: 12px;
  padding: 0.25rem 0.35rem 0.25rem 0.75rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.address-input-wrapper:focus-within {
  border-color: #06C167;
  box-shadow: 0 0 0 3px rgba(6,193,103,0.15);
  background-color: #ffffff;
}

.address-input-icon {
  font-size: 1.25rem;
  color: #999;
  margin-right: 0.5rem;
}

.address-search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.6rem 0;
  font-size: 0.95rem;
  color: #000000;
  outline: none;
  font-family: inherit;
}

.btn-search {
  padding: 0.6rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  background-color: #06C167;
  color: #ffffff;
  border: none;
  cursor: pointer;
}
.btn-search:hover:not(:disabled) {
  background-color: #05a85a;
}
.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gps-action-row {
  margin-bottom: 1.25rem;
}

.btn-gps {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background-color: #f0faf5;
  border: 1px solid #c8e6d8;
  color: #06C167;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}
.btn-gps:hover:not(:disabled) {
  background-color: #e0f5ec;
  border-color: #a0d4b8;
}
.btn-gps:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}
.alert-notice.warning {
  background-color: #fff9e6;
  border: 1px solid #ffe399;
  color: #805b00;
}

.matches-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #6b635b;
  font-size: 0.95rem;
}

.matches-empty {
  text-align: center;
  padding: 2rem 1rem;
  color: #6b635b;
}
.matches-empty i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: block;
}
.matches-empty p {
  margin: 0 0 0.25rem;
  font-weight: 600;
  color: #29231f;
}

.matches-list-wrap {
  margin-top: 1rem;
}
.matches-heading {
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #999;
  margin: 0 0 0.5rem;
}

.matches-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
}

.match-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.15s;
}
.match-item:last-child {
  border-bottom: none;
}
.match-item:hover, .match-item:focus {
  background-color: #f9f9f9;
  outline: none;
}

.match-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f0faf5;
  color: #06C167;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.match-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.match-text strong {
  font-size: 0.9375rem;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.match-sub {
  font-size: 0.8125rem;
  color: #999;
}

.match-chevron {
  color: #b5ada4;
  font-size: 1.25rem;
}

/* Marketplace address sheet: intentionally neutral so restaurant branding does not compete with discovery. */
.address-modal-backdrop { background: rgba(0, 0, 0, .54); backdrop-filter: blur(8px); padding: 1.25rem; }
.address-modal-card { max-width: 560px; border-radius: 24px; box-shadow: 0 28px 80px rgba(0,0,0,.28); }
.modal-header { padding: 1.5rem 1.5rem 1.25rem; align-items: flex-start; border: 0; }
.modal-eyebrow { margin: 0 0 .3rem; color: #06c167; font-size: .72rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.modal-title { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: clamp(1.45rem, 4vw, 1.8rem); font-weight: 800; letter-spacing: -.04em; line-height: 1.1; }
.modal-close-btn { width: 38px; height: 38px; border-radius: 50%; background: #f3f3f3; font-size: 1.25rem; }
.modal-close-btn:hover { background: #e7e7e7; }
.modal-body { padding: 0 1.5rem 1.5rem; }
.modal-intro { max-width: 430px; margin-bottom: 1.4rem; color: #5f5f5f; font-size: .95rem; }
.address-search-form { margin: 0; }
.address-input-wrapper { min-height: 64px; padding: .35rem .4rem .35rem 1rem; background: #f3f3f3; border: 2px solid transparent; border-radius: 14px; }
.address-input-wrapper:focus-within { border-color: #000; box-shadow: 0 0 0 3px rgba(0,0,0,.1); background: #fff; }
.address-input-icon { color: #161616; margin-right: .7rem; }
.address-search-input { min-width: 0; font-size: .98rem; }
.address-search-input::placeholder { color: #777; }
.btn-search { min-height: 48px; padding: .6rem 1rem; border-radius: 10px; background: #000; font-weight: 750; }
.btn-search:hover:not(:disabled) { background: #262626; }
.location-divider { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: .75rem; margin: 1.2rem 0; color: #777; font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.location-divider::before,.location-divider::after { content: ''; height: 1px; background: #e7e7e7; }
.gps-action-row { margin: 0; }
.btn-gps { min-height: 54px; border: 1px solid #d8d8d8; border-radius: 13px; background: #fff; color: #151515; font-weight: 700; }
.btn-gps i { color: #06c167; font-size: 1.15rem; }
.btn-gps:hover:not(:disabled) { background: #f4fbf7; border-color: #06c167; }
.matches-list-wrap { margin-top: 1.5rem; }
.matches-heading { color: #707070; font-size: .72rem; font-weight: 800; letter-spacing: .08em; }
.matches-list { border: 0; border-radius: 0; max-height: 272px; }
.match-item { padding: .9rem .2rem; border-bottom-color: #ececec; }
.match-item:hover,.match-item:focus { background: #f7f7f7; border-radius: 10px; padding-inline: .6rem; }
.match-icon { width: 38px; height: 38px; background: #e9f9ef; color: #087b42; }
.match-text strong { color: #151515; font-size: .94rem; }

@media (max-width: 480px) {
  .address-modal-backdrop { align-items: flex-end; padding: 0; }
  .address-modal-card { max-width: none; border-radius: 24px 24px 0 0; }
  .modal-header { padding-top: 1.35rem; }
  .modal-body { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); }
  .address-input-wrapper { min-height: 58px; }
  .btn-search { padding-inline: .85rem; }
}
</style>

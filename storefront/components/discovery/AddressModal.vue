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
          <h2 id="address-modal-title" class="modal-title">
            <i class="ri-map-pin-2-fill text-terracotta" />
            <span>Choose delivery address</span>
          </h2>
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
            Enter your street address or postal town in Switzerland to see nearby restaurants and delivery fees.
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
                <span v-else>Find</span>
              </button>
            </div>
          </form>

          <!-- Use GPS Location Button -->
          <div class="gps-action-row">
            <button
              type="button"
              class="btn-gps"
              :disabled="gpsStatus === 'requesting'"
              @click="handleUseGps"
            >
              <i v-if="gpsStatus === 'requesting'" class="ri-loader-4-line ri-spin" />
              <i v-else class="ri-crosshair-2-line" />
              <span>Use my current location</span>
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
            <h3 class="matches-heading">Select your address:</h3>
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
</style>

export interface DiscoveryRestaurantLocation {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  distance_km: number | null
  delivery_charge: number
  min_delivery_order: number
  prep_time_minutes: number
  delivery_lead_time_minutes: number
  estimated_minutes: number
  offer_delivery: boolean
  offer_collection: boolean
  is_open: boolean | null
}

export interface DiscoveryRestaurant {
  id: string
  slug: string
  name: string
  cuisine_tags: string[]
  listing_description: string | null
  cover_photo_url: string | null
  logo_url: string | null
  subdomain_url: string
  currency_code: string
  currency_symbol: string
  selected_location: DiscoveryRestaurantLocation
}

export interface AddressMatch {
  formatted_address: string
  latitude: number
  longitude: number
  postal_code?: string
  locality?: string
  country?: string
}

export interface CuisineItem {
  name: string
  slug: string
  restaurant_count: number
}

export function useDiscovery() {
  const selectedAddress = useState<string>('discovery-address', () => '')
  const selectedCoordinates = useState<{ lat: number; lng: number } | null>('discovery-coordinates', () => null)
  const orderType = useState<'delivery' | 'collection'>('discovery-order-type', () => 'delivery')
  const searchQuery = useState<string>('discovery-search', () => '')
  const selectedCuisine = useState<string | null>('discovery-cuisine', () => null)
  const radiusKm = useState<number>('discovery-radius', () => 10)
  const isAddressModalOpen = useState<boolean>('discovery-address-modal-open', () => false)

  const gpsStatus = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('discovery-gps-status', () => 'idle')
  const gpsError = useState<string | null>('discovery-gps-error', () => null)

  const requestGpsLocation = async (): Promise<boolean> => {
    if (!import.meta.client || !navigator.geolocation) {
      gpsStatus.value = 'error'
      gpsError.value = 'Geolocation is not supported by your browser.'
      return false
    }

    gpsStatus.value = 'requesting'
    gpsError.value = null

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          gpsStatus.value = 'granted'
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          selectedCoordinates.value = { lat, lng }

          try {
            const res = await $fetch<{ data: AddressMatch }>('/api/v1/discovery/reverse-lookup', {
              query: { latitude: lat, longitude: lng },
            })
            if (res?.data?.formatted_address) {
              selectedAddress.value = res.data.formatted_address
            } else {
              selectedAddress.value = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
            }
          } catch {
            selectedAddress.value = `Current location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          }

          resolve(true)
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            gpsStatus.value = 'denied'
            gpsError.value = 'Location permission denied. Please search your address manually.'
          } else {
            gpsStatus.value = 'error'
            gpsError.value = 'Unable to determine your GPS location. Please enter an address.'
          }
          resolve(false)
        },
        { timeout: 10000, enableHighAccuracy: true },
      )
    })
  }

  const searchAddresses = async (queryText: string): Promise<AddressMatch[]> => {
    if (!queryText || queryText.trim().length < 2) return []
    const res = await $fetch<{ data: AddressMatch[] }>('/api/v1/discovery/address-lookup', {
        query: { query: queryText.trim() },
      })
    return res.data || []
  }

  const selectAddress = (match: AddressMatch) => {
    selectedAddress.value = match.formatted_address
    selectedCoordinates.value = { lat: match.latitude, lng: match.longitude }
    isAddressModalOpen.value = false
  }

  return {
    selectedAddress,
    selectedCoordinates,
    orderType,
    searchQuery,
    selectedCuisine,
    radiusKm,
    isAddressModalOpen,
    gpsStatus,
    gpsError,
    requestGpsLocation,
    searchAddresses,
    selectAddress,
  }
}

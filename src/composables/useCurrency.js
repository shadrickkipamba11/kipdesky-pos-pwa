// src/composables/useCurrency.js
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import localForage from 'localforage'

export function useCurrency() {
  const auth = useAuthStore()
  const fallbackSymbol = 'K' // sensible default for Zambia if nothing found
  const cachedStore = ref(null)

  // Try to load store from IndexedDB if not already in auth.store (offline case)
  onMounted(async () => {
    if (!auth.store) {
      try { cachedStore.value = await localForage.getItem('store') } catch {}
    }
  })

  const currentStore = computed(() => auth.store || cachedStore.value || {})

  const mapCodeToSymbol = (code) => {
    if (!code) return null
    const m = {
      ZMW: 'K', USD: '$', EUR: '€', GBP: '£', ZAR: 'R', BWP: 'P',
      MWK: 'MK', KES: 'KSh', TZS: 'TSh', NAD: '$', ZWL: '$'
    }
    return m[String(code).toUpperCase()] || null
  }

  const currencySymbol = computed(() => {
    const s = currentStore.value
    // try a few common field names
    return (
      s.currency_symbol ||
      s.currencySign ||
      s.currencySymbol ||
      mapCodeToSymbol(s.currency_code || s.currency) ||
      fallbackSymbol
    )
  })

  const formatMoney = (n) =>
    `${currencySymbol.value}${Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`

  return { currencySymbol, formatMoney }
}

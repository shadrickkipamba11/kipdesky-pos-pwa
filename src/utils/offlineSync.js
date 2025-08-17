// src/utils/offlineSync.js
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import localForage from 'localforage'

// Configure localForage
localForage.config({
  driver: [localForage.INDEXEDDB, localForage.WEBSQL, localForage.LOCALSTORAGE],
  name: 'KipdeskyPOS',
  storeName: 'offline_data'
})

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const flushPendingSales = async () => {
  const auth = useAuthStore()
  const list = (await localForage.getItem('pending_sales')) || []
  if (!list.length || !auth.token) return 0

  const headers = { Authorization: `Bearer ${auth.token}` }
  const remaining = []

  for (const sale of list) {
    try {
      await axios.post(`${API_BASE_URL}/sales`, sale, { headers })
      // success: drop it
    } catch (e) {
      // keep it for next round
      remaining.push(sale)
    }
  }

  await localForage.setItem('pending_sales', remaining)
  return list.length - remaining.length
}

// Data structure for offline storage
const DATA_TABLES = {
  products: 'products',
  customers: 'customers',
  promotions: 'promotions',
  sales: 'sales',
  store: 'store'
}

// ✅ Exported again
export const getLocalData = async (table) => {
  try {
    return await localForage.getItem(table)
  } catch (error) {
    console.error('Error getting local data:', error)
    return null
  }
}

// Sync all data
export const syncAllData = async () => {
  try {
    const authStore = useAuthStore()
    if (!authStore.token) return false

    const [products, customers, promotions, sales, store] = await Promise.all([
      axios.get(`${API_BASE_URL}/products`),
      axios.get(`${API_BASE_URL}/customers`),
      axios.get(`${API_BASE_URL}/promotions`),
      axios.get(`${API_BASE_URL}/fetchsales`),
      axios.get(`${API_BASE_URL}/stores`)
    ])

    await Promise.all([
      localForage.setItem(DATA_TABLES.products, products.data),
      localForage.setItem(DATA_TABLES.customers, customers.data),
      localForage.setItem(DATA_TABLES.promotions, promotions.data),
      localForage.setItem(DATA_TABLES.sales, sales.data),
      localForage.setItem(DATA_TABLES.store, store.data[0]) // first item only
    ])

    await localForage.setItem('lastSync', new Date().toISOString())
    return true
  } catch (error) {
    console.error('Sync error:', error)
    return false
  }
}

// Periodic sync setup
let syncInterval = null
export const startPeriodicSync = (interval = 30000) => {
  if (syncInterval) clearInterval(syncInterval)
  syncAllData()
  flushPendingSales()

  syncInterval = setInterval(() => {
    syncAllData()
    flushPendingSales()
  }, interval)
}
export const stopPeriodicSync = () => {
  if (syncInterval) clearInterval(syncInterval)
  syncInterval = null
}

// Check if data needs refresh (more than 5 minutes old)
export const needsRefresh = async () => {
  const lastSync = await localForage.getItem('lastSync')
  if (!lastSync) return true
  return (Date.now() - new Date(lastSync).getTime()) > 5 * 60 * 1000
}

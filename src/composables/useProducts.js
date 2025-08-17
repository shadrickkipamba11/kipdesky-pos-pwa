import { ref, onMounted } from 'vue'
import { getLocalData, needsRefresh, syncAllData } from '@/utils/offlineSync'
import { useAuthStore } from '@/stores/auth'

export function useProducts() {
  const products = ref([])
  const loading = ref(false)
  const error = ref(null)
  const authStore = useAuthStore()

  const loadProducts = async () => {
    loading.value = true
    error.value = null
    
    try {
      // Check if we need fresh data
      if (authStore.isOnline && await needsRefresh()) {
        await syncAllData()
      }
      
      // Get from local storage
      const localProducts = await getLocalData('products')
      
      if (localProducts) {
        // Filter products for current outlet
        products.value = localProducts.filter(product => 
          product.stocks.some(stock => stock.outlet_id === authStore.user?.outlet_id)
        )
      } else if (authStore.isOnline) {
        // Fallback to API if no local data
        await syncAllData()
        await loadProducts()
      } else {
        throw new Error('No offline data available')
      }
    } catch (err) {
      error.value = err.message
      console.error('Error loading products:', err)
    } finally {
      loading.value = false
    }
  }

  onMounted(loadProducts)

  return { products, loading, error, refresh: loadProducts }
}
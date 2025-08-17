// src/composables/useAuth.js
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()
  const error = ref(null)
  const loading = ref(false)

  /**
   * @param {Object} credentials { email, password }
   * @param {boolean} remember  persist to localStorage (default true)
   */
  const login = async (credentials, remember = true) => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, credentials)
      await authStore.setAuth(data, { remember })
      router.push('/pos')
      return true
    } catch (err) {
      error.value = err?.response?.data?.message || 'Login failed. Please try again.'
      return false
    } finally {
      loading.value = false
    }
  }

  return { login, error, loading }
}

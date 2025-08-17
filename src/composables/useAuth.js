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
  const login = async (credentials, opts = {}) => {
    loading.value = true
    error.value = null
    try {
      const { data } = await axios.post('/login', credentials)
 
       // Save tokens and user data (do not let sync errors mark login as failed)
       try {
         await authStore.setAuth(data, { remember: opts.remember !== false })
       } catch (e) {
         console.warn('[login] setAuth warnings:', e)
       }
 
       // Redirect to dashboard
      router.push('/pos')
    } catch (err) {
      error.value = err?.response?.data?.message || 'Login failed. Please try again.'
      return false
    } finally {
      loading.value = false
    }
  }

  return { login, error, loading }
}

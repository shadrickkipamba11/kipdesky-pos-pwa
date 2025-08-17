// src/stores/auth.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { syncAllData, startPeriodicSync, stopPeriodicSync } from '@/utils/offlineSync'

const API = '/api'
const KEY_PERSIST = 'auth.session.v1'      // localStorage (survives app close)
const KEY_SESSION = 'auth.session.tmp.v1'  // sessionStorage (tab-only)

// internal flags
let interceptorsAttached = false
let refreshInFlight = null

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const store = ref(null)
  const token = ref(null)
  const refreshToken = ref(null)
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const initialized = ref(false)
  const lastValidatedAt = ref(null)

  // network listeners
  if (typeof window !== 'undefined') {
    const updateStatus = () => { isOnline.value = navigator.onLine }
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
  }

  /* ---------------- storage helpers ---------------- */
  const applyAuthHeader = (tok) => {
    if (tok) axios.defaults.headers.common.Authorization = `Bearer ${tok}`
    else delete axios.defaults.headers.common.Authorization
  }

  const readPersisted = () => {
    const ls = localStorage.getItem(KEY_PERSIST)
    const ss = sessionStorage.getItem(KEY_SESSION)
    try { return JSON.parse(ls || ss || 'null') } catch { return null }
  }

  const writePersisted = (payload, remember = true) => {
    const data = JSON.stringify(payload)
    if (remember) {
      localStorage.setItem(KEY_PERSIST, data)
      sessionStorage.removeItem(KEY_SESSION)
    } else {
      sessionStorage.setItem(KEY_SESSION, data)
      localStorage.removeItem(KEY_PERSIST)
    }
  }

  const clearPersisted = () => {
    localStorage.removeItem(KEY_PERSIST)
    sessionStorage.removeItem(KEY_SESSION)
  }

  const applySession = ({ token: t, refresh_token: rt, user: u, store: s }) => {
    token.value = t || null
    refreshToken.value = rt || null
    user.value = u || null
    store.value = s || null
    applyAuthHeader(token.value)
  }

  /* ---------------- public actions ---------------- */
  const setAuth = async (data, { remember = true } = {}) => {
    applySession({
      token: data.token,
      refresh_token: data.refresh_token,
      user: data.user,
      store: data.store || data.user?.store || null,
    })
    writePersisted({
      token: token.value,
      refresh_token: refreshToken.value,
      user: user.value,
      store: store.value,
    }, remember)

    // first sync
    try {
       await syncAllData()
     } catch (e) {
       console.warn('[auth] initial offline sync failed (continuing):', e)
     }
     startPeriodicSync()
  }

  const init = async () => {
    if (initialized.value) return
    const saved = readPersisted()
    if (saved?.token) {
      applySession(saved)
      // try a silent validate if online; if it fails, try refresh
      if (isOnline.value) {
        try {
          const { data } = await axios.get(`${API}/validate-token`)
          if (data?.user) {
            user.value = data.user
            store.value = data.user.store || saved.store || null
            writePersisted({
              token: token.value,
              refresh_token: refreshToken.value,
              user: user.value,
              store: store.value,
            }, true)
            lastValidatedAt.value = new Date().toISOString()
          }
        } catch {
          // token might be expired – try refresh, but keep user in the app
          try { await refresh() } catch { /* ignore – will refresh on first 401 */ }
        }
      }
      // background sync when online
      if (isOnline.value) {
        await syncAllData().catch(() => {})
        startPeriodicSync()
      }
    }
    attachInterceptors()
    initialized.value = true
  }

  const logout = async () => {
    try {
      if (token.value) await axios.post(`${API}/logout`)
    } catch {/* ignore */}
    user.value = null
    store.value = null
    token.value = null
    refreshToken.value = null
    clearPersisted()
    applyAuthHeader(null)
    stopPeriodicSync()
  }

  const refresh = async () => {
    if (!refreshToken.value) throw new Error('No refresh token')
    if (refreshInFlight) return refreshInFlight

    // IMPORTANT: refresh endpoint must NOT require auth header
    refreshInFlight = axios.post(`${API}/refresh-token`, {
      refresh_token: refreshToken.value,
    }, { headers: {} }).then(({ data }) => {
      applySession({
        token: data.token,
        refresh_token: data.refresh_token,
        user: data.user || user.value,
        store: data.user?.store || store.value,
      })
      writePersisted({
        token: token.value,
        refresh_token: refreshToken.value,
        user: user.value,
        store: store.value,
      }, true)
      lastValidatedAt.value = new Date().toISOString()
      refreshInFlight = null
      return data
    }).catch(err => {
      refreshInFlight = null
      throw err
    })

    return refreshInFlight
  }

  /* ---------------- axios interceptors ---------------- */
  const attachInterceptors = () => {
    if (interceptorsAttached) return
    interceptorsAttached = true

    axios.interceptors.request.use((config) => {
      // token is already in axios.defaults, but keep it safe if custom instances are used
      if (token.value) {
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token.value}` }
      }
      return config
    })

    axios.interceptors.response.use(
      res => res,
      async (error) => {
        const { config, response } = error || {}
        const original = config || {}

        if (response?.status === 401 && !original._retry && !/\/refresh-token$/.test(original.url || '')) {
          original._retry = true
          try {
            await refresh()
            original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token.value}` }
            return axios(original)
          } catch {
            await logout()
          }
        }
        return Promise.reject(error)
      }
    )
  }

  return {
    // state
    user, store, token, refreshToken, isOnline, initialized, lastValidatedAt,
    // actions
    setAuth, init, logout, refresh,
  }
})

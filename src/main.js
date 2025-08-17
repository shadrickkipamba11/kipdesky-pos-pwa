// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import '@fortawesome/fontawesome-free/css/all.css'

// PWA registration (auto update)
import { registerSW } from 'virtual:pwa-register'
import { useAuthStore } from '@/stores/auth'

registerSW({ immediate: true })

const app = createApp(App)
app.use(createPinia())
app.use(router)

// 🚀 Restore session silently before mounting the app
;(async () => {
  const auth = useAuthStore()
  await auth.init()              // reads saved token, validates/refreshes if needed
  app.mount('#app')
})()

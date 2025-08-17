<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  authStore.init()
  
  // Redirect to install if not running as PWA
  if (!window.matchMedia('(display-mode: standalone)').matches && 
      !window.location.pathname.startsWith('/install')) {
    router.replace('/install')
  }
})
</script>
<template>
  <div class="app-layout">
    <TopNav @toggle-sidebar="sidebarOpen = !sidebarOpen" />

    <SideNav
      :is-open="sidebarOpen"
      @close-sidebar="sidebarOpen = false"
      @refresh-data="refreshData"
      @new-sale="startNewSale"
    />

    <main class="main-content" :class="{ 'sidebar-open': sidebarOpen }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TopNav from '@/components/TopNav.vue'
import SideNav from '@/components/SideNav.vue'
import { syncAllData } from '@/utils/offlineSync'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const sidebarOpen = ref(false)
const cart = useCartStore()

const refreshData = async () => { await syncAllData() }
const startNewSale = () => { cart.clear(); router.push({ name: 'pos' }); sidebarOpen.value = false }
</script>

<style scoped>
/* optional: keep your existing layout styles if they lived in PosScreen */
</style>

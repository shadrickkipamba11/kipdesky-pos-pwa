<template>
  <div>
    <h1>Welcome, {{ authStore.user.first_name }}</h1>
    <p>Outlet: {{ authStore.user.outlet.name }}</p>
    <p>Store: {{ authStore.store.name }}</p>
    <button @click="logout">Logout</button>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const logout = () => {
  authStore.logout()
}
</script>
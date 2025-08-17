<template>
  <nav class="top-nav">
    <button class="menu-toggle" @click="$emit('toggle-sidebar')" aria-label="Toggle menu">
      <i class="fas fa-bars"></i>
    </button>
    <div class="nav-content">
      <h1 class="app-title">Kipdesky POS</h1>
      <div class="user-info">
        <span class="user-name">{{ user?.first_name || 'User' }}</span>
        <button @click="logout" class="logout-btn" aria-label="Logout">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
      <!-- <div class="sync-status">
      <i class="fas" 
         :class="{
           'fa-wifi': isOnline,
           'fa-wifi-slash': !isOnline,
           'text-success': isOnline,
           'text-danger': !isOnline
         }"
         :title="isOnline ? 'Online' : 'Offline'"
      ></i>
    </div> -->
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const user = authStore.user

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #27293d;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
}

.menu-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  margin-right: 12px;
  cursor: pointer;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.menu-toggle:hover {
  background-color: rgba(255,255,255,0.1);
}

.menu-toggle:active {
  background-color: rgba(255,255,255,0.2);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.app-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.logout-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background: rgba(255,255,255,0.2);
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .top-nav {
    height: 64px;
    padding: 0 24px;
  }
  
  .app-title {
    font-size: 1.5rem;
  }
  
  .user-name {
    max-width: 200px;
    font-size: 1rem;
  }
}
</style>
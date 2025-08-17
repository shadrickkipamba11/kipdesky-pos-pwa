<template>
  <aside class="side-nav" :class="{ open: isOpen }" @click.self="$emit('close-sidebar')">
    <div class="nav-header">
      <h3>Menu</h3>
      <button class="close-btn" @click="$emit('close-sidebar')" aria-label="Close menu">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <ul class="nav-links">
      <li>
        <router-link to="/pos" exact-active-class="active" @click="$emit('close-sidebar')">
          <i class="fas fa-cash-register"></i><span>POS</span>
        </router-link>
      </li>
      <li>
        <router-link to="/sales" exact-active-class="active" @click="$emit('close-sidebar')">
          <i class="fas fa-receipt"></i><span>Sales</span>
        </router-link>
      </li>
      <li>
        <router-link to="/stock" exact-active-class="active" @click="$emit('close-sidebar')">
          <i class="fas fa-boxes-stacked"></i><span>Stock</span>
        </router-link>
      </li>
      <li>
        <router-link to="/customers" exact-active-class="active" @click="$emit('close-sidebar')">
          <i class="fas fa-users"></i><span>Customers</span>
        </router-link>
      </li>
      <li>
        <router-link to="/daily-cash" exact-active-class="active" @click="$emit('close-sidebar')">
          <i class="fas fa-sack-dollar"></i><span>Daily Cash</span>
        </router-link>
      </li>
      <li>
        <router-link to="/info" exact-active-class="active" @click="$emit('close-sidebar')">
          <i class="fas fa-info-circle"></i><span>Info</span>
        </router-link>
      </li>
    </ul>
  </aside>

  <div v-if="isOpen" class="backdrop" @click="$emit('close-sidebar')"></div>
</template>

<script setup>
defineProps({ isOpen: Boolean })
defineEmits(['close-sidebar', 'new-sale', 'refresh-data'])
</script>

<style scoped>
.side-nav {
  position: fixed;
  top: 56px;
  left: 0;
  bottom: 0;
  width: 280px;
  background-color: #27293d;
  color: var(--sidebar-text);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 998;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  overflow-y: auto;
}

.side-nav.open {
  transform: translateX(0);
}

.nav-header {
  padding: 16px;
  border-bottom: 1px solid var(--sidebar-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  color: var(--sidebar-text);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 8px;
}

.nav-links {
  list-style: none;
  padding: 8px 0;
  margin: 0;
}

.nav-links li a {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: var(--sidebar-text);
  text-decoration: none;
  transition: background-color 0.2s;
}

.nav-links li a:hover {
  background-color: var(--sidebar-hover);
}

.nav-links li a.active {
  background-color: var(--sidebar-active);
  color: var(--sidebar-active-text);
}

.nav-links li a i {
  margin-right: 12px;
  width: 24px;
  text-align: center;
  font-size: 1.1rem;
}

.backdrop {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  z-index: 997;
}

/* Responsive adjustments */
@media (min-width: 992px) {
  .side-nav {
    transform: translateX(0);
    top: 64px;
  }
  
  .backdrop {
    display: none;
  }
  
  .close-btn {
    display: none;
  }
}

@media (min-width: 768px) {
  .side-nav {
    top: 64px;
  }
  
  .backdrop {
    top: 64px;
  }
}

.action-btn {
  width: 100%;
  display: flex; align-items: center; gap: .75rem;
  padding: .75rem 1rem; border: none; background: transparent; cursor: pointer;
  border-radius: .5rem; font: inherit;
}
.action-btn:hover { background: rgba(0,0,0,.06); }
.divider { margin: .5rem 0; border-top: 1px solid rgba(0,0,0,.08); list-style: none; }
</style>
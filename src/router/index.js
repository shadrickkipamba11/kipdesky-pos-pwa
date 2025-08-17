import { createRouter, createWebHistory } from 'vue-router'
import InstallView from '@/views/InstallView.vue'
import LoginView from '@/views/LoginView.vue'

// layout
import AppShell from '@/layouts/AppShell.vue'

// views
import PosScreen from '@/views/PosScreen.vue'
import SalesView from '@/views/SalesView.vue'
import StockView from '@/views/StockView.vue'
import CustomersView from '@/views/CustomersView.vue'
import InfoView from '@/views/InfoView.vue'
import DailyCashView from '@/views/DailyCashView.vue'
import CheckoutView from '@/views/CheckoutView.vue' // <-- keep import

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // routes WITHOUT nav
    { path: '/install', name: 'install', component: InstallView },
    { path: '/login', name: 'login', component: LoginView, meta: { requiresPWA: true } },

    // checkout WITHOUT nav (top-level)
    { path: '/checkout', name: 'checkout', component: CheckoutView, meta: { requiresAuth: true, requiresPWA: true } },

    // everything else UNDER the shell (WITH nav)
    {
      path: '/',
      component: AppShell,
      children: [
        { path: '', redirect: '/pos' },
        { path: 'pos', name: 'pos', component: PosScreen, meta: { requiresAuth: true, requiresPWA: true } },
        { path: 'sales', name: 'sales', component: SalesView, meta: { requiresAuth: true, requiresPWA: true } },
        { path: 'stock', name: 'stock', component: StockView, meta: { requiresAuth: true, requiresPWA: true } },
        { path: 'customers', name: 'customers', component: CustomersView, meta: { requiresAuth: true, requiresPWA: true } },
        { path: 'info', name: 'info', component: InfoView, meta: { requiresAuth: true, requiresPWA: true } },
        { path: 'daily-cash', name: 'daily-cash', component: DailyCashView, meta: { requiresAuth: true, requiresPWA: true } },
      ]
    },
  ]
})

router.beforeEach(async (to, from, next) => {
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()
  authStore.init()

  const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches
  if (to.meta.requiresPWA && !isPWAInstalled) next('/install')
  else if (to.meta.requiresAuth && !authStore.token) next('/login')
  else next()
})

export default router

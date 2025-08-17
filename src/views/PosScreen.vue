<template>
  <div class="app-layout">
    <TopNav @toggle-sidebar="toggleSidebar" />
    <SideNav
      v-if="sidebarOpen"
      :is-open="sidebarOpen"
      @close-sidebar="sidebarOpen = false"
      @refresh-data="refreshData"
      @new-sale="startNewSale"
    />

    <main class="main-content" :class="{ 'sidebar-open': sidebarOpen }">
      <!-- bottom padding so floating bar doesn't cover content -->
      <div class="pos-container p-3 has-fab-padding">
        <div class="pos-header">
          <h2>Point of Sale</h2>
        </div>

        <!-- Search / Barcode -->
        <div class="search-bar bg-light">
          <i class="fas fa-magnifying-glass"></i>
          <input
            ref="searchInputRef"
            v-model="search"
            type="text"
            class="search-input"
            placeholder="Search name, SKU, or barcode"
            @keydown.enter.prevent="onSearchEnter"
            autocomplete="off"
          />
          <button
            v-if="search"
            class="clear-btn"
            @click="search = ''"
            aria-label="Clear search"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div v-if="error" class="alert alert-danger">
          {{ error }}
          <span v-if="!authStore.isOnline" class="offline-badge">Offline</span>
        </div>

        <!-- Products Grid -->
        <div class="products-panel">
          <h5>Product List</h5>

          <div v-if="loading" class="loading">Loading products…</div>
          <div v-else class="product-grid">
            <div
              v-for="product in filteredProducts"
              :key="product.id"
              class="product-card"
              :class="{ selected: cart.isSelected(product.id) }"
              @click="toggleSelect(product)"
            >
              <div class="card-top">
                <div
                  class="avatar"
                  :class="{ selected: cart.isSelected(product.id) }"
                  aria-hidden="true"
                >
                  <span v-if="!cart.isSelected(product.id)">{{ initials(product.name) }}</span>
                  <i v-else class="fas fa-check"></i>
                </div>
                <div class="product-info">
                  <h4 class="name" :title="product.name">{{ product.name }}</h4>
                  <div class="meta">
                    <span class="sku" v-if="product.sku">SKU: {{ product.sku }}</span>
                    <span class="barcode" v-if="product.barcode">• {{ product.barcode }}</span>
                  </div>

                  <!-- Promo badge -->
                  <div
                    v-if="promoForProduct(product)?.value > 0"
                    class="promo-badge"
                    :title="promoForProduct(product).tooltip"
                  >
                    Promo − {{ fmtMoney(promoForProduct(product).value) }}
                    <span class="pct" v-if="promoForProduct(product).percent > 0">
                      ({{ promoForProduct(product).percent.toFixed(0) }}%)
                    </span>
                  </div>
                </div>
              </div>

              <div class="card-bottom">
                <div class="stock">{{ stockQty(product) }} in stock</div>
                <div class="price">
                  {{ fmtMoney(unitPrice(product)) }}
                </div>
              </div>
            </div>

            <div v-if="!filteredProducts.length" class="empty-state">
              No products match “{{ search }}”.
            </div>
          </div>
        </div>

        <!-- Floating action bar -->
        <div
          v-if="cart.totalProducts > 0"
          class="checkout-float"
          role="region"
          aria-label="Cart actions"
        >
          <div class="totals">
            <span class="label">Subtotal</span>
            <span class="value">{{ fmtMoney(cart.subTotal) }}</span>
            <span class="sep">•</span>
            <span class="label">Items</span>
            <span class="value">{{ cart.totalProducts }}</span>
          </div>
          <div class="actions">
            <button class="btn btn-outline" @click="clearSelection">
              <i class="fas fa-broom"></i> Clear
            </button>
            <button class="btn btn-primary" @click="goCheckout">
              <i class="fas fa-shopping-cart"></i> Checkout
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue"
import { useRouter } from "vue-router"
import { useProducts } from "@/composables/useProducts"
import { useAuthStore } from "@/stores/auth"
import { useCartStore } from "@/stores/cart"
import { useCurrency } from "@/composables/useCurrency"
import { getLocalData } from "@/utils/offlineSync"
import TopNav from "@/components/TopNav.vue"
import SideNav from "@/components/SideNav.vue"

const router = useRouter()
const authStore = useAuthStore()
const cart = useCartStore()
const { products, loading, error, refresh: refreshProducts } = useProducts()
const { formatMoney } = useCurrency()

const fmtMoney = (n) => formatMoney(Number(n || 0))

const sidebarOpen = ref(false)
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }

// --- Search / barcode ---
const search = ref("")
const searchInputRef = ref(null)
onMounted(() => { nextTick(() => searchInputRef.value?.focus()) })

const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return products.value
  return products.value.filter((p) => {
    const name = (p.name || "").toLowerCase()
    const sku = (p.sku || "").toLowerCase()
    const barcode = (p.barcode ?? p.bar_code ?? p.barcode_number ?? "")
      .toString()
      .toLowerCase()
    return name.includes(q) || sku.includes(q) || barcode.includes(q)
  })
})

const onSearchEnter = () => {
  const q = search.value.trim().toLowerCase()
  if (!q) return
  const exact = products.value.find((p) => {
    const cands = [p.barcode, p.bar_code, p.barcode_number, p.sku]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase())
    return cands.includes(q)
  })
  const target = exact || filteredProducts.value[0]
  if (target) toggleSelect(target)
  search.value = ""
}

// --- Product helpers ---
const stockForOutlet = (product) =>
  product.stocks?.find((s) => s.outlet_id === authStore.user?.outlet_id) || null
const stockQty = (product) => stockForOutlet(product)?.quantity ?? 0
const unitPrice = (product) => Number(stockForOutlet(product)?.unit_price ?? 0)
const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("")

// --- Selection uses cart store ---
const toggleSelect = (p) => { cart.toggle(p, unitPrice(p)) }
const clearSelection = () => { cart.clear(); nextTick(() => searchInputRef.value?.focus()) }

// --- Actions moved from header to SideNav ---
const refreshData = async () => { await refreshProducts() }
const startNewSale = () => { clearSelection() }

// --- Checkout navigation ---
const goCheckout = () => { router.push({ name: "checkout" }) }

// ======================= Promotions =======================
const promotions = ref([])

// Load promotions from IndexedDB
const loadPromotionsFromIDB = async () => {
  try {
    const local = await getLocalData("promotions")
    if (Array.isArray(local)) promotions.value = local
  } catch { /* ignore */ }
}
onMounted(loadPromotionsFromIDB)

// Helpers to determine promotions
const todayYmd = () => new Date().toISOString().slice(0, 10)
const outletIdStr = computed(() => String(authStore.user?.outlet_id ?? ""))

const isPromoActive = (p) => {
  const today = todayYmd()
  const from = String(p.valid_from || "")
  const to = String(p.valid_to || "")
  const inDate = (!from || today >= from) && (!to || today <= to)
  const outlets = Array.isArray(p.outlet) ? p.outlet.map(String) : []
  const inOutlet = outlets.length ? outlets.includes(outletIdStr.value) : true
  return inDate && inOutlet
}
const productIdsFromPromo = (p) => {
  if (Array.isArray(p.product)) return p.product.map(String)
  try {
    const arr = JSON.parse(p.product)
    return Array.isArray(arr) ? arr.map(String) : []
  } catch {
    return []
  }
}
const promosForProduct = (productId) =>
  promotions.value.filter(
    (p) => isPromoActive(p) && productIdsFromPromo(p).includes(String(productId))
  )

// Compute promo value per unit & effective percent
const promoForProduct = (product) => {
  const price = unitPrice(product)
  if (!price) return { value: 0, percent: 0, tooltip: "" }

  const promos = promosForProduct(product.id)
  if (!promos.length) return { value: 0, percent: 0, tooltip: "" }

  let totalValue = 0
  let percParts = [] // for tooltip only
  for (const p of promos) {
    const type = String(p.discount_type || "").toLowerCase()
    const val = Number(p.discount_value || 0)
    if (type === "percentage") {
      totalValue += price * (val / 100)
      percParts.push(`${val}%`)
    } else if (["value", "fixed", "amount"].includes(type)) {
      totalValue += val
      percParts.push(`-${val}`)
    }
  }
  totalValue = Math.max(0, Math.min(totalValue, price))
  const effPercent = (totalValue / price) * 100
  return {
    value: totalValue,
    percent: effPercent,
    tooltip: `Promos: ${percParts.join(" + ")}`
  }
}

// =================== Silent refresh (30s) ===================
let silentTimer = null
const silentRefresh = async () => {
  try {
    // Refresh products from IndexedDB without toggling spinner
    const local = await getLocalData("products")
    if (Array.isArray(local)) {
      const filtered = local.filter((product) =>
        (product.stocks || []).some((s) => s.outlet_id === authStore.user?.outlet_id)
      )
      // replace list (keeps reactivity)
      products.value = filtered
    }
    // Refresh promotions too
    await loadPromotionsFromIDB()
  } catch { /* ignore */ }
}

onMounted(() => {
  silentTimer = setInterval(silentRefresh, 30000) // every 30s
})
onBeforeUnmount(() => {
  if (silentTimer) clearInterval(silentTimer)
})

// Also refresh products list when outlet/user changes
watch(
  () => authStore.user?.outlet_id,
  () => { silentRefresh() }
)
</script>

<style scoped>
/* Give room for floating bar */
.has-fab-padding {
  padding-bottom: calc(env(safe-area-inset-bottom, 0) + 96px);
}

.pos-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
  margin: 0 0 1rem 0;
}
.search-bar i.fa-magnifying-glass { opacity: 0.6; }
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font: inherit;
  background: transparent;
}
.clear-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.5rem;
}
.clear-btn:hover { background: rgba(0,0,0,0.06); }

.products-panel { display: flex; flex-direction: column; gap: 0.75rem; }
.product-grid {
  display: grid; gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}
.product-card {
  display: flex; flex-direction: column; justify-content: space-between;
  background-color: #27293d; border: 1px solid rgba(0,0,0,0.08);
  border-radius: 1rem; padding: 0.75rem 0.9rem;
  cursor: pointer; transition: transform .08s ease, box-shadow .08s ease, border-color .08s;
}
.product-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.06); }
.product-card.selected { border-color: #4caf50; box-shadow: 0 0 0 2px rgba(76,175,80,.15) inset; }

.card-top { display: flex; gap: 0.75rem; align-items: center; }
.avatar {
  width: 50px; height: 50px; border-radius: 50%;
  display: grid; place-items: center; font-weight: 700;
  background: #e8f5e9; color: #2e7d32; flex: 0 0 auto;
}
.avatar.selected { background: #4caf50; color: white; }
.product-info { min-width: 0; }
.name { font-size: .98rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meta { font-size: .8rem; color: #9c9b9b; display: flex; gap: .5rem; margin-top: .15rem; }

.promo-badge {
  margin-top: .35rem;
  display: inline-flex; align-items: center; gap: .35rem;
  background: #16351d; color: #a9f5b0;
  border: 1px solid #235c2c;
  border-radius: 999px; padding: .08rem .5rem;
  font-size: .78rem; font-weight: 700;
}
.promo-badge .pct { opacity: .8; }

.card-bottom {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: .6rem; font-size: .9rem;
}
.stock { color: #c2c2c2; }
.price { font-weight: 700; color: #4ca8af; }

/* Floating action bar */
.checkout-float {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom, 0) + 12px);
  transform: translateX(-50%);
  width: min(100% - 24px, 1100px);
  display: flex; align-items: center; justify-content: space-between; gap: .75rem;
  background: #292f52; color: #fff;
  border: 1px solid rgba(255,255,255,.08); border-radius: .9rem;
  padding: .65rem .8rem; z-index: 50;
  box-shadow: 0 12px 24px rgba(0,0,0,.25);
}
.totals { display: flex; align-items: center; gap: .45rem; flex-wrap: wrap; }
.totals .label { opacity: .7; }
.totals .value { font-weight: 800; }
.totals .sep { opacity: .3; padding: 0 .25rem; }
.actions { display: flex; gap: .5rem; }
.btn {
  border: none; border-radius: .6rem; padding: .6rem .9rem; cursor: pointer; font-weight: 700;
}
.btn-outline { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.2); }
.btn-outline:hover { background: rgba(255,255,255,.08); }
.btn-primary { background: #4caf50; color: #fff; }
.btn-primary:hover { filter: brightness(.95); }

/* Mobile tweaks */
@media (max-width: 640px) {
  .checkout-float { flex-direction: column; align-items: stretch; gap: .6rem; }
  .actions { justify-content: space-between; }
  .btn { width: 100%; }
}
</style>

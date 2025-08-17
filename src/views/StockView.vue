<template>
  <div class="stock-wrap">
    <!-- Header -->
    <header class="topbar">
      <h2 class="title">
        <i class="fas fa-boxes-stacked"></i>
        Stock
        <small v-if="outletName" class="muted">• {{ outletName }}</small>
      </h2>

      <div class="actions">
        <div class="search">
          <i class="fas fa-magnifying-glass"></i>
          <input
            v-model="q"
            type="text"
            class="search-input"
            placeholder="Search name, SKU, barcode, category…"
            autocomplete="off"
          />
          <button v-if="q" class="clear" @click="q = ''" aria-label="Clear">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="updated">
          <span class="dot" :class="{ on: !loading }"></span>
          <span class="txt">Updated {{ lastUpdatedLabel }}</span>
        </div>

        <button class="btn btn-outline" @click="manualRefresh" :disabled="loading">
          <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-rotate']"></i>
          Refresh
        </button>
      </div>
    </header>

    <!-- Errors -->
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- KPIs -->
    <section class="kpis">
      <article class="kpi">
        <div class="k">Total Products</div>
        <div class="v">{{ rows.length }}</div>
      </article>
      <article class="kpi">
        <div class="k">Total Qty</div>
        <div class="v">{{ totalQty.toLocaleString() }}</div>
      </article>
      <article class="kpi">
        <div class="k">Total Value</div>
        <div class="v mono">{{ fmtMoney(totalValue) }}</div>
      </article>
      <article class="kpi" :class="{ warn: lowCount > 0 }">
        <div class="k">Low Stock</div>
        <div class="v">{{ lowCount }}</div>
      </article>
    </section>

    <!-- Products Table (all breakpoints) -->
    <section class="table-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th style="width:40%">Name</th>
            <th class="right" style="width:12%">Qty</th>
            <th class="right" style="width:16%">Unit Price</th>
            <th style="width:20%">Category</th>
            <th style="width:12%">Sold By</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id">
            <td class="strong">
              <div class="pname">
                <span class="name-text">{{ r.name || '—' }}</span>
                <span v-if="r.sku" class="sku mono">#{{ r.sku }}</span>
              </div>
            </td>
            <td class="right" :class="{ danger: r.isLow }">{{ r.quantity }}</td>
            <td class="right mono">{{ fmtMoney(r.unit_price) }}</td>
            <td class="truncate">{{ r.category || '—' }}</td>
            <td>{{ r.sold_by || '—' }}</td>
          </tr>
          <tr v-if="!loading && filtered.length === 0">
            <td colspan="5" class="empty">No products match “{{ q }}”.</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useProducts } from '@/composables/useProducts'
import { useAuthStore } from '@/stores/auth'
import { useCurrency } from '@/composables/useCurrency'

const auth = useAuthStore()
const outletId = computed(() => auth.user?.outlet_id ?? null)
const outletName = computed(() => auth.user?.outlet?.name ?? '')

const { products, loading, error, refresh: refreshProducts } = useProducts()
const { formatMoney: fmtMoney } = useCurrency()

/* Last updated clock + manual refresh */
const lastUpdatedAt = ref(null)
const lastUpdatedLabel = computed(() => {
  if (!lastUpdatedAt.value) return '—'
  return lastUpdatedAt.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})
const manualRefresh = async () => {
  await refreshProducts()
  lastUpdatedAt.value = new Date()
}

/* silent refresh every 30s */
let timer = null
onMounted(async () => {
  await manualRefresh()
  timer = setInterval(manualRefresh, 30000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

/* Flatten products -> stock rows for current outlet */
const asNum = (x) => Number(x || 0)

const rows = computed(() => {
  const oid = outletId.value
  return products.value.map(p => {
    const s = (p.stocks || []).find(st => Number(st.outlet_id) === Number(oid)) || null
    const qty = asNum(s?.quantity)
    const unit = asNum(s?.unit_price)
    const low  = s?.low_stock != null ? asNum(s.low_stock) : null

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category?.name || null,
      sold_by: p.sold_by || (Array.isArray(p.selling_unit) ? p.selling_unit[0] : p.selling_unit) || null,
      quantity: qty,
      unit_price: unit,
      isLow: low != null && qty <= low,
    }
  })
})

/* Search filter */
const q = ref('')
const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return rows.value
  return rows.value.filter(r => {
    const hay = [r.name, r.sku, r.category, r.sold_by].map(v => String(v || '').toLowerCase())
    return hay.some(s => s.includes(term))
  })
})

/* Totals */
const totalQty = computed(() => rows.value.reduce((sum, r) => sum + asNum(r.quantity), 0))
const totalValue = computed(() => rows.value.reduce((sum, r) => sum + asNum(r.quantity) * asNum(r.unit_price), 0))
const lowCount = computed(() => rows.value.reduce((sum, r) => sum + (r.isLow ? 1 : 0), 0))
</script>

<style scoped>
.stock-wrap{
  padding: 1rem;
  padding-top: calc(env(safe-area-inset-top, 0px) + 72px);
  display: grid;
  gap: 1rem;
  color: #fff;
}

/* header */
.topbar{
  display:flex; align-items:center; justify-content:space-between;
  gap:.75rem; flex-wrap:wrap;
}
.title{ margin:0; font-size:1.2rem; display:flex; align-items:center; gap:.5rem; }
.muted{ opacity:.7; }
.actions{ display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; }

.search{
  position:relative; display:flex; align-items:center; gap:.5rem;
  background:#1f2233; border:1px solid rgba(255,255,255,.08);
  border-radius:.7rem; padding:.4rem .6rem;
}
.search i{ opacity:.7; }
.search-input{
  background:transparent; border:none; color:#fff; outline:none; min-width:240px;
}
.clear{
  border:none; background:transparent; color:#fff; opacity:.75; cursor:pointer; padding:.2rem;
  border-radius:.4rem;
}
.clear:hover{ background:rgba(255,255,255,.08); }

.updated{ display:flex; align-items:center; gap:.35rem; opacity:.9; font-size:.9rem; }
.dot{ width:8px; height:8px; border-radius:50%; background:#888; }
.dot.on{ background:#3ad07a; }

.btn{ border:none; border-radius:.6rem; padding:.5rem .8rem; cursor:pointer; font-weight:700; }
.btn-outline{ background:transparent; color:#fff; border:1px solid rgba(255,255,255,.2); }
.btn-outline:hover{ background:rgba(255,255,255,.08); }

/* alerts */
.alert{ padding:.6rem .8rem; border-radius:.6rem; }
.alert-danger{ background:#3a2330; border:1px solid #5b2b3f; }

/* KPIs */
.kpis{
  display:grid; gap:.6rem; grid-template-columns: repeat(2, minmax(0,1fr));
}
@media (min-width: 900px){
  .kpis{ grid-template-columns: repeat(4, minmax(0,1fr)); }
}
.kpi{ background:#1f2233; border:1px solid rgba(255,255,255,.08); border-radius:.7rem; padding:.65rem .8rem; }
.kpi.warn{ border-color: rgba(255, 193, 7, .35); }
.kpi .k{ opacity:.85; margin-bottom:.15rem; font-size:.9rem; }
.kpi .v{ font-size:1.18rem; font-weight:800; }
.mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

/* table (all breakpoints) */
.table-wrap{
  background:#1f2233; border:1px solid rgba(255,255,255,.08); border-radius:.7rem;
  overflow:auto;
}
.tbl{
  width:100%; border-collapse:collapse; min-width: 680px;
}
.tbl th, .tbl td{ padding:.6rem .7rem; border-bottom:1px solid rgba(255,255,255,.06); }
.tbl thead th{ background:#181a28; text-align:left; opacity:.9; }
.right{ text-align:right; }
.truncate{ max-width:260px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.strong{ font-weight:700; }
.empty{ text-align:center; opacity:.7; }
.pname{ display:flex; align-items:center; gap:.4rem; }
.name-text{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sku{ opacity:.7; }

/* states */
.danger{ color:#ffb4a2; }

/* spacing bottom */
.stock-wrap::after{
  content:""; display:block; height:calc(env(safe-area-inset-bottom, 0px) + 12px);
}
</style>

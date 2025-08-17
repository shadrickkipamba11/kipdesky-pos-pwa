<!-- src/views/DailyCashView.vue -->
<template>
  <div class="daily-wrap">
    <!-- Header -->
    <header class="topbar">
      <h2 class="title">
        <i class="fas fa-cash-register"></i>
        Daily Cash
      </h2>

      <div class="filters">
        <label class="datepick">
          <span class="lbl">Date</span>
          <input type="date" v-model="selectedDate" @change="loadSales()" />
        </label>

        <div class="updated">
          <span class="dot" :class="{ on: !loading }"></span>
          <span class="txt">Updated {{ lastUpdatedLabel }}</span>
        </div>

        <button class="btn btn-outline" @click="loadSales()" :disabled="loading">
          <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-rotate']"></i>
          Refresh
        </button>
      </div>
    </header>

    <!-- Messages -->
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="!loading && rows.length === 0" class="alert alert-info">
      No sales found for {{ selectedDate }}.
    </div>

    <!-- KPIs -->
    <section class="kpis">
      <article class="kpi hi">
        <div class="k">Product Sales</div>
        <div class="v">{{ fmtMoney(productSales) }}</div>
      </article>
      <article class="kpi">
        <div class="k">Total VAT</div>
        <div class="v">{{ fmtMoney(taxVAT) }}</div>
      </article>
      <article class="kpi">
        <div class="k">Total Discount</div>
        <div class="v">-{{ fmtMoney(totalDiscount) }}</div>
      </article>
      <article class="kpi warn">
        <div class="k">Total Refunded</div>
        <div class="v">-{{ fmtMoney(totalRefund) }}</div>
      </article>
      <article class="kpi ok">
        <div class="k">Total Received</div>
        <div class="v">{{ fmtMoney(totalReceived) }}</div>
      </article>
      
      <article class="kpi">
        <div class="k">Change Given Out</div>
        <div class="v">-{{ fmtMoney(changeGivenOut) }}</div>
      </article>
      <article class="kpi">
        <div class="k">Total Dues</div>
        <div class="v">{{ fmtMoney(totalDues) }}</div>
      </article>
      <article class="kpi hi">
        <div class="k">Cash on Hand</div>
        <div class="v">{{ fmtMoney(cashOnHand) }}</div>
      </article>
    </section>

    <!-- Payment breakdown -->
    <section v-if="Object.keys(byMethod).length" class="methods">
      <h4 class="section-title"><i class="fas fa-wallet"></i> By Payment Method</h4>
      <div class="chips">
        <span v-for="(amt, method) in byMethod" :key="method" class="chip">
          {{ method }}: <strong>{{ fmtMoney(amt) }}</strong>
        </span>
      </div>
    </section>

    <!-- Desktop table -->
    <section class="table-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th style="width:120px">Time</th>
            <th>Bill #</th>
            <th>Customer</th>
            <th class="num">Items</th>
            <th class="num">Gross</th>
            <th class="num">Discount</th>
            <th class="num">Tax</th>
            <th class="num">Subtotal</th>
            <th class="num">Paid</th>
            <th class="num">Change</th>
            <th class="num">Due</th>
            <th>Method</th>
            <th>Cashier</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in rows" :key="s.id">
            <td>{{ fmtTime(s.created_at) }}</td>
            <td>{{ s.bill_no }}</td>
            <td class="truncate">
              <span v-if="s.customer && (s.customer.first_name || s.customer.last_name)">
                {{ [s.customer.first_name, s.customer.last_name].filter(Boolean).join(' ') }}
              </span>
              <span v-else>—</span>
            </td>
            <td class="num">{{ n(s.total_quantity) }}</td>
            <td class="num">{{ fmtMoney(s.total_amount) }}</td>
            <td class="num">-{{ fmtMoney(s.discount_amount) }}</td>
            <td class="num">{{ fmtMoney(s.tax_amount) }}</td>
            <td class="num">{{ fmtMoney(s.sub_total) }}</td>
            <td class="num">{{ fmtMoney(s.paid_amount) }}</td>
            <td class="num">-{{ fmtMoney(s.change_amount) }}</td>
            <td class="num">{{ fmtMoney(s.due_amount) }}</td>
            <td>{{ s.payment_method || '—' }}</td>
            <td>
              <span v-if="s.user">
                {{ [s.user.first_name, s.user.last_name].filter(Boolean).join(' ') || s.user.email || ('#' + s.user.id) }}
              </span>
              <span v-else>—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Mobile cards -->
    <section class="cards">
      <article v-for="s in rows" :key="`m-${s.id}`" class="card">
        <div class="row1">
          <div class="bill">
            <div class="no">{{ s.bill_no }}</div>
            <div class="time">{{ fmtTime(s.created_at) }}</div>
          </div>
          <div class="gross">{{ fmtMoney(s.total_amount) }}</div>
        </div>
        <div class="grid">
          <div class="pair"><span class="k">Items</span><span class="v">{{ n(s.total_quantity) }}</span></div>
          <div class="pair"><span class="k">Discount</span><span class="v">-{{ fmtMoney(s.discount_amount) }}</span></div>
          <div class="pair"><span class="k">Tax</span><span class="v">{{ fmtMoney(s.tax_amount) }}</span></div>
          <div class="pair"><span class="k">Subtotal</span><span class="v">{{ fmtMoney(s.sub_total) }}</span></div>
          <div class="pair"><span class="k">Paid</span><span class="v">{{ fmtMoney(s.paid_amount) }}</span></div>
          <div class="pair"><span class="k">Change</span><span class="v">-{{ fmtMoney(s.change_amount) }}</span></div>
          <div class="pair"><span class="k">Due</span><span class="v">{{ fmtMoney(s.due_amount) }}</span></div>
          <div class="pair"><span class="k">Method</span><span class="v">{{ s.payment_method || '—' }}</span></div>
          <div class="pair">
            <span class="k">Cashier</span>
            <span class="v">
              <span v-if="s.user">{{ [s.user.first_name, s.user.last_name].filter(Boolean).join(' ') || s.user.email || ('#' + s.user.id) }}</span>
              <span v-else>—</span>
            </span>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import localForage from 'localforage'
import { useAuthStore } from '@/stores/auth'
import { useCurrency } from '@/composables/useCurrency'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const auth = useAuthStore()
const { formatMoney } = useCurrency()

/* helpers */
const pad2 = (n) => String(n).padStart(2, '0')
const todayLocalYMD = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`
}
const localYMDFromISO = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`
}
const fmtTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
const n = (v) => Number(v || 0)
const fmtMoney = (v) => formatMoney(v)

/* state */
const selectedDate = ref(todayLocalYMD())
const loading = ref(false)
const error = ref('')
const sales = ref([])
const lastUpdatedAt = ref(null)

/* load/refresh */
const cacheKey = (date, outlet) => `sales:${date}:${outlet ?? 'all'}`

const loadSales = async () => {
  loading.value = true
  error.value = ''
  try {
    const outletId = auth.user?.outlet_id ?? null
    const params = new URLSearchParams()
    params.set('date', selectedDate.value)  // still sent, but we filter by created_at locally
    if (outletId) params.set('outlet_id', outletId)

    if (auth.isOnline && auth.token) {
      const { data } = await axios.get(`${API_BASE_URL}/fetchsales?${params.toString()}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
      sales.value = arr
      await localForage.setItem(cacheKey(selectedDate.value, outletId), arr)
    } else {
      const cached = (await localForage.getItem(cacheKey(selectedDate.value, outletId))) || []
      const pending = (await localForage.getItem('pending_sales')) || []
      sales.value = [...cached, ...pending]
    }
    lastUpdatedAt.value = new Date()
  } catch (e) {
    error.value = 'Failed to load sales.'
  } finally {
    loading.value = false
  }
}

/* auto refresh every 30s */
let timer = null
onMounted(() => {
  loadSales()
  timer = setInterval(loadSales, 30000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

/* filter by local-day using created_at */
const rows = computed(() => {
  const d = selectedDate.value
  const outletId = auth.user?.outlet_id ?? null
  return (sales.value || [])
    .filter(s => {
      const day = localYMDFromISO(s.created_at || s.date || s.updated_at)
      const okDay = day === d
      const okOutlet = !outletId || s.outlet_id === outletId
      return okDay && okOutlet
    })
    .sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date))
})

/* partitions */
const refundedRows = computed(() =>
  rows.value.filter(r => String(r.transaction_status || '').toLowerCase() === 'refunded')
)
const nonRefundRows = computed(() =>
  rows.value.filter(r => String(r.transaction_status || '').toLowerCase() !== 'refunded')
)

/* KPIs (updated per your request) */
const productSales   = computed(() => nonRefundRows.value.reduce((s, r) => s + n(r.total_amount), 0)) // GROSS
const taxVAT         = computed(() => nonRefundRows.value.reduce((s, r) => s + n(r.tax_amount), 0))
const totalDiscount  = computed(() => nonRefundRows.value.reduce((s, r) => s + n(r.discount_amount), 0))
const totalReceived  = computed(() => nonRefundRows.value.reduce((s, r) => s + n(r.paid_amount), 0))
const totalRefund    = computed(() => refundedRows.value.reduce((s, r) => s + n(r.paid_amount), 0))   // money paid back
const totalDues      = computed(() => nonRefundRows.value.reduce((s, r) => s + n(r.due_amount), 0))

/* change given out (across all methods on non-refunds) */
const changeGivenOut = computed(() => nonRefundRows.value.reduce((s, r) => s + n(r.change_amount), 0))

/* cash on hand: cash in − cash change − cash refunds */
const cashIn      = computed(() => nonRefundRows.value
  .filter(r => String(r.payment_method || '').toLowerCase() === 'cash')
  .reduce((s, r) => s + n(r.paid_amount), 0)
)
const cashChange  = computed(() => nonRefundRows.value
  .filter(r => String(r.payment_method || '').toLowerCase() === 'cash')
  .reduce((s, r) => s + n(r.change_amount), 0)
)
const cashRefunds = computed(() => refundedRows.value
  .filter(r => String(r.payment_method || '').toLowerCase() === 'cash')
  .reduce((s, r) => s + n(r.paid_amount), 0)
)
const cashOnHand  = computed(() => cashIn.value - cashChange.value - cashRefunds.value)

/* method breakdown (non-refunds) */
const byMethod = computed(() => {
  const map = {}
  for (const r of nonRefundRows.value) {
    const key = r.payment_method || 'Other'
    map[key] = (map[key] || 0) + n(r.total_amount)
  }
  return map
})

/* last updated label */
const lastUpdatedLabel = computed(() => {
  if (!lastUpdatedAt.value) return '—'
  return lastUpdatedAt.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})
</script>

<style scoped>
.daily-wrap{
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
.filters{ display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; }
.datepick{
  display:flex; align-items:center; gap:.4rem;
  background:#1f2233; border:1px solid rgba(255,255,255,.08);
  border-radius:.6rem; padding:.35rem .5rem;
}
.datepick .lbl{ opacity:.8; font-size:.9rem; }
.datepick input{ background:transparent; border:none; color:#fff; outline:none; }

.updated{ display:flex; align-items:center; gap:.35rem; opacity:.9; font-size:.9rem; }
.dot{ width:8px; height:8px; border-radius:50%; background:#888; }
.dot.on{ background:#3ad07a; }

.btn{ border:none; border-radius:.6rem; padding:.5rem .8rem; cursor:pointer; font-weight:700; }
.btn-outline{ background:transparent; color:#fff; border:1px solid rgba(255,255,255,.2); }
.btn-outline:hover{ background:rgba(255,255,255,.08); }

/* alerts */
.alert{ padding:.6rem .8rem; border-radius:.6rem; }
.alert-danger{ background:#3a2330; border:1px solid #5b2b3f; }
.alert-info{ background:#1d2c3a; border:1px solid #274257; }

/* KPIs grid */
.kpis{
  display:grid; gap:.6rem;
  grid-template-columns: repeat(2, minmax(0,1fr));
}
@media (min-width: 900px){
  .kpis{ grid-template-columns: repeat(4, minmax(0,1fr)); }
}
.kpi{
  background:#1f2233; border:1px solid rgba(255,255,255,.08);
  border-radius:.7rem; padding:.65rem .8rem;
}
.kpi .k{ opacity:.85; margin-bottom:.15rem; font-size:.9rem; }
.kpi .v{ font-size:1.18rem; font-weight:800; }
.kpi .s{ opacity:.6; font-size:.78rem; margin-top:.2rem; }
.kpi.hi{ background:#24323f; border-color:rgba(100,200,255,.18); }
.kpi.ok{ border-color:rgba(72,190,120,.35); }
.kpi.warn{ border-color:rgba(255,160,120,.35); }

/* methods */
.methods{ display:grid; gap:.5rem; }
.section-title{ margin:0; font-size:1rem; opacity:.9; display:flex; align-items:center; gap:.4rem; }
.chips{ display:flex; flex-wrap:wrap; gap:.4rem; }
.chip{
  background:#161827; border:1px solid rgba(255,255,255,.1);
  border-radius:999px; padding:.25rem .6rem; font-size:.85rem;
}

/* table (desktop) */
.table-wrap{ display:none; }
@media (min-width: 900px){ .table-wrap{ display:block; } }
.tbl{
  width:100%; border-collapse:collapse; background:#1f2233; border-radius:.6rem; overflow:hidden;
}
.tbl th, .tbl td{ padding:.6rem .7rem; border-bottom:1px solid rgba(255,255,255,.06); }
.tbl thead th{ background:#181a28; text-align:left; opacity:.9; }
.num{ text-align:right; white-space:nowrap; }
.truncate{ max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* mobile cards */
.cards{ display:grid; gap:.6rem; }
@media (min-width: 900px){ .cards{ display:none; } }
.card{
  background:#1f2233; border:1px solid rgba(255,255,255,.08);
  border-radius:.7rem; padding:.65rem .75rem;
}
.row1{ display:flex; align-items:center; justify-content:space-between; gap:.6rem; }
.bill .no{ font-weight:800; }
.bill .time{ opacity:.7; font-size:.85rem; }
.gross{ font-weight:800; }
.grid{
  display:grid; grid-template-columns: repeat(2, minmax(0,1fr));
  gap:.45rem; margin-top:.5rem;
}
.pair{
  display:flex; align-items:center; justify-content:space-between; gap:.6rem;
  background:#151a26; border:1px solid rgba(255,255,255,.06);
  border-radius:.6rem; padding:.35rem .5rem;
}
.pair .k{ opacity:.8; }
</style>

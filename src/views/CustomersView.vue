<!-- Customers.vue -->
<template>
  <div class="customers-wrap">
    <!-- Header -->
    <header class="topbar">
      <h2 class="title">
        <i class="fas fa-users"></i>
        Customers
      </h2>

      <div class="actions">
        <div class="search">
          <i class="fas fa-magnifying-glass"></i>
          <input
            v-model="q"
            type="text"
            class="search-input"
            placeholder="Search name, code, phone, email, address…"
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

        <button class="btn btn-outline" @click="loadCustomers" :disabled="loading">
          <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-rotate']"></i>
          Refresh
        </button>
      </div>
    </header>

    <!-- Alerts -->
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Stats -->
    <section class="kpis">
      <article class="kpi">
        <div class="k">Customers</div>
        <div class="v">{{ filtered.length }}</div>
      </article>
    </section>

    <!-- Desktop table -->
    <section class="table-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th style="width:28%">Name</th>
            <th style="width:10%">Code</th>
            <th style="width:14%">Phone</th>
            <th style="width:18%">Email</th>
            <th>Address</th>
            <th style="width:10%">City</th>
            <th style="width:8%">Country</th>
            <th style="width:12%">Account Open</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in filtered" :key="c.id">
            <td class="strong">{{ c.name || '—' }}</td>
            <td class="mono">{{ c.code || '—' }}</td>
            <td>
              <a v-if="c.phone" :href="`tel:${sanitizePhone(c.phone)}`">{{ c.phone }}</a>
              <span v-else>—</span>
            </td>
            <td class="truncate">
              <a v-if="c.email" :href="`mailto:${c.email}`">{{ c.email }}</a>
              <span v-else>—</span>
            </td>
            <td class="truncate">
              <span>{{ c.address || '—' }}</span>
            </td>
            <td>{{ c.city || '—' }}</td>
            <td class="mono">{{ c.country || '—' }}</td>
            <td class="mono">{{ fmtDate(c.created_at) }}</td>
          </tr>
          <tr v-if="!loading && filtered.length === 0">
            <td colspan="8" class="empty">No customers match “{{ q }}”.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Mobile cards -->
    <section class="cards">
      <article v-for="c in filtered" :key="`m-${c.id}`" class="card">
        <div class="row1">
          <div class="name">{{ c.name || '—' }}</div>
          <div class="code" v-if="c.code">{{ c.code }}</div>
        </div>

        <div class="grid">
          <div class="pair" v-if="c.phone">
            <span class="k"><i class="fas fa-phone"></i> Phone</span>
            <span class="v"><a :href="`tel:${sanitizePhone(c.phone)}`">{{ c.phone }}</a></span>
          </div>
          <div class="pair" v-if="c.email">
            <span class="k"><i class="fas fa-envelope"></i> Email</span>
            <span class="v"><a :href="`mailto:${c.email}`">{{ c.email }}</a></span>
          </div>
          <div class="pair" v-if="c.address || c.city || c.country">
            <span class="k"><i class="fas fa-map-marker-alt"></i> Address</span>
            <span class="v">
              {{ c.address || '' }}
              <template v-if="c.city">, {{ c.city }}</template>
              <template v-if="c.country">, {{ c.country }}</template>
            </span>
          </div>
          <div class="pair">
            <span class="k"><i class="fas fa-clock"></i> Account Open</span>
            <span class="v mono">{{ fmtDate(c.created_at) }}</span>
          </div>
        </div>

        <!-- Quick actions -->
        <nav class="quick-actions">
          <a
            :href="makeLinks(c).tel || '#'"
            class="qa-btn"
            :class="{ disabled: !makeLinks(c).tel }"
            :aria-disabled="!makeLinks(c).tel"
            :tabindex="makeLinks(c).tel ? 0 : -1"
            title="Call"
          >
            <i class="fas fa-phone"></i><span>Call</span>
          </a>

          <a
            :href="makeLinks(c).sms || '#'"
            class="qa-btn"
            :class="{ disabled: !makeLinks(c).sms }"
            :aria-disabled="!makeLinks(c).sms"
            :tabindex="makeLinks(c).sms ? 0 : -1"
            title="Send SMS"
          >
            <i class="fas fa-comment-dots"></i><span>Message</span>
          </a>

          <a
            :href="makeLinks(c).wa || '#'"
            target="_blank" rel="noopener"
            class="qa-btn"
            :class="{ disabled: !makeLinks(c).wa }"
            :aria-disabled="!makeLinks(c).wa"
            :tabindex="makeLinks(c).wa ? 0 : -1"
            title="WhatsApp"
          >
            <i class="fab fa-whatsapp"></i><span>WhatsApp</span>
          </a>

          <a
            :href="makeLinks(c).email || '#'"
            class="qa-btn"
            :class="{ disabled: !makeLinks(c).email }"
            :aria-disabled="!makeLinks(c).email"
            :tabindex="makeLinks(c).email ? 0 : -1"
            title="Email"
          >
            <i class="fas fa-envelope"></i><span>Email</span>
          </a>
        </nav>
      </article>

      <div v-if="!loading && filtered.length === 0" class="empty-card">
        No customers match “{{ q }}”.
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import localForage from 'localforage'
import { useAuthStore } from '@/stores/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const auth = useAuthStore()

/* state */
const loading = ref(false)
const error = ref('')
const customers = ref([])
const q = ref('')
const lastUpdatedAt = ref(null)

/* helpers */
const pad2 = (n) => String(n).padStart(2, '0')
const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}
const lastUpdatedLabel = computed(() => {
  if (!lastUpdatedAt.value) return '—'
  return lastUpdatedAt.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})

/* === Quick-action helpers === */
const DEFAULT_COUNTRY_CODE = import.meta.env.VITE_DEFAULT_COUNTRY_CODE || '' // e.g. 260 for Zambia

const sanitizePhone = (s) => {
  const raw = String(s || '').trim()
  // Convert 00 prefix to +, keep leading + if present, remove other non-digits
  const norm = raw.replace(/^00/, '+').replace(/[^\d+]/g, '')
  return norm
}

const toE164 = (s) => {
  let p = sanitizePhone(s)
  if (p.startsWith('+')) return p
  // If number starts with 0 or is bare digits and we have a default country code, convert
  if (DEFAULT_COUNTRY_CODE) {
    if (p.startsWith('0')) return `+${DEFAULT_COUNTRY_CODE}${p.slice(1)}`
    if (/^\d+$/.test(p)) return `+${DEFAULT_COUNTRY_CODE}${p}`
  }
  return p // fallback (may still work for tel:, not for WhatsApp)
}

const makeLinks = (c) => {
  const email = c?.email ? `mailto:${c.email}` : null

  const telRaw = c?.phone ? sanitizePhone(c.phone) : null
  const tel = telRaw ? `tel:${telRaw}` : null

  // SMS with prefilled body
  const sms = telRaw ? `sms:${telRaw}?&body=${encodeURIComponent(`Hi ${c?.name || ''}`)}` : null

  // WhatsApp via wa.me; requires E.164 without '+'
  const e164 = c?.phone ? toE164(c.phone) : null
  const wa = e164 && /^\+\d+$/.test(e164)
    ? `https://wa.me/${e164.replace(/^\+/, '')}?text=${encodeURIComponent(`Hi ${c?.name || ''}`)}`
    : null

  return { email, tel, sms, wa }
}

/* load / cache */
const loadCustomers = async () => {
  loading.value = true
  error.value = ''
  try {
    if (auth.isOnline && auth.token) {
      const { data } = await axios.get(`/customers`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
      customers.value = arr
      await localForage.setItem('customers', arr)
    } else {
      customers.value = (await localForage.getItem('customers')) || []
    }
    lastUpdatedAt.value = new Date()
  } catch (e) {
    error.value = 'Failed to load customers.'
    // fall back to cache if present
    const cached = (await localForage.getItem('customers')) || []
    if (cached.length && !customers.value.length) {
      customers.value = cached
    }
  } finally {
    loading.value = false
  }
}

/* auto refresh every 30s */
let timer = null
onMounted(() => {
  loadCustomers()
  timer = setInterval(loadCustomers, 30000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

/* search filter */
const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return customers.value
  return customers.value.filter(c => {
    const hay = [
      c.name, c.code, c.phone, c.email, c.address, c.city, c.country
    ].map(v => String(v || '').toLowerCase())
    return hay.some(s => s.includes(term))
  })
})
</script>

<style scoped>
.customers-wrap{
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
.kpi .k{ opacity:.85; margin-bottom:.15rem; font-size:.9rem; }
.kpi .v{ font-size:1.18rem; font-weight:800; }

/* table (desktop) */
.table-wrap{ display:none; }
@media (min-width: 1000px){ .table-wrap{ display:block; } }

.tbl{
  width:100%; border-collapse:collapse; background:#1f2233; border-radius:.6rem; overflow:hidden;
}
.tbl th, .tbl td{ padding:.6rem .7rem; border-bottom:1px solid rgba(255,255,255,.06); }
.tbl thead th{ background:#181a28; text-align:left; opacity:.9; }
.truncate{ max-width:260px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.strong{ font-weight:700; }
.empty{ text-align:center; opacity:.7; }

/* mobile cards */
.cards{ display:grid; gap:.6rem; }
@media (min-width: 1000px){ .cards{ display:none; } }

.card{
  background:#1f2233; border:1px solid rgba(255,255,255,.08);
  border-radius:.7rem; padding:.65rem .75rem;
}
.row1{ display:flex; align-items:center; justify-content:space-between; gap:.6rem; }
.name{ font-weight:800; }
.code{ opacity:.8; font-family: ui-monospace, monospace; }

.grid{
  display:grid; gap:.45rem; margin-top:.5rem;
}
.pair{
  display:flex; align-items:center; justify-content:space-between; gap:.6rem;
  background:#151a26; border:1px solid rgba(255,255,255,.06);
  border-radius:.6rem; padding:.35rem .5rem;
}
.pair .k{ opacity:.8; display:inline-flex; align-items:center; gap:.4rem; }
.pair .v a{ color:#9fd3ff; text-decoration:none; }
.pair .v a:hover{ text-decoration:underline; }

.empty-card{
  background:#151a26; border:1px solid rgba(255,255,255,.06);
  border-radius:.6rem; padding:.6rem .8rem; text-align:center; opacity:.8;
}

/* quick actions */
.quick-actions{
  margin-top:.55rem;
  display:grid;
  grid-template-columns: repeat(4, minmax(0,1fr));
  gap:.45rem;
}
.qa-btn{
  display:flex; align-items:center; justify-content:center; gap:.4rem;
  background:#151a26; border:1px solid rgba(255,255,255,.06);
  border-radius:.55rem; padding:.45rem .5rem;
  color:#fff; text-decoration:none; font-weight:700; font-size:.92rem;
}
.qa-btn i{ opacity:.9; }
.qa-btn:hover{ background:rgba(255,255,255,.06); }
.qa-btn.disabled{
  opacity:.45; pointer-events:none; user-select:none;
}
.qa-btn span{ display:none; }
@media (min-width: 420px){
  .qa-btn span{ display:inline; }
}
</style>

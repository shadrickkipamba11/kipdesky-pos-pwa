<!-- src/views/InfoView.vue -->
<template>
  <div class="info-wrap">
    <!-- USER CARD -->
    <section class="card user-card">
      <header class="card-head">
        <h3><i class="fas fa-user-circle"></i> User</h3>
      </header>

      <div class="user-top">
        <div class="avatar" :class="{ placeholder: !showUserImg }" :title="fullName">
          <img
            v-if="user && user.avatar && showUserImg"
            :src="mediaUrl(user.avatar)"
            alt="User avatar"
            @error="showUserImg = false"
          />
          <span v-else>{{ initials(fullName) }}</span>
        </div>
        <div class="id-block">
          <div class="name">{{ fullName }}</div>
          <div class="meta">
            <span class="chip">{{ user?.role || '—' }}</span>
            <span class="chip" :class="user?.status === 'Active' ? 'ok' : 'muted'">
              {{ user?.status || '—' }}
            </span>
          </div>
        </div>
      </div>

      <ul class="kv">
        <li>
          <span class="k"><i class="fas fa-envelope"></i> Email</span>
          <span class="v">
            <a v-if="user?.email" :href="`mailto:${user.email}`">{{ user.email }}</a>
            <span v-else>—</span>
          </span>
        </li>
        <li>
          <span class="k"><i class="fas fa-phone"></i> Phone</span>
          <span class="v">
            <a v-if="user?.phone" :href="`tel:${user.phone}`">{{ user.phone }}</a>
            <span v-else>—</span>
          </span>
        </li>
        <li>
          <span class="k"><i class="fas fa-id-badge"></i> ID</span>
          <span class="v">#{{ user?.id ?? '—' }}</span>
        </li>
        <li>
          <span class="k"><i class="fas fa-store-alt"></i> Outlet</span>
          <span class="v">{{ outlet?.name || '—' }} <small v-if="outlet?.location" class="muted">• {{ outlet.location }}</small></span>
        </li>
        <li>
          <span class="k"><i class="fas fa-clock"></i> Last seen</span>
          <span class="v">{{ fmtDate(user?.last_seen_at) }}</span>
        </li>
      </ul>
    </section>

    <!-- STORE CARD -->
    <section class="card store-card">
      <header class="card-head">
        <h3><i class="fas fa-building"></i> Store</h3>
      </header>

      <div class="brand">
        <div class="logo" :class="{ placeholder: !showStoreLogo }" :title="store?.name">
          <img
            v-if="store?.logo && showStoreLogo"
            :src="mediaUrl(store.logo)"
            alt="Store logo"
            @error="showStoreLogo = false"
          />
          <span v-else>{{ initials(store?.name || '') }}</span>
        </div>
        <div class="brand-text">
          <div class="name">{{ store?.name || '—' }}</div>
          <div class="motto" v-if="store?.motto">“{{ store.motto }}”</div>
        </div>
      </div>

      <ul class="kv">
        <li>
          <span class="k"><i class="fas fa-map-marker-alt"></i> Address</span>
          <span class="v">
            {{ store?.address || '—' }}
            <template v-if="store?.city">, {{ store.city }}</template>
            <template v-if="store?.country">, {{ store.country }}</template>
          </span>
        </li>
        <li>
          <span class="k"><i class="fas fa-envelope"></i> Email</span>
          <span class="v">
            <a v-if="store?.email" :href="`mailto:${store.email}`">{{ store.email }}</a>
            <span v-else>—</span>
          </span>
        </li>
        <li>
          <span class="k"><i class="fas fa-phone"></i> Phone</span>
          <span class="v">
            <a v-if="store?.phone_number" :href="`tel:${store.phone_number}`">{{ store.phone_number }}</a>
            <span v-else>—</span>
          </span>
        </li>
        <li>
          <span class="k"><i class="fas fa-coins"></i> Currency</span>
          <span class="v">{{ store?.currency_symbol || '—' }} <small class="muted">{{ store?.currency || '' }}</small></span>
        </li>
        <li>
          <span class="k"><i class="fas fa-percentage"></i> Tax Rate</span>
          <span class="v">{{ store?.tax_rate ?? '—' }}<template v-if="store?.tax_rate">%</template></span>
        </li>
        <li>
          <span class="k"><i class="fas fa-receipt"></i> TPIN</span>
          <span class="v">{{ store?.tpin ?? '—' }}</span>
        </li>
        <li>
          <span class="k"><i class="fas fa-globe"></i> Time Zone</span>
          <span class="v">{{ store?.time_zone || '—' }}</span>
        </li>
        <li>
          <span class="k"><i class="fas fa-sync"></i> Updated</span>
          <span class="v">{{ fmtDate(store?.updated_at) }}</span>
        </li>
      </ul>
    </section>

    <!-- OUTLET CARD -->
    <section class="card outlet-card">
      <header class="card-head">
        <h3><i class="fas fa-store"></i> Outlet</h3>
      </header>

      <ul class="kv">
        <li>
          <span class="k"><i class="fas fa-hashtag"></i> ID</span>
          <span class="v">#{{ outlet?.id ?? '—' }}</span>
        </li>
        <li>
          <span class="k"><i class="fas fa-tag"></i> Name</span>
          <span class="v">{{ outlet?.name || '—' }}</span>
        </li>
        <li>
          <span class="k"><i class="fas fa-map-pin"></i> Location</span>
          <span class="v">{{ outlet?.location || '—' }}</span>
        </li>
        <li>
          <span class="k"><i class="fas fa-phone"></i> Phone</span>
          <span class="v">
            <a v-if="outlet?.phone_number" :href="`tel:${outlet.phone_number}`">{{ outlet.phone_number }}</a>
            <span v-else>—</span>
          </span>
        </li>
        <li>
          <span class="k"><i class="fas fa-envelope"></i> Email</span>
          <span class="v">
            <a v-if="outlet?.email" :href="`mailto:${outlet.email}`">{{ outlet.email }}</a>
            <span v-else>—</span>
          </span>
        </li>
        <li>
          <span class="k"><i class="fas fa-barcode"></i> Code</span>
          <span class="v">{{ outlet?.code ?? '—' }}</span>
        </li>
        <li>
          <span class="k"><i class="fas fa-clock"></i> Created</span>
          <span class="v">{{ fmtDate(outlet?.created_at) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import localForage from 'localforage'
import { useAuthStore } from '@/stores/auth'

// Auth (Pinia)
const auth = useAuthStore()

// Fallback store from offline cache
const storeLocal = ref(null)
onMounted(async () => {
  try {
    const s = await localForage.getItem('store')
    if (s) storeLocal.value = s
  } catch {}
})

// Entities
const user = computed(() => auth.user || null)
const store = computed(() => auth.store || user.value?.store || storeLocal.value || null)
const outlet = computed(() => user.value?.outlet || null)

// Logo/Avatar visibility
const showUserImg = ref(true)
const showStoreLogo = ref(true)

// Helpers
const fullName = computed(() =>
  [user.value?.first_name, user.value?.last_name].filter(Boolean).join(' ') || '—'
)

const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2)
  .map(w => (w[0] || '').toUpperCase()).join('')

/** Media URL (adjust if your backend serves via a different path) */
const mediaUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `/storage/${path}`
}

const fmtDate = (iso) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d)) return String(iso)
    return d.toLocaleString()
  } catch {
    return String(iso)
  }
}
</script>

<style scoped>
/* Layout: space below fixed TopNav; responsive grid of three cards on large screens */
.info-wrap {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  padding-top: calc(env(safe-area-inset-top, 0px) + 72px);
}
@media (min-width: 900px) {
  .info-wrap { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

/* Cards */
.card {
  background: #1f2233;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 0.9rem;
  color: #fff;
  padding: 0.9rem;
}
.card-head {
  border-bottom: 1px solid rgba(255,255,255,.06);
  margin: -0.9rem -0.9rem 0.75rem -0.9rem;
  padding: 0.8rem 0.9rem;
  background: #181a28;
  border-top-left-radius: 0.9rem;
  border-top-right-radius: 0.9rem;
}
.card-head h3 {
  margin: 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: .5rem;
}

/* User header */
.user-top {
  display: flex;
  align-items: center;
  gap: .8rem;
  margin-bottom: .5rem;
}

/* Avatar = Logo (same size & style) */
.avatar,
.logo {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: #121421;
  border: 1px solid rgba(255,255,255,.08);
  font-weight: 800;
  font-size: 1.05rem;
  flex: 0 0 auto;
}
.avatar.placeholder,
.logo.placeholder { background: #2b2f4a; }
.avatar img,
.logo img { width: 100%; height: 100%; object-fit: cover; display: block; }

.id-block .name { font-size: 1.05rem; font-weight: 800; }
.meta { display: flex; gap: .4rem; margin-top: .2rem; flex-wrap: wrap; }
.chip {
  background: #161827; border: 1px solid rgba(255,255,255,.08);
  border-radius: 999px; padding: .12rem .5rem; font-size: .78rem;
}
.chip.ok { border-color: rgba(76,175,80,.35); color: #a6e7a8; }

/* Store brand row */
.brand {
  display: flex; align-items: center; gap: .8rem; margin-bottom: .4rem;
}
.brand-text .name { font-weight: 800; }
.motto { opacity: .8; font-style: italic; }

/* Key-Value list */
.kv { list-style: none; padding: 0; margin: .25rem 0 0 0; display: grid; gap: .45rem; }
.kv li { display: grid; grid-template-columns: 180px 1fr; gap: .6rem; align-items: center; }
.k { opacity: .8; display: inline-flex; align-items: center; gap: .5rem; }
.v a { color: #9fd3ff; text-decoration: none; }
.v a:hover { text-decoration: underline; }
.muted { opacity: .6; }

/* On medium screens shrink label column a bit */
@media (max-width: 900px) {
  .kv li { grid-template-columns: 160px 1fr; }
}

/* Keep label | value side-by-side on phones too */
@media (max-width: 640px) {
  .info-wrap {
    padding-top: calc(env(safe-area-inset-top, 0px) + 84px);
    padding-left: 12px;
    padding-right: 12px;
    gap: 12px;
  }
  .card { border-radius: 12px; padding: 12px; }

  /* maintain two columns (label | value) on mobile */
  .kv li { grid-template-columns: minmax(110px, 42%) 1fr !important; gap: .6rem; }
  .k { font-size: .9rem; }
  .v { word-break: break-word; overflow-wrap: anywhere; }

  /* ensure avatar & logo keep same look on phones */
  .avatar,
  .logo { width: 54px !important; height: 54px !important; border-radius: 12px !important; }
}

/* extra breathing room at the very bottom for system toolbars */
.info-wrap::after {
  content: "";
  display: block;
  height: calc(env(safe-area-inset-bottom, 0px) + 8px);
}
</style>

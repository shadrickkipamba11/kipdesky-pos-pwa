<template>
  <div class="sales-wrap">
    <!-- Topbar -->
    <header class="topbar">
      <h2 class="title">
        <i class="fas fa-receipt"></i>
        Sales
      </h2>

      <div class="filters">
        <label class="datepick">
          <i class="fas fa-calendar-day"></i>
          <input type="date" v-model="day" />
        </label>

        <div class="search">
          <i class="fas fa-magnifying-glass"></i>
          <input
            v-model="billQuery"
            type="text"
            class="search-input"
            placeholder="Search bill no…"
            autocomplete="off"
          />
          <button
            v-if="billQuery"
            class="clear"
            @click="billQuery = ''"
            aria-label="Clear"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="updated">
          <span class="dot" :class="{ on: !loading }"></span>
          <span class="txt">Updated {{ lastUpdatedLabel }}</span>
        </div>

        <button
          class="btn btn-outline"
          @click="manualRefresh"
          :disabled="loading"
        >
          <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-rotate']"></i>
          Refresh
        </button>
      </div>
    </header>

    <!-- Error -->
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Sales table -->
    <section class="table-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th style="width: 12%">Time</th>
            <th style="width: 16%">Bill No</th>
            <th class="right" style="width: 10%">Products</th>
            <th class="right" style="width: 10%">Qty</th>
            <th class="right" style="width: 14%">Total</th>
            <th class="right" style="width: 14%">Paid</th>
            <th class="right" style="width: 10%">Due</th>
            <th style="width: 10%">Method</th>
            <th style="width: 8%"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s.id ?? s.bill_no">
            <td class="mono">{{ timeOnly(s.created_at) }}</td>
            <td class="mono strong">{{ s.bill_no }}</td>
            <td class="right">{{ s.total_products }}</td>
            <td class="right">{{ s.total_quantity }}</td>
            <td class="right mono">{{ fmtMoney(s.total_amount) }}</td>
            <td class="right mono">{{ fmtMoney(s.paid_amount) }}</td>
            <td class="right mono" :class="{ warn: asNum(s.due_amount) > 0 }">
              {{ fmtMoney(s.due_amount) }}
            </td>
            <td>{{ s.payment_method || "—" }}</td>
            <td class="right">
              <button class="btn btn-small" @click="openView(s)">
                <i class="fas fa-eye"></i> View
              </button>
            </td>
          </tr>
          <tr v-if="!loading && filtered.length === 0">
            <td colspan="9" class="empty">
              No sales for {{ day }} matching “{{ billQuery }}”.
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- View Modal -->
    <div v-if="modalOpen" class="modal" @click.self="closeModal">
      <div class="modal-card">
        <header class="modal-head">
          <h3>
            <i class="fas fa-file-invoice"></i>
            Sale: <span class="mono">{{ current?.bill_no }}</span>
          </h3>
          <button class="icon-btn" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </header>

        <div class="modal-body" v-if="current">
          <div class="summary">
            <div class="pair">
              <span class="k">Created</span
              ><span class="v">{{ dt(current.created_at) }}</span>
            </div>
            <div class="pair">
              <span class="k">Products</span
              ><span class="v">{{ current.total_products }}</span>
            </div>
            <div class="pair">
              <span class="k">Quantity</span
              ><span class="v">{{ current.total_quantity }}</span>
            </div>
            <div class="pair">
              <span class="k">Total</span
              ><span class="v mono strong">{{
                fmtMoney(current.total_amount)
              }}</span>
            </div>
            <div class="pair">
              <span class="k">Tax/VAT</span
              ><span class="v mono">{{ fmtMoney(current.tax_amount) }}</span>
            </div>
            <div class="pair">
              <span class="k">Discount</span
              ><span class="v mono"
                >-{{ fmtMoney(current.discount_amount) }}</span
              >
            </div>
            <div class="pair">
              <span class="k">Subtotal</span
              ><span class="v mono">{{ fmtMoney(current.sub_total) }}</span>
            </div>
            <div class="pair">
              <span class="k">Paid</span
              ><span class="v mono">{{ fmtMoney(current.paid_amount) }}</span>
            </div>
            <div class="pair">
              <span class="k">Change</span
              ><span class="v mono">{{ fmtMoney(current.change_amount) }}</span>
            </div>
            <div class="pair">
              <span class="k">Due</span
              ><span
                class="v mono"
                :class="{ warn: asNum(current.due_amount) > 0 }"
                >{{ fmtMoney(current.due_amount) }}</span
              >
            </div>
            <div class="pair">
              <span class="k">Method</span
              ><span class="v">{{ current.payment_method || "—" }}</span>
            </div>
            <div class="pair">
              <span class="k">Ref</span
              ><span class="v mono">{{ current.payment_ref || "—" }}</span>
            </div>
            <div class="pair">
              <span class="k">Status</span
              ><span class="v chip">{{
                current.transaction_status || "—"
              }}</span>
            </div>
            <div class="pair">
              <span class="k">Sync</span
              ><span
                class="v chip"
                :class="current.sync_status === 'online' ? 'ok' : 'muted'"
                >{{ current.sync_status || "offline" }}</span
              >
            </div>
            <div class="pair">
              <span class="k">Cashier</span
              ><span class="v">{{ cashierName(current.user) }}</span>
            </div>
            <div class="pair">
              <span class="k">Customer</span
              ><span class="v">{{ customerName(current.customer) }}</span>
            </div>
          </div>

          <div class="items-wrap">
            <table class="tbl items">
              <thead>
                <tr>
                  <th style="width: 40%">Item</th>
                  <th class="right">Qty</th>
                  <th class="right">Price</th>
                  <th class="right">Disc %</th>
                  <th class="right">Disc Amt</th>
                  <th class="right">Tax %</th>
                  <th class="right">Tax Amt</th>
                  <th class="right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, idx) in currentItems" :key="idx">
                  <td class="strong">
                    <div class="pname">
                      <span class="name-text">{{ it.name || "—" }}</span>
                      <span v-if="it.sold_by" class="sku mono"
                        >• {{ it.sold_by }}</span
                      >
                    </div>
                  </td>
                  <td class="right">{{ it.quantity }}</td>
                  <td class="right mono">{{ fmtMoney(it.unit_price) }}</td>
                  <td class="right mono">{{ num(it.discount) }}%</td>
                  <td class="right mono">{{ fmtMoney(it.discount_amount) }}</td>
                  <td class="right mono">{{ num(it.tax) }}%</td>
                  <td class="right mono">{{ fmtMoney(it.tax_amount) }}</td>
                  <td class="right mono">{{ fmtMoney(it.total) }}</td>
                </tr>
                <tr v-if="currentItems.length === 0">
                  <td colspan="8" class="empty">No items.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <footer class="modal-foot">
          <button class="btn btn-outline" @click="closeModal">Close</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import localForage from "localforage";
import { useCurrency } from "@/composables/useCurrency";

/* ---------- HOISTED HELPERS (so they’re safe to use above) ---------- */
function asNum(x) {
  return Number(x || 0);
}
function num(x) {
  return Number(x || 0).toFixed(2);
}
function ymd(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const da = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function timeOnly(iso) {
  const d = new Date(iso);
  return isNaN(d)
    ? "—"
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function dt(iso) {
  const d = new Date(iso);
  return isNaN(d) ? String(iso) : d.toLocaleString();
}
function cashierName(u) {
  if (!u) return "—";
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ");
  return full || u.email || `#${u.id}`;
}
function customerName(c) {
  if (!c) return "—";
  return (
    c.name ||
    [c.first_name, c.last_name].filter(Boolean).join(" ") ||
    c.phone ||
    `#${c.id}`
  );
}
function parseItems(sales_items) {
  try {
    const parsed =
      typeof sales_items === "string" ? JSON.parse(sales_items) : sales_items;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ---------- state ---------- */
const { formatMoney: fmtMoney } = useCurrency();
const sales = ref([]);
const loading = ref(false);
const error = ref("");
const lastUpdatedAt = ref(null);

/* filters */
const billQuery = ref("");
const day = ref(ymd(new Date())); // SAFE now: ymd is hoisted

/* silent refresh */
let timer = null;
const manualRefresh = async () => {
  try {
    loading.value = true;
    error.value = "";

    // IndexedDB only
    const synced = await localForage.getItem("sales");
    const pending = await localForage.getItem("pending_sales");

    const safeSynced = Array.isArray(synced) ? synced : [];
    const safePending = Array.isArray(pending) ? pending : [];

    const pendingNormalized = safePending.map((s) => ({
      sync_status: "offline",
      transaction_status: s.transaction_status ?? "Processed",
      created_at: s.created_at ?? new Date().toISOString(),
      ...s,
    }));

    sales.value = [...safeSynced, ...pendingNormalized]
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    lastUpdatedAt.value = new Date();
  } catch (e) {
    error.value = "Failed to load sales from device storage.";
  } finally {
    loading.value = false;
  }
};
onMounted(async () => {
  await manualRefresh();
  timer = setInterval(manualRefresh, 30000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

/* labels */
const lastUpdatedLabel = computed(() => {
  if (!lastUpdatedAt.value) return "—";
  return lastUpdatedAt.value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
});

/* filters */
const bySelectedDay = (s) => ymd(s.created_at) === day.value;
const byBillQuery = (s) => {
  const q = billQuery.value.trim().toLowerCase();
  if (!q) return true;
  return String(s.bill_no || "")
    .toLowerCase()
    .includes(q);
};

/* final list */
const filtered = computed(() =>
  sales.value.filter((s) => bySelectedDay(s) && byBillQuery(s))
);

/* modal */
const modalOpen = ref(false);
const current = ref(null);
const currentItems = ref([]);

const openView = (s) => {
  current.value = s;
  currentItems.value = parseItems(s.sales_items);
  modalOpen.value = true;
};
const closeModal = () => {
  modalOpen.value = false;
};
</script>

<style scoped>
.sales-wrap {
  padding: 1rem;
  padding-top: calc(env(safe-area-inset-top, 0px) + 72px);
  color: #fff;
  display: grid;
  gap: 1rem;
}

/* topbar */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.title {
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filters {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.datepick {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #1f2233;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.7rem;
  padding: 0.35rem 0.55rem;
}
.datepick input {
  background: transparent;
  border: none;
  color: #fff;
  outline: none;
}

.search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #1f2233;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.7rem;
  padding: 0.35rem 0.55rem;
}
.search-input {
  background: transparent;
  border: none;
  color: #fff;
  outline: none;
  min-width: 220px;
}
.clear {
  border: none;
  background: transparent;
  color: #fff;
  opacity: 0.75;
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 0.4rem;
}
.clear:hover {
  background: rgba(255, 255, 255, 0.08);
}

.updated {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  opacity: 0.9;
  font-size: 0.9rem;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #888;
}
.dot.on {
  background: #3ad07a;
}

.btn {
  border: none;
  border-radius: 0.6rem;
  padding: 0.5rem 0.8rem;
  cursor: pointer;
  font-weight: 700;
}
.btn-outline {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.btn-outline:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* alerts */
.alert {
  padding: 0.6rem 0.8rem;
  border-radius: 0.6rem;
}
.alert-danger {
  background: #3a2330;
  border: 1px solid #5b2b3f;
}

/* table */
.table-wrap {
  background: #1f2233;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.7rem;
  overflow: auto;
}
.tbl {
  width: 100%;
  border-collapse: collapse;
  min-width: 880px;
}
.tbl th,
.tbl td {
  padding: 0.6rem 0.7rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.tbl thead th {
  background: #181a28;
  text-align: left;
  opacity: 0.9;
}
.right {
  text-align: right;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}
.strong {
  font-weight: 700;
}
.empty {
  text-align: center;
  opacity: 0.7;
}
.warn {
  color: #ffb4a2;
}
.pname {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sku {
  opacity: 0.7;
}

/* modal */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 1rem;
}
.modal-card {
  width: min(100%, 980px);
  max-height: 90vh;
  overflow: auto;
  background: #121421;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.9rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
  background: #181a28;
  border-top-left-radius: 0.9rem;
  border-top-right-radius: 0.9rem;
}
.modal-head h3 {
  margin: 0;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.icon-btn {
  border: none;
  background: transparent;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
}

.modal-body {
  padding: 0.8rem 0.9rem;
  display: grid;
  gap: 0.9rem;
}
.summary {
  display: grid;
  grid-template-columns: 1fr;         /* one row per pair */
  gap: .35rem;
}
@media (max-width: 900px) {
  .summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.summary .pair{
  display: flex;
  align-items: center;
  justify-content: space-between;     /* push ends apart */
  gap: .75rem;
  width: 100%;
  background:#1f2233;
  border:1px solid rgba(255,255,255,.08);
  border-radius:.6rem;
  padding:.5rem .6rem;
}
.summary .pair .k{
  opacity:.8;
  font-size:.9rem;
}

.summary .pair .v{
  margin-left: auto;                  /* ensure it hugs the right edge */
  text-align: right;
  font-weight: 700;
  overflow-wrap: anywhere;            /* long refs/emails don’t overflow */
}
.chip {
  background: #161827;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.78rem;
}
.chip.ok {
  border-color: rgba(76, 175, 80, 0.35);
  color: #a6e7a8;
}

.items-wrap {
  background: #0f1220;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.7rem;
  overflow: auto;
}
.tbl.items {
  min-width: 840px;
}
.modal-foot {
  padding: 0.75rem 0.9rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  background: #181a28;
  border-bottom-left-radius: 0.9rem;
  border-bottom-right-radius: 0.9rem;
}

.sales-wrap::after {
  content: "";
  display: block;
  height: calc(env(safe-area-inset-bottom, 0px) + 12px);
}
</style>

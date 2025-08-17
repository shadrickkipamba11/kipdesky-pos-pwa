<template>
  <div class="checkout-wrap">
    <header class="header">
      <h2>Checkout</h2>
      <div class="right">
        <button class="btn btn-outline" @click="goBack">
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <button class="btn btn-outline" @click="cart.clear()">
          <i class="fas fa-broom"></i> Clear
        </button>
      </div>
    </header>

    <section v-if="cart.items.length === 0" class="empty">
      No items selected. <router-link to="/pos">Go back to POS</router-link>.
    </section>

    <section v-else class="content">
      <!-- Desktop table (unchanged core layout) -->
      <div class="items-table mb-2">
        <table class="items">
          <thead>
            <tr>
              <th style="width: 35%">Product</th>
              <th>Price</th>
              <th style="width: 120px">Qty</th>
              <th style="width: 140px">Discount</th>
              <th style="width: 90px">Tax %</th>
              <th>Subtotal</th>
              <th>Tax Amt</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in cart.items" :key="i.id">
              <td class="name">{{ i.name }}</td>
              <td>{{ fmtMoney(i.unit_price) }}</td>
              <td>
                <input type="number" min="1" v-model.number="i.quantity" class="num" />
              </td>
              <td>
                <!-- combined (direct + promo) shown in the input -->
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  :max="lineSubtotal(i)"
                  :value="discountInput(i)"
                  @input="onDiscountInput(i, $event.target.value)"
                  class="num"
                />
                <div v-if="promoDiscountVal(i) > 0" class="help">
                  includes promo {{ fmtMoney(promoDiscountVal(i)) }}
                </div>
              </td>
              <td><span class="chip">{{ fmtTax(productTaxPercent(i.id)) }}%</span></td>
              <td>{{ fmtMoney(lineSubtotal(i)) }}</td>
              <td>{{ fmtMoney(lineTaxAmt(i)) }}</td>
              <td>{{ fmtMoney(lineTotal(i)) }}</td>
              <td>
                <button class="btn btn-danger" @click="cart.remove(i.id)">
                  <i class="fas fa-times"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="items-cards mb-2">
        <article v-for="i in cart.items" :key="i.id" class="item-card">
          <div class="row1">
            <h4 class="title">{{ i.name }}</h4>
            <button class="btn btn-danger" @click="cart.remove(i.id)">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="row2">
            <div class="chip">{{ fmtMoney(i.unit_price) }} each</div>
            <div class="chip">Qty {{ i.quantity }}</div>
            <div class="chip">Tax {{ fmtTax(productTaxPercent(i.id)) }}%</div>
          </div>
          <div class="grid">
            <label>
              <span>Qty</span>
              <input type="number" min="1" v-model.number="i.quantity" class="input" />
            </label>
            <label>
              <span>Discount</span>
              <!-- combined (direct + promo) shown in the input -->
              <input
                type="number"
                min="0"
                step="0.01"
                :max="lineSubtotal(i)"
                :value="discountInput(i)"
                @input="onDiscountInput(i, $event.target.value)"
                class="input"
              />
              <small v-if="promoDiscountVal(i) > 0" class="muted note">
                includes promo {{ fmtMoney(promoDiscountVal(i)) }}
              </small>
            </label>
          </div>
          <div class="totals">
            <div><span class="muted">Unit Total:</span> <strong>{{ fmtMoney(lineSubtotal(i)) }}</strong></div>
            <div><span class="muted">VAT:</span> <strong>{{ fmtMoney(lineTaxAmt(i)) }}</strong></div>
            <div class="grand"><span>Total:</span> <strong>{{ fmtMoney(lineTotal(i)) }}</strong></div>
          </div>
        </article>
      </div>

      <!-- MOBILE sticky "Next" that opens the full-screen bar -->
      <div class="mobile-next" v-if="isNarrow && !barOpen">
        <button class="btn btn-primary next-btn" @click="openBar">
          Next
        </button>
      </div>

      <!-- Bottom bar. On mobile: full-screen sheet when open -->
      <div
        class="bottom-bar"
        :class="{
          hiddenOnMobile: isNarrow && !barOpen,
          fullscreen: isNarrow && barOpen
        }"
        role="region"
        aria-label="Checkout actions"
      >
        <div class="bar-inner">
          <!-- Summary -->
          <div class="bar-summary">
            <div class="sum-row"><span>Total Amount</span><strong>{{ fmtMoney(totalAmount) }}</strong></div>
            <div class="sum-row"><span>Discount</span><strong>{{ fmtMoney(discountAmount) }}</strong></div>
            <div class="sum-row"><span>VAT</span><strong>{{ fmtMoney(taxAmount) }}</strong></div>
            <div class="sum-row sub"><span>Subtotal</span><strong>{{ fmtMoney(subTotal) }}</strong></div>

            <div class="sum-grid">
              <div class="sum-cell"><span>Paid</span><strong>{{ fmtMoney(amountPaid) }}</strong></div>
              <div class="sum-cell"><span>Due</span><strong>{{ fmtMoney(dueAmount) }}</strong></div>
              <div class="sum-cell"><span>Change</span><strong>{{ fmtMoney(changeAmount) }}</strong></div>
            </div>
          </div>

          <!-- Actions -->
          <form class="bar-actions" @submit.prevent="onSubmit">
            <label class="field full">
              <span>Customer</span>
              <select v-model="customerId" class="select">
                <option value="">Select customer (optional)</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">
                  {{ customerLabel(c) }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Amount Paid</span>
              <input
                type="text"
                inputmode="decimal"
                v-model="amountPaidText"
                @focus="onAmountPaidFocus"
                @blur="commitAmountPaid"
                class="input"
                :placeholder="`Amount Paid (${currencySymbol})`"
              />
            </label>

            <label class="field">
              <span>Method</span>
              <select v-model="paymentMethod" class="select">
                <option>Cash</option>
                <option>Card</option>
                <option>MTN Mobile Money</option>
                <option>Airtel Mobile Money</option>
                <option>Zamtel Money</option>
                <option>Wire Transfer</option>
                <option>Gift Card</option>
                <option>Cheque</option>
              </select>
            </label>

            <label class="field full">
              <span>Payment Ref</span>
              <input v-model="paymentRef" type="text" class="input" placeholder="Optional" />
            </label>

            <div class="actions-row">
              <button type="submit" class="btn btn-primary submit" :disabled="saving">
                <span v-if="!saving"><i class="fas fa-check"></i> Process Sale</span>
                <span v-else>Saving…</span>
              </button>

              <!-- Close full-screen sheet (mobile) -->
              <button
                v-if="isNarrow"
                type="button"
                class="btn btn-outline collapse-btn"
                @click="closeBar"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Toasts at TOP -->
      <div class="toasts top" aria-live="polite" aria-atomic="true">
        <div v-for="t in toasts" :key="t.id" :class="['toast', t.type]">
          <i v-if="t.type==='ok'" class="fas fa-check-circle"></i>
          <i v-else-if="t.type==='warn'" class="fas fa-exclamation-triangle"></i>
          <i v-else class="fas fa-times-circle"></i>
          <span class="toast-text">{{ t.text }}</span>
          <button class="toast-close" @click="dismissToast(t.id)" aria-label="Close">×</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue"
import { useRouter } from "vue-router"
import { useCartStore } from "@/stores/cart"
import { useAuthStore } from "@/stores/auth"
import { useProducts } from "@/composables/useProducts"
import { useCurrency } from "@/composables/useCurrency"
import axios from "axios"
import localForage from "localforage"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"

const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()
const { products } = useProducts()
const { currencySymbol, formatMoney } = useCurrency()
const productById = (id) => products.value.find(p => p.id === id) || null

/* --- viewport (mobile toggle) --- */
const isNarrow = ref(window.matchMedia("(max-width: 899px)").matches)
const barOpen = ref(!isNarrow.value) // open on desktop, closed on mobile
const mq = window.matchMedia("(max-width: 899px)")
const handleMQ = (e) => { isNarrow.value = e.matches; barOpen.value = !e.matches }
onMounted(() => mq.addEventListener("change", handleMQ))
onBeforeUnmount(() => mq.removeEventListener("change", handleMQ))
const openBar = () => { barOpen.value = true }
const closeBar = () => { barOpen.value = false }

/* --- customers --- */
const customers = ref([])
const customerId = ref("")
const customerLabel = (c) =>
  c.name || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.phone || `#${c.id}`

const loadCustomers = async () => {
  try {
    const local = await localForage.getItem("customers")
    if (Array.isArray(local) && local.length) customers.value = local
    if (auth.isOnline && auth.token) {
      const { data } = await axios.get(`/customers`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      if (Array.isArray(data)) {
        customers.value = data
        await localForage.setItem("customers", data)
      }
    }
  } catch {}
}
onMounted(loadCustomers)

/* --- promotions --- */
const promotions = ref([])
const loadPromotions = async () => {
  try {
    const local = await localForage.getItem("promotions")
    if (Array.isArray(local)) promotions.value = local
    if (auth.isOnline && auth.token) {
      const { data } = await axios.get(`/promotions`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      if (Array.isArray(data)) {
        promotions.value = data
        await localForage.setItem("promotions", data)
      }
    }
  } catch {}
}
onMounted(loadPromotions)

/* --- helpers / formatters --- */
const fmtMoney = (n) => formatMoney(n)
const fmtTax = (n) => Number(n || 0).toFixed(2)
const goBack = () => router.push({ name: "pos" })

/* --- tax percent --- */
const productTaxPercent = (id) => {
  const p = products.value.find((x) => x.id === id)
  if (!p) return 0
  let t = p.tax ?? p.tax_rate ?? p.vat ?? p.vat_rate ?? p.tax?.rate
  if (typeof t === "string") t = parseFloat(t.replace("%", "").trim())
  t = Number(t || 0)
  if (t > 0 && t <= 1) t = t * 100
  return Math.max(0, Math.min(t, 100))
}

/* --- math: discounts & totals (tax-inclusive) --- */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n))
const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100
const percentOf = (value, base) => base > 0 ? (value / base) * 100 : 0
const baseAmount = (i) => Number(i.unit_price) * Number(i.quantity || 0)

/* direct discount stored on each line as i.discount_amount (cashier-set) */
const directDiscountVal = (i) => clamp(Number(i.discount_amount || 0), 0, baseAmount(i))

/* promotions */
const todayYmd = () => new Date().toISOString().slice(0, 10)
const outletIdStr = computed(() => String(auth.user?.outlet_id ?? ""))

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
  try { const arr = JSON.parse(p.product); return Array.isArray(arr) ? arr.map(String) : [] } catch { return [] }
}
const promosForProduct = (productId) =>
  promotions.value.filter(p => isPromoActive(p) && productIdsFromPromo(p).includes(String(productId)))

const promoDiscountVal = (i) => {
  const base = baseAmount(i)
  const promos = promosForProduct(i.id)
  let total = 0
  for (const p of promos) {
    const type = String(p.discount_type || "").toLowerCase()
    const val = Number(p.discount_value || 0)
    if (type === "percentage") total += base * (val / 100)
    else if (type === "value" || type === "fixed" || type === "amount") total += val * Number(i.quantity || 0)
  }
  return clamp(total, 0, base)
}

/* Show combined discount in the input; when user edits it, only direct part changes */
const discountInput = (i) => round2(Number(i.discount_amount || 0) + promoDiscountVal(i))
const onDiscountInput = (i, raw) => {
  const base = baseAmount(i)
  const desiredTotal = clamp(Number(raw || 0), 0, base)          // combined desired
  const promo = promoDiscountVal(i)
  const direct = clamp(desiredTotal - promo, 0, base)            // keep promo intact
  i.discount_amount = round2(direct)                              // store only direct
}

/* merged discounts used for totals & payload */
const combinedDiscountVal = (i) => directDiscountVal(i) + promoDiscountVal(i)
const combinedDiscountPercent = (i) =>
  percentOf(combinedDiscountVal(i), baseAmount(i))

/* line math */
const lineGrossAfterDiscounts = (i) => baseAmount(i) - combinedDiscountVal(i)
const lineTaxAmt = (i) => {
  const rate = productTaxPercent(i.id) || 0
  const gross = lineGrossAfterDiscounts(i)
  return rate > 0 ? gross * (rate / (100 + rate)) : 0
}
const lineSubtotal = (i) => lineGrossAfterDiscounts(i) - lineTaxAmt(i)
const lineTotal = (i) => lineGrossAfterDiscounts(i)

/* totals */
const discountAmount = computed(() =>
  cart.items.reduce((s, i) => s + combinedDiscountVal(i), 0)
)
const taxAmount = computed(() => cart.items.reduce((s, i) => s + lineTaxAmt(i), 0))
const totalAmount = computed(() => cart.items.reduce((s, i) => s + lineTotal(i), 0))
const subTotal = computed(() => totalAmount.value - taxAmount.value)
const totalQuantity = computed(() => cart.items.reduce((s, i) => s + Number(i.quantity || 0), 0))

/* paid / change / due (force 2 decimals) */
const amountPaid = ref(0)
const amountPaidText = ref('')
const paidEdited = ref(false)
const setFromTotal = () => {
  amountPaid.value = round2(Number(totalAmount.value || 0))
  amountPaidText.value = amountPaid.value.toFixed(2)
}
onMounted(setFromTotal)
watch(totalAmount, () => { if (!paidEdited.value) setFromTotal() })


const onAmountPaidFocus = () => { paidEdited.value = true }
const commitAmountPaid = () => {
  const cleaned = String(amountPaidText.value).replace(/[^0-9.]/g, '')
  const n = Number(cleaned)
  amountPaid.value = isNaN(n) ? 0 : round2(n)
  amountPaidText.value = amountPaid.value.toFixed(2)
}

const changeAmount = computed(() => {
  const diff = round2(Number(amountPaid.value) - Number(totalAmount.value))
  return diff > 0 ? diff : 0
})
const dueAmount = computed(() => {
  const diff = round2(Number(totalAmount.value) - Number(amountPaid.value))
  return diff > 0 ? diff : 0
})

/* toasts (top) */
const toasts = ref([])
let toastId = 0
const toastTimers = new Map()
let isAlive = true
onBeforeUnmount(() => {
  isAlive = false
  // clear any pending timers so nothing fires after unmount
  toastTimers.forEach((tid) => clearTimeout(tid))
  toastTimers.clear()
})

const showToast = (type, text, timeout = 3500) => {
  if (!isAlive) return
  const id = ++toastId
  toasts.value.push({ id, type, text })
  const tid = setTimeout(() => dismissToast(id), timeout)
  toastTimers.set(id, tid)
}
const dismissToast = (id) => {
  const tid = toastTimers.get(id)
  if (tid) clearTimeout(tid)
  toastTimers.delete(id)
  toasts.value = toasts.value.filter(t => t.id !== id)
}

/* payload */
const billNo = () => `RCP-${Date.now()}`       // RCP-1755001649482
const fmtNum = (n) => round2(n).toFixed(2)

const buildPayload = () => {
  const items = cart.items.map((i) => {
    const base = baseAmount(i)
    const dVal = combinedDiscountVal(i)                 // merged VALUE
    const dPerc = combinedDiscountPercent(i)            // merged PERCENT
    const rate = productTaxPercent(i.id)
    const gross = lineGrossAfterDiscounts(i)            // after discounts (tax-inclusive)
    const tAmt = rate > 0 ? gross * (rate / (100 + rate)) : 0
    const net  = gross - tAmt                           // pre-tax line total

    const p = productById(i.id)

    return {
      id: i.id,
      name: i.name,
      sold_by: p?.sold_by ?? 'unit',
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),

      discount: Number(round2(dPerc).toFixed(2)),  // percent
      discount_amount: round2(dVal),               // absolute value

      tax: Number(rate),
      tax_amount: round2(tAmt),
      total: round2(gross),
    }
  })

  return {
    id: undefined,
    store_id: auth.store?.id ?? auth.user?.store_id ?? null,
    outlet_id: auth.user?.outlet_id ?? null,
    user_id: auth.user?.id ?? null,
    date: new Date().toISOString(),
    bill_no: billNo(),
    customer_id: customerId.value || null,
    pos_type: "Mobile POS",

    total_products: cart.items.length,
    total_quantity: totalQuantity.value,

    total_amount: fmtNum(totalAmount.value),
    tax_amount: fmtNum(taxAmount.value),
    discount_amount: fmtNum(discountAmount.value), // cashier + promo
    sub_total: fmtNum(subTotal.value),

    paid_amount: fmtNum(amountPaid.value),
    change_amount: fmtNum(changeAmount.value),
    due_amount: fmtNum(dueAmount.value),

    payment_method: paymentMethod.value,
    payment_ref: paymentRef.value || null,
    sales_items: JSON.stringify(items),

    receipt_printed: true,
    transaction_status: "Processed",
    sync_status: auth.isOnline ? "online" : "offline",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customer: null,
    user: auth.user ?? null,
  }
}

/* save */
const paymentMethod = ref("Cash")
const paymentRef = ref("")
const saving = ref(false)
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const queueOffline = async (sale) => {
  const list = (await localForage.getItem("pending_sales")) || []
  list.push({ ...sale, sync_status: "offline" })
  await localForage.setItem("pending_sales", list)
}

const doSave = async () => {
  const payload = buildPayload()
  if (auth.isOnline) {
    await axios.post(`/sales`, payload, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    showToast("ok", "Sale saved successfully.")
  } else {
    await queueOffline(payload)
    showToast("warn", "No internet — sale saved offline and will sync later.")
  }
  await sleep(1000)  // show success message before redirecting
  cart.clear()
  router.push({ name: "pos" })
}

const onSubmit = async () => {
  commitAmountPaid()
  if (Number(amountPaid.value) < Number(totalAmount.value) && !customerId.value) {
    showToast("error", "Partial payment detected. Please select a customer before saving.")
    return
  }
  try {
    saving.value = true
    await doSave()
  } catch (e) {
    await queueOffline(buildPayload())
    showToast("warn", "Could not reach server — sale saved offline and will sync later.")
    await sleep(1000)
    cart.clear()
    router.push({ name: "pos" })
  } finally {
    saving.value = false
    if (isNarrow.value) closeBar()
  }
}
</script>

<style scoped>
.checkout-wrap { padding: 1rem; min-height: 100dvh; display: flex; flex-direction: column; }
.content { display: flex; flex-direction: column; flex: 1; }

/* Header */
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.header .right { display: flex; gap: 0.5rem; }
.btn { border: none; border-radius: 0.5rem; padding: 0.6rem 0.9rem; cursor: pointer; font-weight: 700; }
.btn-outline { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.2); }
.btn-outline:hover { background: rgba(255,255,255,.08); }
.btn-primary { background: #4caf50; color: #fff; }
.btn-primary:hover { filter: brightness(.95); }
.btn-danger { background: #c0392b; color: #fff; }
.btn-danger:hover { filter: brightness(.95); }

.empty { padding: 1rem; background: #1f2233; border-radius: .5rem; color: #fff; }

/* Desktop table */
.items-table { display: none; }
.items { width: 100%; border-collapse: collapse; background: #1f2233; border-radius: .5rem; overflow: hidden; }
.items th, .items td { padding: .6rem .7rem; border-bottom: 1px solid rgba(255,255,255,.06); color: #fff; vertical-align: top; }
.items th { text-align: left; opacity: .8; background: #181a28; }
.items .name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 420px; }
.chip { background: #161827; border: 1px solid rgba(255,255,255,.08); border-radius: 999px; padding: .12rem .5rem; font-size: .8rem; display: inline-block; color: #fff; }
.help { font-size: .78rem; opacity: .7; margin-top: .25rem; }

/* Mobile cards */
.items-cards { display: grid; gap: .75rem; }
.item-card { background: #1f2233; border: 1px solid rgba(255,255,255,.08); border-radius: .75rem; padding: .75rem; color: #fff; }
.item-card .row1 { display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
.item-card .title { margin: 0; font-size: 1rem; }
.item-card .row2 { display: flex; gap: .5rem; margin-top: .25rem; flex-wrap: wrap; }
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .5rem; margin-top: .6rem; }
label { display: grid; gap: .25rem; font-size: .9rem; }
.input, .select, .num { width: 100%; padding: .5rem .6rem; background: #121421; color: #fff; border: 1px solid rgba(255,255,255,.12); border-radius: .4rem; outline: none; }
.totals { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; margin-top: .6rem; }
.totals .muted { opacity: .7; }
.totals .grand { grid-column: 1 / -1; display: flex; justify-content: space-between; }

/* "Next" button for mobile */
.mobile-next { position: fixed; left: 16px; right: 16px; bottom: calc(env(safe-area-inset-bottom, 0) + 16px); z-index: 15; }
.next-btn { width: 100%; padding: .9rem 1rem; }

/* Bottom bar */
.bottom-bar {
  position: sticky;
  bottom: calc(env(safe-area-inset-bottom, 0) + 12px);
  margin-top: auto;
  background: #20253f; color: #fff;
  border: 1px solid rgba(255,255,255,.08); border-radius: .9rem;
  padding: .75rem .85rem; z-index: 20;
  box-shadow: 0 12px 24px rgba(0,0,0,.2);
}
.hiddenOnMobile { display: none; }

/* Full-screen sheet for mobile */
.bottom-bar.fullscreen {
  position: fixed;
  inset: 0;
  margin: 0;
  border-radius: 0;
  padding: 1rem;
  overflow: auto;
  box-shadow: none;
  background: #141a33;
}

/* Layout inside the bar */
.bar-inner { display: grid; gap: .9rem; }
.bar-summary { display: grid; gap: .35rem; }
.sum-row { display: flex; align-items: center; justify-content: space-between; font-size: .98rem; }
.sum-row.sub strong { font-size: 1.1rem; }
.sum-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .4rem; margin-top: .2rem; }
.sum-cell { display: flex; align-items: center; justify-content: space-between; background: #161a33; border: 1px solid rgba(255,255,255,.08); border-radius: .5rem; padding: .4rem .6rem; }

.bar-actions { display: grid; gap: .6rem; align-items: end; }
.field { display: grid; gap: .25rem; }
.field > span { font-size: .82rem; opacity: .75; }
.field.full { grid-column: 1 / -1; }
.actions-row { display: grid; grid-template-columns: 1fr; gap: .5rem; }
.submit { width: 100%; }
.collapse-btn { width: 100%; }

/* Desktop layout for bar */
@media (min-width: 900px) {
  .items-table { display: block; }
  .items-cards { display: none; }
  .mobile-next { display: none; }
  .bottom-bar { display: block; }
  .bottom-bar.fullscreen { position: sticky; inset: auto; border-radius: .9rem; padding: .75rem .85rem; overflow: visible; background: #20253f; }
  .bar-inner { grid-template-columns: 1fr minmax(420px, 560px); align-items: start; }
  .bar-actions { grid-template-columns: repeat(2, 1fr); }
  .field.full { grid-column: 1 / -1; }
  .actions-row { grid-template-columns: 1fr auto; align-items: center; }
  .submit { width: auto; }
  .collapse-btn { display: none; }
}

/* Toasts at TOP */
.toasts.top {
  position: fixed;
  right: 16px;
  top: calc(env(safe-area-inset-top, 0) + 16px);
  display: grid; gap: 8px;
  z-index: 9999;
}
.toast {
  display: grid; grid-auto-flow: column; align-items: center; gap: 8px;
  background: #1e273b; color: #fff; border-left: 4px solid #4caf50;
  padding: 10px 12px; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.25);
  max-width: min(92vw, 420px);
}
.toast.warn { border-left-color: #f1c40f; }
.toast.error { border-left-color: #e74c3c; }
.toast .toast-text { line-height: 1.2; }
.toast .toast-close { border: none; background: transparent; color: #fff; font-size: 18px; cursor: pointer; }
</style>

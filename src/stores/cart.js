import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([]) // [{ id, name, unit_price, quantity, discount_amount }]

  const isSelected = (id) => items.value.some(i => i.id === id)

  const add = (p, unitPrice) => {
    if (isSelected(p.id)) return
    items.value.push({
      id: p.id,
      name: p.name,
      unit_price: Number(unitPrice) || 0,
      quantity: 1,
      discount_amount: 0 // ⬅️ absolute value (currency), not percent
    })
  }

  const remove = (id) => { items.value = items.value.filter(i => i.id !== id) }
  const toggle = (p, unitPrice) => isSelected(p.id) ? remove(p.id) : add(p, unitPrice)
  const clear = () => { items.value = [] }

  const totalProducts = computed(() => items.value.length)
  const totalQuantity = computed(() => items.value.reduce((s, i) => s + Number(i.quantity || 0), 0))
  const subTotal = computed(() => items.value.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity || 0), 0))

  return { items, isSelected, add, remove, toggle, clear, totalProducts, totalQuantity, subTotal }
})

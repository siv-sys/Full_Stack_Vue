import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as cartApi from '../api/cart.js'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const loading = ref(false)

  const total = computed(() =>
    items.value.reduce((sum, item) => {
      const price = parseFloat(item.product?.price || item.price || 0)
      return sum + price * item.quantity
    }, 0)
  )

  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  async function fetchCart() {
    loading.value = true
    try {
      const { data } = await cartApi.getCart()
      items.value = data.items || data || []
    } finally {
      loading.value = false
    }
  }

  async function addItem(productId, quantity = 1) {
    const existing = items.value.find(i => (i.product?.id || i.product_id) === productId)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({ id: Date.now(), product_id: productId, quantity })
    }
    try {
      await cartApi.addToCart(productId, quantity)
      const { data } = await cartApi.getCart()
      items.value = data.items || data || []
    } catch (err) {
      await fetchCart()
      throw err
    }
  }

  async function updateQuantity(itemId, quantity) {
    const item = items.value.find(i => i.id === itemId)
    const prevQty = item?.quantity
    if (item) item.quantity = quantity
    try {
      await cartApi.updateCartItem(itemId, quantity)
    } catch (err) {
      if (item && prevQty !== undefined) item.quantity = prevQty
      throw err
    }
  }

  async function removeItem(itemId) {
    const prev = [...items.value]
    items.value = items.value.filter(i => i.id !== itemId)
    try {
      await cartApi.removeCartItem(itemId)
    } catch (err) {
      items.value = prev
      throw err
    }
  }

  return { items, loading, total, itemCount, fetchCart, addItem, updateQuantity, removeItem }
})

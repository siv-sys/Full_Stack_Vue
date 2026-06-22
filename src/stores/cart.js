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
    await cartApi.addToCart(productId, quantity)
    await fetchCart()
  }

  async function updateQuantity(itemId, quantity) {
    await cartApi.updateCartItem(itemId, quantity)
    await fetchCart()
  }

  async function removeItem(itemId) {
    await cartApi.removeCartItem(itemId)
    await fetchCart()
  }

  return { items, loading, total, itemCount, fetchCart, addItem, updateQuantity, removeItem }
})

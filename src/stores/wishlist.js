import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as wishlistApi from '../api/wishlist.js'

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref([])
  const loading = ref(false)

  const productIdSet = computed(() =>
    new Set(items.value.map(item => item.product_id || item.product?.id))
  )

  function isInWishlist(productId) {
    return productIdSet.value.has(productId)
  }

  async function fetchWishlist() {
    loading.value = true
    try {
      const { data } = await wishlistApi.getWishlist()
      items.value = data.items || data || []
    } finally {
      loading.value = false
    }
  }

  async function add(productId) {
    const optimistic = { id: Date.now(), product_id: productId }
    items.value.push(optimistic)
    try {
      await wishlistApi.addToWishlist(productId)
      const { data } = await wishlistApi.getWishlist()
      items.value = data.items || data || []
    } catch (err) {
      items.value = items.value.filter(i => i !== optimistic)
      throw err
    }
  }

  async function remove(productId) {
    const prev = [...items.value]
    items.value = items.value.filter(i => (i.product_id || i.product?.id) !== productId)
    try {
      await wishlistApi.removeFromWishlist(productId)
    } catch (err) {
      items.value = prev
      throw err
    }
  }

  return { items, loading, productIdSet, isInWishlist, fetchWishlist, add, remove }
})

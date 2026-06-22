import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as wishlistApi from '../api/wishlist.js'

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref([])
  const loading = ref(false)

  const productIds = computed(() =>
    items.value.map(item => item.product_id || item.product?.id)
  )

  function isInWishlist(productId) {
    return productIds.value.includes(productId)
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
    await wishlistApi.addToWishlist(productId)
    await fetchWishlist()
  }

  async function remove(productId) {
    await wishlistApi.removeFromWishlist(productId)
    await fetchWishlist()
  }

  return { items, loading, productIds, isInWishlist, fetchWishlist, add, remove }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'

const MAX_ENTRIES = 20
const TTL = 60 * 1000

export const useProductsStore = defineStore('products', () => {
  const cache = ref({})
  const categories = ref([])
  const categoriesLoaded = ref(false)

  function cacheKey(params) {
    const sorted = Object.keys(params).sort().reduce((o, k) => {
      if (params[k] !== '' && params[k] != null) o[k] = params[k]
      return o
    }, {})
    return JSON.stringify(sorted)
  }

  function getCached(params) {
    const key = cacheKey(params)
    const entry = cache.value[key]
    if (!entry) return null
    if (Date.now() - entry.ts > TTL) {
      delete cache.value[key]
      return null
    }
    return entry.data
  }

  function setCache(params, data) {
    const keys = Object.keys(cache.value)
    if (keys.length >= MAX_ENTRIES) delete cache.value[keys[0]]
    cache.value[cacheKey(params)] = { data, ts: Date.now() }
  }

  function setCategories(cats) {
    categories.value = cats
    categoriesLoaded.value = true
  }

  function clearCache() {
    cache.value = {}
  }

  return { categories, categoriesLoaded, getCached, setCache, setCategories, clearCache }
})

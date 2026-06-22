<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProducts, getCategories } from '../api/products.js'
import { useAuthStore } from '../stores/auth.js'
import { useCartStore } from '../stores/cart.js'
import { useWishlistStore } from '../stores/wishlist.js'
import { useToast } from '../composables/useToast.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const toast = useToast()

const products = ref([])
const categories = ref([])
const meta = ref({})
const loading = ref(true)
const fetchError = ref(false)

const search = ref(route.query.search || '')
const category = ref(route.query.category || '')
const minPrice = ref(route.query.min_price || '')
const maxPrice = ref(route.query.max_price || '')
const sort = ref(route.query.sort || '')
const page = ref(parseInt(route.query.page) || 1)

let debounceTimer = null

async function fetchProducts() {
  loading.value = true
  fetchError.value = false
  try {
    const params = { page: page.value, per_page: 12 }
    if (search.value) params.search = search.value
    if (category.value) params.category = category.value
    if (minPrice.value) params.min_price = minPrice.value
    if (maxPrice.value) params.max_price = maxPrice.value
    if (sort.value) params.sort = sort.value
    const { data } = await getProducts(params)
    products.value = data.items || data || []
    meta.value = data.meta || {}
  } catch {
    fetchError.value = true
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const { data } = await getCategories()
    categories.value = data || []
  } catch { /* optional */ }
}

function applyFilters() {
  page.value = 1
  pushQuery()
}

function onSearchInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { applyFilters() }, 350)
}

onUnmounted(() => clearTimeout(debounceTimer))

function pushQuery() {
  const query = {}
  if (search.value) query.search = search.value
  if (category.value) query.category = category.value
  if (minPrice.value) query.min_price = minPrice.value
  if (maxPrice.value) query.max_price = maxPrice.value
  if (sort.value) query.sort = sort.value
  if (page.value > 1) query.page = String(page.value)
  router.push({ path: '/products', query })
}

function goToPage(p) { page.value = p; pushQuery() }

watch(() => route.query, q => {
  search.value = q.search || ''
  category.value = q.category || ''
  minPrice.value = q.min_price || ''
  maxPrice.value = q.max_price || ''
  sort.value = q.sort || ''
  page.value = parseInt(q.page) || 1
  fetchProducts()
}, { deep: true })

onMounted(() => { loadCategories(); fetchProducts() })

function formatPrice(p) { return parseFloat(p).toFixed(2) }
function onImgError(e) { e.target.style.display = 'none'; e.target.parentElement.classList.add('img-fallback') }

async function quickAdd(product) {
  if (!auth.isAuthenticated) { router.push({ path: '/login', query: { redirect: '/products' } }); return }
  try {
    await cart.addItem(product.id)
    toast.success(`${product.name} added to cart`)
  } catch (err) {
    console.error('Add to cart failed:', err.response)
    toast.error(err.response?.data?.message || 'Could not add to cart')
  }
}

async function toggleHeart(product) {
  if (!auth.isAuthenticated) { router.push({ path: '/login', query: { redirect: '/products' } }); return }
  try {
    if (wishlist.isInWishlist(product.id)) {
      await wishlist.remove(product.id)
      toast.info('Removed from wishlist')
    } else {
      await wishlist.add(product.id)
      toast.success('Added to wishlist')
    }
  } catch (err) {
    console.error('Wishlist toggle failed:', err.response)
    toast.error(err.response?.data?.message || 'Could not update wishlist')
  }
}
</script>

<template>
  <div class="products-page">
    <div class="page-header">
      <h1>Products</h1>
      <router-link v-if="auth.user?.is_admin" to="/products/create" class="btn-add">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Product
      </router-link>
    </div>

    <div class="filters-bar">
      <div class="filter-row">
        <div class="search-wrap">
          <svg class="search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" type="text" placeholder="Search products..." @input="onSearchInput" aria-label="Search products" />
        </div>
        <select v-model="category" @change="applyFilters" aria-label="Category">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <input v-model="minPrice" type="number" min="0" step="0.01" placeholder="Min $" class="price-in" aria-label="Min price" />
        <input v-model="maxPrice" type="number" min="0" step="0.01" placeholder="Max $" class="price-in" aria-label="Max price" />
        <select v-model="sort" @change="applyFilters" aria-label="Sort">
          <option value="">Sort by</option>
          <option value="latest">Latest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
        <button class="btn-filter" @click="applyFilters">Apply</button>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="grid">
      <div v-for="n in 8" :key="n" class="card skeleton-card">
        <div class="skeleton card-img-skel"></div>
        <div class="card-body">
          <div class="skeleton skeleton-text sm"></div>
          <div class="skeleton skeleton-text md"></div>
          <div class="skeleton skeleton-text" style="width:40%;height:18px"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="empty">
      <p>Something went wrong loading products.</p>
      <button class="btn-outline" @click="fetchProducts">Retry</button>
    </div>

    <!-- Grid -->
    <div v-else-if="products.length" class="grid">
      <div v-for="product in products" :key="product.id" class="card">
        <router-link :to="`/products/${product.id}`" class="card-img-link">
          <div class="card-img">
            <img :src="product.image" :alt="product.name" loading="lazy" @error="onImgError" />
            <span v-if="product.stock === 0" class="badge-oos">Out of Stock</span>
          </div>
        </router-link>
        <div class="card-body">
          <span class="card-cat">{{ product.category?.name }}</span>
          <router-link :to="`/products/${product.id}`" class="card-name">{{ product.name }}</router-link>
          <div class="card-footer">
            <span class="card-price">${{ formatPrice(product.price) }}</span>
            <div class="card-actions">
              <button class="icon-btn heart" :class="{ active: wishlist.isInWishlist(product.id) }" @click="toggleHeart(product)" :aria-label="wishlist.isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'">
                <svg width="15" height="15" viewBox="0 0 24 24" :fill="wishlist.isInWishlist(product.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
              <button class="icon-btn cart-add" @click="quickAdd(product)" :disabled="product.stock === 0" aria-label="Add to cart">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <p>No products found.</p>
      <button class="btn-outline" @click="search = ''; category = ''; minPrice = ''; maxPrice = ''; sort = ''; applyFilters()">Clear Filters</button>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && meta.last_page > 1" class="pagination">
      <button :disabled="page <= 1" @click="goToPage(page - 1)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Prev
      </button>
      <button v-for="p in meta.last_page" :key="p" :class="{ active: p === page }" @click="goToPage(p)">{{ p }}</button>
      <button :disabled="page >= meta.last_page" @click="goToPage(page + 1)">
        Next
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.products-page h1 { font-size: 26px; margin: 0; }

.btn-add {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 18px; background: var(--accent); color: #fff; border-radius: 8px;
  font-size: 14px; font-weight: 500; text-decoration: none;
  transition: background var(--transition);
}
.btn-add:hover { background: var(--accent-hover); text-decoration: none; }

.filters-bar { margin-bottom: 24px; }

.filter-row {
  display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
}

.search-wrap {
  flex: 1 1 200px; position: relative;
}

.search-ico {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text); pointer-events: none;
}

.search-wrap input {
  width: 100%; padding: 8px 12px 8px 34px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  font-size: 14px; background: var(--bg); color: var(--text-h); transition: border-color var(--transition);
}
.search-wrap input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-bg); }

.filter-row select,
.price-in {
  padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  font-size: 14px; background: var(--bg); color: var(--text-h); cursor: pointer;
}

.price-in { width: 100px; }

.filter-row select:focus,
.price-in:focus { outline: none; border-color: var(--accent); }

.btn-filter {
  padding: 8px 18px; background: var(--accent); color: #fff; border: none;
  border-radius: var(--radius-sm); font-size: 14px; cursor: pointer; font-weight: 500;
  transition: background var(--transition);
}
.btn-filter:hover { background: var(--accent-hover); }

/* Grid & cards */
.grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 18px;
}

.card {
  border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden;
  transition: box-shadow var(--transition), transform var(--transition);
}
.card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }

.card-img-link { display: block; text-decoration: none; }
.card-img {
  aspect-ratio: 1; overflow: hidden; background: var(--code-bg); position: relative;
}
.card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.card:hover .card-img img { transform: scale(1.04); }

.badge-oos {
  position: absolute; top: 8px; left: 8px;
  background: rgba(0,0,0,0.7); color: #fff; font-size: 11px; font-weight: 600;
  padding: 3px 8px; border-radius: 4px;
}

.card-body { padding: 12px 14px 14px; }
.card-cat { font-size: 11px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.5px; }

.card-name {
  display: block; font-size: 14px; font-weight: 500; color: var(--text-h);
  margin: 3px 0 8px; text-decoration: none; line-height: 1.35;
}
.card-name:hover { color: var(--accent); text-decoration: none; }

.card-footer { display: flex; align-items: center; justify-content: space-between; }
.card-price { font-weight: 600; color: var(--text-h); font-size: 15px; }
.card-actions { display: flex; gap: 4px; }

.icon-btn {
  width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--border);
  background: var(--bg); color: var(--text); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition);
}
.icon-btn:hover { border-color: var(--accent); color: var(--accent); }
.icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.icon-btn.heart.active { color: #ef4444; border-color: #ef4444; }

.skeleton-card .card-body { padding: 14px; }
.card-img-skel { aspect-ratio: 1; }

/* Empty */
.empty { text-align: center; padding: 48px 0; color: var(--text); }
.empty svg { margin-bottom: 12px; }
.empty p { margin-bottom: 16px; }

.btn-outline {
  display: inline-block; padding: 9px 24px; border: 1px solid var(--border);
  color: var(--text-h); border-radius: 8px; text-decoration: none; font-size: 14px;
  transition: all var(--transition); background: none; cursor: pointer; font-family: inherit;
}
.btn-outline:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }

/* Pagination */
.pagination { display: flex; justify-content: center; gap: 6px; margin-top: 28px; }

.pagination button {
  padding: 7px 12px; border: 1px solid var(--border); background: var(--bg);
  color: var(--text-h); border-radius: var(--radius-sm); cursor: pointer; font-size: 13px;
  display: flex; align-items: center; gap: 4px;
  transition: all var(--transition); font-family: inherit;
}
.pagination button:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.pagination button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.pagination button:disabled { opacity: 0.35; cursor: not-allowed; }

@media (max-width: 640px) {
  .filter-row { flex-direction: column; }
  .price-in { width: 100%; }
}
</style>

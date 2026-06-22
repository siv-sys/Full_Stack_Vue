<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts } from '../api/products.js'
import { useAuthStore } from '../stores/auth.js'
import { useCartStore } from '../stores/cart.js'
import { useWishlistStore } from '../stores/wishlist.js'
import { useToast } from '../composables/useToast.js'

const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const toast = useToast()

const featured = ref([])
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    const { data } = await getProducts({ per_page: 4, sort: 'latest' })
    featured.value = data.items || data || []
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

function formatPrice(p) { return parseFloat(p).toFixed(2) }

function onImgError(e) {
  e.target.style.display = 'none'
  e.target.parentElement.classList.add('img-fallback')
}

async function quickAdd(product) {
  if (!auth.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: '/' } })
    return
  }
  try {
    await cart.addItem(product.id)
    toast.success(`${product.name} added to cart`)
  } catch (err) {
    console.error('Add to cart failed:', err.response)
    toast.error(err.response?.data?.message || 'Could not add to cart')
  }
}

async function toggleHeart(product) {
  if (!auth.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: '/' } })
    return
  }
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
  <div class="home">
    <section class="hero">
      <h1>Welcome to ShopVue</h1>
      <p class="hero-sub">Discover quality products at great prices.</p>
      <router-link to="/products" class="btn-primary">Browse Products</router-link>
    </section>

    <!-- Skeleton -->
    <section v-if="loading" class="section">
      <h2>Latest Products</h2>
      <div class="grid">
        <div v-for="n in 4" :key="n" class="card skeleton-card">
          <div class="skeleton card-img-skel"></div>
          <div class="card-body">
            <div class="skeleton skeleton-text sm"></div>
            <div class="skeleton skeleton-text md"></div>
            <div class="skeleton skeleton-text" style="width:40%;height:18px"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Error -->
    <section v-else-if="error" class="empty">
      <p>Failed to load products.</p>
      <button class="btn-outline" @click="$router.go(0)">Retry</button>
    </section>

    <!-- Products -->
    <section v-else-if="featured.length" class="section">
      <h2>Latest Products</h2>
      <div class="grid">
        <div v-for="product in featured" :key="product.id" class="card">
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
                <button
                  class="icon-btn heart"
                  :class="{ active: wishlist.isInWishlist(product.id) }"
                  @click="toggleHeart(product)"
                  :aria-label="wishlist.isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" :fill="wishlist.isInWishlist(product.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
                <button class="icon-btn cart-add" @click="quickAdd(product)" :disabled="product.stock === 0" aria-label="Add to cart">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="section-cta">
        <router-link to="/products" class="btn-outline">View All Products</router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home { max-width: 960px; margin: 0 auto; }

.hero { text-align: center; padding: 56px 0 48px; }
.hero h1 { font-size: 44px; margin: 0 0 10px; letter-spacing: -0.5px; }
.hero-sub { font-size: 17px; color: var(--text); margin-bottom: 28px; }

.btn-primary {
  display: inline-block; padding: 12px 32px; background: var(--accent); color: #fff;
  border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 15px;
  transition: background var(--transition);
}
.btn-primary:hover { background: var(--accent-hover); text-decoration: none; }

.section { padding-bottom: 48px; }
.section h2 { margin: 0 0 20px; font-size: 22px; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 20px;
}

.card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: box-shadow var(--transition), transform var(--transition);
}
.card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }

.card-img-link { display: block; text-decoration: none; }
.card-img {
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--code-bg);
  position: relative;
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
  width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--border);
  background: var(--bg); color: var(--text); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition);
}
.icon-btn:hover { border-color: var(--accent); color: var(--accent); }
.icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.icon-btn.heart.active { color: #ef4444; border-color: #ef4444; }

.skeleton-card .card-body { padding: 14px; }
.card-img-skel { aspect-ratio: 1; }

.section-cta { text-align: center; margin-top: 28px; }

.btn-outline {
  display: inline-block; padding: 10px 28px; border: 1px solid var(--border);
  color: var(--text-h); border-radius: 8px; text-decoration: none; font-size: 14px;
  transition: all var(--transition); background: none; cursor: pointer;
}
.btn-outline:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }

.empty { text-align: center; padding: 48px 0; color: var(--text); }
.empty p { margin-bottom: 16px; }

@media (max-width: 768px) {
  .hero { padding: 36px 0 32px; }
  .hero h1 { font-size: 30px; }
}
</style>

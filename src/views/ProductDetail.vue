<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProduct, getProductReviews, createReview, deleteProduct } from '../api/products.js'
import { useAuthStore } from '../stores/auth.js'
import { useCartStore } from '../stores/cart.js'
import { useWishlistStore } from '../stores/wishlist.js'
import { useToast } from '../composables/useToast.js'
import { useConfirm } from '../composables/useConfirm.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const toast = useToast()
const { confirm } = useConfirm()

const product = ref(null)
const reviews = ref([])
const loading = ref(true)
const fetchError = ref(false)
const addingToCart = ref(false)
const togglingWish = ref(false)
const deleting = ref(false)
const quantity = ref(1)

const rating = ref(5)
const comment = ref('')
const reviewErrors = ref({})
const reviewError = ref('')
const submittingReview = ref(false)

const inWishlist = computed(() => product.value ? wishlist.isInWishlist(product.value.id) : false)
const outOfStock = computed(() => product.value?.stock === 0)

onMounted(async () => {
  try {
    const { data } = await getProduct(route.params.id)
    product.value = data
  } catch {
    fetchError.value = true
    loading.value = false
    return
  }
  try {
    const { data } = await getProductReviews(route.params.id)
    reviews.value = data.items || data || []
  } catch { /* optional */ }
  if (auth.isAuthenticated) wishlist.fetchWishlist()
  loading.value = false
})

async function addToCart() {
  addingToCart.value = true
  try {
    await cart.addItem(product.value.id, quantity.value)
    toast.success(`${product.value.name} added to cart`)
  } catch (err) {
    console.error('Add to cart failed:', err.response)
    toast.error(err.response?.data?.message || 'Could not add to cart')
  } finally { addingToCart.value = false }
}

async function toggleWishlist() {
  togglingWish.value = true
  try {
    if (inWishlist.value) {
      await wishlist.remove(product.value.id)
      toast.info('Removed from wishlist')
    } else {
      await wishlist.add(product.value.id)
      toast.success('Added to wishlist')
    }
  } catch (err) {
    console.error('Wishlist toggle failed:', err.response)
    toast.error(err.response?.data?.message || 'Could not update wishlist')
  } finally { togglingWish.value = false }
}

async function submitReview() {
  reviewErrors.value = {}
  reviewError.value = ''
  submittingReview.value = true
  try {
    await createReview(product.value.id, { rating: rating.value, comment: comment.value })
    toast.success('Review submitted!')
    comment.value = ''; rating.value = 5
    const { data } = await getProductReviews(route.params.id)
    reviews.value = data.items || data || []
  } catch (err) {
    if (err.response?.status === 422) {
      const d = err.response.data
      if (d.errors) Object.entries(d.errors).forEach(([k, v]) => { reviewErrors.value[k] = Array.isArray(v) ? v[0] : v })
      reviewError.value = d.message || 'Validation failed'
    } else {
      reviewError.value = err.response?.data?.message || 'Failed to submit review'
      toast.error(reviewError.value)
    }
  } finally { submittingReview.value = false }
}

async function handleDelete() {
  const ok = await confirm({
    title: 'Delete this product?',
    message: `"${product.value.name}" will be permanently removed.`,
    confirmLabel: 'Delete',
    danger: true
  })
  if (!ok) return
  deleting.value = true
  try {
    await deleteProduct(product.value.id)
    toast.success('Product deleted')
    router.push('/products')
  } catch (err) {
    console.error('Delete product failed:', err.response)
    toast.error(err.response?.data?.message || 'Could not delete product')
  } finally {
    deleting.value = false
  }
}

function formatPrice(p) { return parseFloat(p).toFixed(2) }
function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n) }
function onImgError(e) { e.target.style.display = 'none'; e.target.parentElement.classList.add('img-fallback') }
</script>

<template>
  <!-- Skeleton -->
  <div v-if="loading" class="detail-skeleton">
    <div class="breadcrumbs"><span class="skeleton" style="width:180px;height:14px;display:inline-block"></span></div>
    <div class="top-grid">
      <div class="skeleton img-skel"></div>
      <div>
        <div class="skeleton skeleton-text sm" style="margin-bottom:12px"></div>
        <div class="skeleton skeleton-text lg" style="margin-bottom:16px"></div>
        <div class="skeleton" style="width:100px;height:28px;margin-bottom:20px"></div>
        <div class="skeleton skeleton-text md"></div>
        <div class="skeleton skeleton-text md"></div>
        <div class="skeleton skeleton-text" style="width:60%"></div>
      </div>
    </div>
  </div>

  <!-- Error -->
  <div v-else-if="fetchError || !product" class="empty">
    <p>{{ fetchError ? 'Failed to load product.' : 'Product not found.' }}</p>
    <button v-if="fetchError" class="btn-outline" @click="$router.go(0)">Retry</button>
    <router-link v-else to="/products" class="btn-outline">Back to Products</router-link>
  </div>

  <div v-else class="product-detail">
    <div class="detail-header">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <router-link to="/products">Products</router-link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span>{{ product.name }}</span>
      </nav>
      <div v-if="auth.user?.is_admin" class="admin-actions">
        <router-link :to="`/products/${product.id}/edit`" class="btn-edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </router-link>
        <button class="btn-delete" :disabled="deleting" @click="handleDelete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          {{ deleting ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>

    <div class="top-grid">
      <div class="product-image">
        <img :src="product.image" :alt="product.name" @error="onImgError" />
        <span v-if="outOfStock" class="badge-oos-lg">Out of Stock</span>
      </div>
      <div class="product-main">
        <span class="product-cat">{{ product.category?.name }}</span>
        <h1>{{ product.name }}</h1>
        <p class="product-price">${{ formatPrice(product.price) }}</p>
        <p class="product-desc">{{ product.description }}</p>

        <div v-if="auth.isAuthenticated" class="actions">
          <div class="qty-row">
            <label for="qty">Qty:</label>
            <div class="qty-stepper">
              <button @click="quantity = Math.max(1, quantity - 1)" :disabled="quantity <= 1" aria-label="Decrease">-</button>
              <input id="qty" v-model.number="quantity" type="number" min="1" />
              <button @click="quantity++" aria-label="Increase">+</button>
            </div>
          </div>
          <button class="btn-primary" :disabled="addingToCart || outOfStock" @click="addToCart">
            {{ outOfStock ? 'Out of Stock' : addingToCart ? 'Adding...' : 'Add to Cart' }}
          </button>
          <button class="btn-wish" :class="{ active: inWishlist }" :disabled="togglingWish" @click="toggleWishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" :fill="inWishlist ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {{ inWishlist ? 'In Wishlist' : 'Wishlist' }}
          </button>
        </div>
        <p v-else class="login-hint">
          <router-link :to="{ path: '/login', query: { redirect: route.fullPath } }">Log in</router-link> to add to cart or wishlist.
        </p>
      </div>
    </div>

    <section class="reviews-section">
      <h2>Reviews ({{ reviews.length }})</h2>

      <div v-if="reviews.length" class="reviews-list">
        <div v-for="review in reviews" :key="review.id" class="review-item">
          <div class="review-head">
            <span class="review-stars">{{ stars(review.rating) }}</span>
            <span class="review-author">{{ review.user?.name || 'Anonymous' }}</span>
          </div>
          <p class="review-body">{{ review.comment }}</p>
        </div>
      </div>
      <p v-else class="no-reviews">No reviews yet. Be the first!</p>

      <div v-if="auth.isAuthenticated" class="review-form">
        <h3>Write a Review</h3>
        <div v-if="reviewError" class="msg error-msg">{{ reviewError }}</div>

        <form @submit.prevent="submitReview">
          <div class="fg">
            <label for="rev-rating">Rating</label>
            <select id="rev-rating" v-model.number="rating" :class="{ 'has-error': reviewErrors.rating }">
              <option v-for="n in 5" :key="n" :value="n">{{ n }} {{ n === 1 ? 'star' : 'stars' }}</option>
            </select>
            <span v-if="reviewErrors.rating" class="field-error">{{ reviewErrors.rating }}</span>
          </div>
          <div class="fg">
            <label for="rev-comment">Comment</label>
            <textarea id="rev-comment" v-model="comment" rows="3" placeholder="Share your thoughts..." :class="{ 'has-error': reviewErrors.comment }"></textarea>
            <span v-if="reviewErrors.comment" class="field-error">{{ reviewErrors.comment }}</span>
          </div>
          <button type="submit" class="btn-primary" :disabled="submittingReview">
            {{ submittingReview ? 'Submitting...' : 'Submit Review' }}
          </button>
        </form>
      </div>
    </section>
  </div>
</template>

<style scoped>
.detail-header {
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;
}

.breadcrumbs {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--text);
}
.breadcrumbs a { color: var(--accent); text-decoration: none; }
.breadcrumbs a:hover { text-decoration: underline; }
.breadcrumbs svg { color: var(--border); flex-shrink: 0; }

.admin-actions { display: flex; gap: 8px; flex-shrink: 0; }

.btn-edit {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 500; color: var(--text-h); text-decoration: none;
  transition: all var(--transition);
}
.btn-edit:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }

.btn-delete {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 500; color: var(--danger); background: none;
  cursor: pointer; font-family: inherit; transition: all var(--transition);
}
.btn-delete:hover { border-color: var(--danger); background: var(--danger-bg); }
.btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }

.top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; margin-bottom: 40px; }

.product-image {
  border-radius: var(--radius); overflow: hidden; background: var(--code-bg); position: relative;
}
.product-image img { width: 100%; display: block; }

.badge-oos-lg {
  position: absolute; top: 12px; left: 12px;
  background: rgba(0,0,0,0.75); color: #fff; font-size: 13px; font-weight: 600;
  padding: 4px 12px; border-radius: 6px;
}

.product-cat { font-size: 12px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.5px; }
.product-main h1 { font-size: 26px; margin: 6px 0 10px; }
.product-price { font-size: 22px; font-weight: 600; color: var(--accent); margin-bottom: 14px; }
.product-desc { line-height: 1.65; margin-bottom: 22px; }

.actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }

.qty-row { display: flex; align-items: center; gap: 8px; }
.qty-row label { font-size: 14px; color: var(--text-h); font-weight: 500; }

.qty-stepper {
  display: flex; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden;
}
.qty-stepper button {
  width: 34px; height: 34px; border: none; background: var(--bg-soft);
  color: var(--text-h); cursor: pointer; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  transition: background var(--transition);
}
.qty-stepper button:hover:not(:disabled) { background: var(--accent-bg); color: var(--accent); }
.qty-stepper button:disabled { opacity: 0.35; cursor: not-allowed; }
.qty-stepper input {
  width: 44px; text-align: center; border: none; border-left: 1px solid var(--border);
  border-right: 1px solid var(--border); font-size: 14px; background: var(--bg); color: var(--text-h);
  -moz-appearance: textfield;
}
.qty-stepper input::-webkit-inner-spin-button { -webkit-appearance: none; }

.btn-primary {
  padding: 10px 24px; background: var(--accent); color: #fff; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;
  transition: background var(--transition);
}
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-wish {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 18px; border: 1px solid var(--border); background: transparent;
  color: var(--text-h); border-radius: 8px; font-size: 14px; cursor: pointer;
  transition: all var(--transition);
}
.btn-wish:hover { border-color: var(--accent); color: var(--accent); }
.btn-wish.active { color: #ef4444; border-color: #fca5a5; }
.btn-wish:disabled { opacity: 0.5; }

.login-hint { font-size: 14px; color: var(--text); }
.login-hint a { color: var(--accent); text-decoration: none; font-weight: 500; }

/* Reviews */
.reviews-section { border-top: 1px solid var(--border); padding-top: 28px; }
.reviews-section h2 { margin: 0 0 18px; font-size: 20px; }

.reviews-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }

.review-item { padding: 14px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); }
.review-head { display: flex; justify-content: space-between; margin-bottom: 6px; }
.review-stars { color: #f59e0b; font-size: 15px; letter-spacing: 1px; }
.review-author { font-size: 12px; color: var(--text); }
.review-body { font-size: 14px; line-height: 1.5; }

.no-reviews { font-size: 14px; color: var(--text); margin-bottom: 24px; }

.review-form { max-width: 480px; margin-top: 20px; }
.review-form h3 { font-size: 17px; color: var(--text-h); margin: 0 0 14px; }

.fg { margin-bottom: 12px; }
.fg label { display: block; font-size: 13px; font-weight: 500; color: var(--text-h); margin-bottom: 5px; }
.fg select, .fg textarea {
  width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  font-size: 14px; background: var(--bg); color: var(--text-h); font-family: inherit;
  transition: border-color var(--transition);
}
.fg select:focus, .fg textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-bg); }
.has-error { border-color: var(--danger) !important; }

.field-error { display: block; font-size: 12px; color: var(--danger); margin-top: 4px; }

.msg { padding: 10px 14px; border-radius: 8px; font-size: 14px; margin-bottom: 12px; }
.error-msg { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(220,38,38,0.2); }

.empty { text-align: center; padding: 48px 0; color: var(--text); }
.empty p { margin-bottom: 16px; }
.btn-outline {
  display: inline-block; padding: 9px 24px; border: 1px solid var(--border);
  color: var(--text-h); border-radius: 8px; text-decoration: none; font-size: 14px;
  transition: all var(--transition); background: none; cursor: pointer; font-family: inherit;
}
.btn-outline:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }

/* Skeleton */
.detail-skeleton .top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; }
.img-skel { aspect-ratio: 1; border-radius: var(--radius); }

@media (max-width: 768px) {
  .top-grid { grid-template-columns: 1fr; gap: 24px; }
  .detail-skeleton .top-grid { grid-template-columns: 1fr; }
}
</style>

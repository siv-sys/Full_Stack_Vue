<script setup>
import { onMounted } from 'vue'
import { useWishlistStore } from '../../stores/wishlist.js'
import { useCartStore } from '../../stores/cart.js'
import { useConfirm } from '../../composables/useConfirm.js'
import { useToast } from '../../composables/useToast.js'

const wishlist = useWishlistStore()
const cart = useCartStore()
const { confirm } = useConfirm()
const toast = useToast()

onMounted(() => { wishlist.fetchWishlist() })

function formatPrice(p) { return parseFloat(p).toFixed(2) }
function onImgError(e) { e.target.style.display = 'none'; e.target.parentElement.classList.add('img-fallback') }

async function removeItem(item) {
  const productId = item.product?.id || item.product_id
  const ok = await confirm({
    title: 'Remove from wishlist?',
    message: `Remove "${item.product?.name}" from your wishlist?`,
    confirmLabel: 'Remove',
    danger: true
  })
  if (ok) {
    try {
      await wishlist.remove(productId)
      toast.success('Removed from wishlist')
    } catch (err) {
      console.error('Wishlist remove failed:', err.response)
      toast.error(err.response?.data?.message || 'Could not remove from wishlist')
    }
  }
}

async function moveToCart(item) {
  const productId = item.product?.id || item.product_id
  try {
    await cart.addItem(productId)
    await wishlist.remove(productId)
    toast.success(`${item.product?.name} moved to cart`)
  } catch (err) {
    console.error('Move to cart failed:', err.response)
    toast.error(err.response?.data?.message || 'Could not move to cart')
  }
}
</script>

<template>
  <div class="wishlist-page">
    <h1>Wishlist</h1>

    <div v-if="wishlist.loading && !wishlist.items.length" class="grid">
      <div v-for="n in 4" :key="n" class="card skeleton-card">
        <div class="skeleton card-img-skel"></div>
        <div class="card-body">
          <div class="skeleton skeleton-text md"></div>
          <div class="skeleton skeleton-text" style="width:40%;height:18px"></div>
        </div>
      </div>
    </div>

    <div v-else-if="wishlist.items.length" class="grid">
      <div v-for="item in wishlist.items" :key="item.id" class="card">
        <router-link :to="`/products/${item.product?.id || item.product_id}`" class="card-img-link">
          <div class="card-img">
            <img :src="item.product?.image" :alt="item.product?.name" @error="onImgError" />
          </div>
        </router-link>
        <div class="card-body">
          <router-link :to="`/products/${item.product?.id || item.product_id}`" class="card-name">{{ item.product?.name }}</router-link>
          <span class="card-price">${{ formatPrice(item.product?.price) }}</span>
          <div class="card-actions">
            <button class="btn-move" @click="moveToCart(item)">Add to Cart</button>
            <button class="btn-del" @click="removeItem(item)" aria-label="Remove">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      <p>Your wishlist is empty.</p>
      <router-link to="/products" class="btn-outline">Browse Products</router-link>
    </div>
  </div>
</template>

<style scoped>
.wishlist-page h1 { font-size: 26px; margin: 0 0 24px; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 18px; }

.card {
  border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden;
  transition: box-shadow var(--transition), transform var(--transition);
}
.card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }

.card-img-link { display: block; text-decoration: none; }
.card-img { aspect-ratio: 1; overflow: hidden; background: var(--code-bg); }
.card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.card:hover .card-img img { transform: scale(1.04); }

.card-body { padding: 12px 14px 14px; }
.card-name {
  display: block; font-size: 14px; font-weight: 500; color: var(--text-h);
  text-decoration: none; margin-bottom: 4px; line-height: 1.35;
}
.card-name:hover { color: var(--accent); text-decoration: none; }
.card-price { display: block; font-weight: 600; color: var(--text-h); font-size: 15px; margin-bottom: 10px; }

.card-actions { display: flex; gap: 6px; }
.btn-move {
  flex: 1; padding: 7px; background: var(--accent); color: #fff; border: none;
  border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; cursor: pointer;
  transition: background var(--transition);
}
.btn-move:hover { background: var(--accent-hover); }

.btn-del {
  padding: 7px 8px; border: 1px solid var(--border); background: none;
  color: var(--text); border-radius: var(--radius-sm); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition);
}
.btn-del:hover { color: var(--danger); border-color: var(--danger); background: var(--danger-bg); }

.skeleton-card .card-body { padding: 14px; }
.card-img-skel { aspect-ratio: 1; }

.empty { text-align: center; padding: 48px 0; color: var(--text); }
.empty svg { margin-bottom: 12px; }
.empty p { margin-bottom: 16px; }
.btn-outline {
  display: inline-block; padding: 9px 24px; border: 1px solid var(--border);
  color: var(--text-h); border-radius: 8px; text-decoration: none; font-size: 14px;
  transition: all var(--transition);
}
.btn-outline:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }
</style>

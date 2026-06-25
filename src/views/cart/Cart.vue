<script setup>
import { onMounted } from 'vue'
import { useCartStore } from '../../stores/cart.js'
import { useConfirm } from '../../composables/useConfirm.js'
import { useToast } from '../../composables/useToast.js'

const cart = useCartStore()
const { confirm } = useConfirm()
const toast = useToast()

onMounted(() => { cart.fetchCart() })

function formatPrice(p) { return parseFloat(p).toFixed(2) }
function onImgError(e) { e.target.style.display = 'none'; e.target.parentElement.classList.add('img-fallback') }

async function removeItem(item) {
  const ok = await confirm({
    title: 'Remove from cart?',
    message: `Remove "${item.product?.name}" from your cart?`,
    confirmLabel: 'Remove',
    danger: true
  })
  if (ok) {
    try {
      await cart.removeItem(item.id)
      toast.success('Item removed from cart')
    } catch (err) {
      console.error('Cart remove failed:', err.response)
      toast.error(err.response?.data?.message || 'Could not remove item')
    }
  }
}

async function changeQty(item, delta) {
  const newQty = item.quantity + delta
  if (newQty < 1) return
  try {
    await cart.updateQuantity(item.id, newQty)
  } catch (err) {
    console.error('Cart quantity update failed:', err.response)
    toast.error(err.response?.data?.message || 'Could not update quantity')
  }
}
</script>

<template>
  <div class="cart-page">
    <h1>Shopping Cart</h1>

    <div v-if="cart.loading && !cart.items.length" class="skeleton-list">
      <div v-for="n in 3" :key="n" class="skeleton-row">
        <div class="skeleton" style="width:72px;height:72px;border-radius:8px;flex-shrink:0"></div>
        <div style="flex:1">
          <div class="skeleton skeleton-text md"></div>
          <div class="skeleton skeleton-text sm"></div>
        </div>
        <div class="skeleton" style="width:90px;height:32px"></div>
      </div>
    </div>

    <template v-else-if="cart.items.length">
      <div class="cart-items">
        <div v-for="item in cart.items" :key="item.id" class="cart-item">
          <router-link :to="`/products/${item.product?.id || item.product_id}`" class="item-img">
            <img :src="item.product?.image" :alt="item.product?.name" @error="onImgError" />
          </router-link>
          <div class="item-info">
            <router-link :to="`/products/${item.product?.id || item.product_id}`" class="item-name">{{ item.product?.name }}</router-link>
            <span class="item-unit-price">${{ formatPrice(item.product?.price || item.price) }} each</span>
          </div>
          <div class="item-qty">
            <button class="qty-btn" :disabled="item.quantity <= 1" @click="changeQty(item, -1)" aria-label="Decrease">-</button>
            <span class="qty-val">{{ item.quantity }}</span>
            <button class="qty-btn" @click="changeQty(item, 1)" aria-label="Increase">+</button>
          </div>
          <span class="item-subtotal">${{ formatPrice((item.product?.price || item.price) * item.quantity) }}</span>
          <button class="btn-remove" @click="removeItem(item)" aria-label="Remove item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      <div class="cart-footer">
        <div class="cart-total">Total: <strong>${{ formatPrice(cart.total) }}</strong></div>
        <router-link to="/checkout" class="btn-primary">Proceed to Checkout</router-link>
      </div>
    </template>

    <div v-else class="empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      <p>Your cart is empty.</p>
      <router-link to="/products" class="btn-outline">Browse Products</router-link>
    </div>
  </div>
</template>

<style scoped>
.cart-page h1 { font-size: 26px; margin: 0 0 24px; }

.cart-items { display: flex; flex-direction: column; gap: 12px; }

.cart-item {
  display: flex; align-items: center; gap: 14px; padding: 14px 16px;
  border: 1px solid var(--border); border-radius: var(--radius);
  transition: box-shadow var(--transition);
}
.cart-item:hover { box-shadow: var(--shadow-sm); }

.item-img {
  width: 72px; height: 72px; border-radius: 8px; overflow: hidden;
  background: var(--code-bg); flex-shrink: 0; display: block;
}
.item-img img { width: 100%; height: 100%; object-fit: cover; }

.item-info { flex: 1; min-width: 0; }
.item-name { display: block; font-size: 14px; font-weight: 500; color: var(--text-h); text-decoration: none; margin-bottom: 2px; }
.item-name:hover { color: var(--accent); text-decoration: none; }
.item-unit-price { font-size: 12px; color: var(--text); }

.item-qty { display: flex; align-items: center; gap: 0; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
.qty-btn {
  width: 30px; height: 30px; border: none; background: var(--bg-soft);
  color: var(--text-h); cursor: pointer; font-size: 15px;
  display: flex; align-items: center; justify-content: center;
  transition: background var(--transition);
}
.qty-btn:hover:not(:disabled) { background: var(--accent-bg); color: var(--accent); }
.qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.qty-val {
  width: 36px; text-align: center; font-size: 14px; font-weight: 500; color: var(--text-h);
  border-left: 1px solid var(--border); border-right: 1px solid var(--border);
  height: 30px; display: flex; align-items: center; justify-content: center;
}

.item-subtotal { font-weight: 600; color: var(--text-h); font-size: 15px; min-width: 72px; text-align: right; }

.btn-remove {
  padding: 6px; border: 1px solid transparent; background: none; color: var(--text);
  border-radius: var(--radius-sm); cursor: pointer; display: flex;
  transition: all var(--transition);
}
.btn-remove:hover { color: var(--danger); border-color: var(--danger); background: var(--danger-bg); }

.cart-footer {
  margin-top: 20px; padding: 18px 20px; border: 1px solid var(--border); border-radius: var(--radius);
  display: flex; align-items: center; justify-content: space-between;
}
.cart-total { font-size: 17px; color: var(--text); }
.cart-total strong { color: var(--text-h); font-size: 21px; margin-left: 6px; }

.btn-primary {
  display: inline-block; padding: 11px 28px; background: var(--accent); color: #fff;
  border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 15px;
  transition: background var(--transition);
}
.btn-primary:hover { background: var(--accent-hover); text-decoration: none; }

.skeleton-list { display: flex; flex-direction: column; gap: 14px; }
.skeleton-row { display: flex; align-items: center; gap: 14px; padding: 14px 0; }

.empty { text-align: center; padding: 48px 0; color: var(--text); }
.empty svg { margin-bottom: 12px; }
.empty p { margin-bottom: 16px; }

.btn-outline {
  display: inline-block; padding: 9px 24px; border: 1px solid var(--border);
  color: var(--text-h); border-radius: 8px; text-decoration: none; font-size: 14px;
  transition: all var(--transition);
}
.btn-outline:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }

@media (max-width: 640px) {
  .cart-item { flex-wrap: wrap; }
  .item-subtotal { min-width: auto; }
  .cart-footer { flex-direction: column; gap: 14px; text-align: center; }
}
</style>

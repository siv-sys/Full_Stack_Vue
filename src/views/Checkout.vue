<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart.js'
import { checkout } from '../api/orders.js'
import { useToast } from '../composables/useToast.js'

const router = useRouter()
const cart = useCartStore()
const toast = useToast()

const placing = ref(false)
const error = ref('')
const order = ref(null)

onMounted(() => { cart.fetchCart() })

async function placeOrder() {
  error.value = ''
  placing.value = true
  try {
    const { data } = await checkout()
    order.value = data
    cart.fetchCart()
    toast.success('Order placed successfully!')
  } catch (err) {
    error.value = err.response?.data?.message || 'Checkout failed. Please try again.'
    toast.error(error.value)
  } finally {
    placing.value = false
  }
}

function formatPrice(p) { return parseFloat(p).toFixed(2) }
</script>

<template>
  <div class="checkout-page">
    <template v-if="order">
      <div class="success-block">
        <div class="success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h1>Order Placed!</h1>
        <p>Your order <strong>#{{ order.id }}</strong> has been placed successfully.</p>
        <p class="success-total">Total: <strong>${{ formatPrice(order.total) }}</strong></p>
        <div class="success-actions">
          <router-link :to="`/orders/${order.id}`" class="btn-primary">View Order</router-link>
          <router-link to="/products" class="btn-outline">Continue Shopping</router-link>
        </div>
      </div>
    </template>

    <template v-else>
      <h1>Checkout</h1>

      <div v-if="error" class="error-msg">{{ error }}</div>

      <div v-if="cart.loading" class="loading">
        <div v-for="n in 3" :key="n" class="skeleton" style="height:44px;margin-bottom:8px;border-radius:8px"></div>
      </div>

      <template v-else-if="cart.items.length">
        <div class="summary-list">
          <div v-for="item in cart.items" :key="item.id" class="summary-row">
            <span class="sr-name">{{ item.product?.name }}</span>
            <span class="sr-qty">x{{ item.quantity }}</span>
            <span class="sr-sub">${{ formatPrice((item.product?.price || item.price) * item.quantity) }}</span>
          </div>
        </div>

        <div class="total-row">
          <span>Total</span>
          <strong>${{ formatPrice(cart.total) }}</strong>
        </div>

        <button class="btn-primary full" :disabled="placing" @click="placeOrder">
          {{ placing ? 'Placing Order...' : 'Place Order' }}
        </button>
      </template>

      <div v-else class="empty">
        <p>Your cart is empty.</p>
        <router-link to="/products" class="btn-outline">Browse Products</router-link>
      </div>
    </template>
  </div>
</template>

<style scoped>
.checkout-page { max-width: 600px; }
.checkout-page h1 { font-size: 26px; margin: 0 0 24px; }

.summary-list { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-bottom: 16px; }
.summary-row {
  display: flex; align-items: center; padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.summary-row:last-child { border-bottom: none; }
.sr-name { flex: 1; font-size: 14px; color: var(--text-h); }
.sr-qty { font-size: 13px; color: var(--text); margin: 0 16px; }
.sr-sub { font-weight: 600; color: var(--text-h); }

.total-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border: 1px solid var(--border); border-radius: var(--radius);
  margin-bottom: 20px; font-size: 17px; color: var(--text);
}
.total-row strong { font-size: 21px; color: var(--text-h); }

.btn-primary {
  padding: 12px 28px; background: var(--accent); color: #fff; border: none;
  border-radius: 8px; font-size: 15px; font-weight: 500; cursor: pointer;
  transition: background var(--transition); text-decoration: none; display: inline-block;
}
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); text-decoration: none; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary.full { width: 100%; text-align: center; }

.success-block { text-align: center; padding: 40px 0; }
.success-icon { margin-bottom: 16px; }
.success-block h1 { color: #16a34a; margin-bottom: 8px; }
.success-block p { font-size: 15px; margin-bottom: 6px; }
.success-total { font-size: 17px; margin-bottom: 24px !important; }
.success-actions { display: flex; gap: 12px; justify-content: center; }

.error-msg {
  background: var(--danger-bg); color: var(--danger); padding: 10px 14px;
  border-radius: 8px; font-size: 14px; margin-bottom: 16px; border: 1px solid rgba(220,38,38,0.2);
}

.loading { padding: 8px 0; }

.empty { text-align: center; padding: 48px 0; color: var(--text); }
.empty p { margin-bottom: 16px; }

.btn-outline {
  display: inline-block; padding: 10px 28px; border: 1px solid var(--border);
  color: var(--text-h); border-radius: 8px; text-decoration: none; font-size: 14px;
  transition: all var(--transition);
}
.btn-outline:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }
</style>

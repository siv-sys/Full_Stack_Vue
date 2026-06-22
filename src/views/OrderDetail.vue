<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrder } from '../api/orders.js'

const route = useRoute()
const order = ref(null)
const loading = ref(true)
const fetchError = ref(false)

onMounted(async () => {
  try {
    const { data } = await getOrder(route.params.id)
    order.value = data
  } catch {
    fetchError.value = true
  } finally {
    loading.value = false
  }
})

function formatPrice(p) { return parseFloat(p).toFixed(2) }
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function onImgError(e) { e.target.style.display = 'none'; e.target.parentElement.classList.add('img-fallback') }
</script>

<template>
  <div class="order-detail">
    <div v-if="loading" class="loading">
      <div class="skeleton" style="width:200px;height:14px;margin-bottom:20px"></div>
      <div class="skeleton" style="height:32px;width:50%;margin-bottom:8px"></div>
      <div class="skeleton" style="height:14px;width:30%;margin-bottom:36px"></div>
      <div v-for="n in 3" :key="n" class="skeleton" style="height:56px;margin-bottom:8px;border-radius:8px"></div>
    </div>

    <div v-else-if="fetchError || !order" class="empty">
      <p>{{ fetchError ? 'Failed to load order.' : 'Order not found.' }}</p>
      <button v-if="fetchError" class="btn-outline" @click="$router.go(0)">Retry</button>
      <router-link v-else to="/orders" class="btn-outline">Back to Orders</router-link>
    </div>

    <template v-else>
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <router-link to="/orders">My Orders</router-link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span>Order #{{ order.id }}</span>
      </nav>

      <div class="order-head">
        <div>
          <h1>Order #{{ order.id }}</h1>
          <span class="order-date">{{ formatDate(order.created_at) }}</span>
        </div>
        <span class="order-status" :class="order.status">{{ order.status }}</span>
      </div>

      <div class="items-section">
        <h2>Items</h2>
        <div class="items-list">
          <div v-for="item in order.items" :key="item.id" class="item-row">
            <div v-if="item.product?.image" class="item-img">
              <img :src="item.product.image" :alt="item.product?.name" @error="onImgError" />
            </div>
            <div class="item-info">
              <span class="item-name">{{ item.product?.name || item.product_name }}</span>
              <span class="item-qty">Qty: {{ item.quantity }}</span>
            </div>
            <span class="item-price">${{ formatPrice(item.price) }}</span>
            <span class="item-sub">${{ formatPrice(item.price * item.quantity) }}</span>
          </div>
        </div>
      </div>

      <div class="total-row">
        <span>Total</span>
        <strong>${{ formatPrice(order.total) }}</strong>
      </div>

      <router-link to="/orders" class="btn-outline">Back to Orders</router-link>
    </template>
  </div>
</template>

<style scoped>
.breadcrumbs {
  display: flex; align-items: center; gap: 6px; margin-bottom: 18px;
  font-size: 13px; color: var(--text);
}
.breadcrumbs a { color: var(--accent); text-decoration: none; }
.breadcrumbs a:hover { text-decoration: underline; }
.breadcrumbs svg { color: var(--border); flex-shrink: 0; }

.order-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
.order-detail h1 { font-size: 26px; margin: 0 0 4px; }
.order-date { font-size: 13px; color: var(--text); }

.order-status {
  font-size: 12px; padding: 4px 12px; border-radius: 20px; font-weight: 500; text-transform: capitalize;
}
.order-status.pending    { background: #fef3c7; color: #92400e; }
.order-status.processing { background: #dbeafe; color: #1e40af; }
.order-status.completed, .order-status.delivered { background: #dcfce7; color: #166534; }
.order-status.cancelled  { background: #fef2f2; color: #991b1b; }

@media (prefers-color-scheme: dark) {
  .order-status.pending    { background: rgba(146,64,14,0.2); }
  .order-status.processing { background: rgba(30,64,175,0.2); }
  .order-status.completed, .order-status.delivered { background: rgba(22,101,52,0.2); }
  .order-status.cancelled  { background: rgba(153,27,27,0.2); }
}

.items-section h2 { font-size: 18px; margin: 0 0 12px; }

.items-list { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-bottom: 16px; }

.item-row {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.item-row:last-child { border-bottom: none; }

.item-img {
  width: 46px; height: 46px; border-radius: 6px; overflow: hidden;
  background: var(--code-bg); flex-shrink: 0;
}
.item-img img { width: 100%; height: 100%; object-fit: cover; }

.item-info { flex: 1; }
.item-name { display: block; font-size: 14px; font-weight: 500; color: var(--text-h); }
.item-qty { font-size: 12px; color: var(--text); }
.item-price { font-size: 13px; color: var(--text); min-width: 65px; text-align: right; }
.item-sub { font-weight: 600; color: var(--text-h); min-width: 75px; text-align: right; }

.total-row {
  display: flex; justify-content: space-between; padding: 14px 16px;
  border: 1px solid var(--border); border-radius: var(--radius);
  margin-bottom: 22px; font-size: 17px; color: var(--text-h);
}
.total-row strong { font-size: 20px; }

.btn-outline {
  display: inline-block; padding: 9px 22px; border: 1px solid var(--border);
  color: var(--text-h); border-radius: 8px; text-decoration: none; font-size: 14px;
  transition: all var(--transition);
}
.btn-outline:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }

.empty { text-align: center; padding: 48px 0; color: var(--text); }
.empty p { margin-bottom: 16px; }
</style>

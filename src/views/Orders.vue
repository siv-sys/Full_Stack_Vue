<script setup>
import { ref, onMounted } from 'vue'
import { getOrders } from '../api/orders.js'

const orders = ref([])
const meta = ref({})
const loading = ref(true)
const fetchError = ref(false)
const page = ref(1)

async function fetchOrders() {
  loading.value = true
  fetchError.value = false
  try {
    const { data } = await getOrders({ page: page.value })
    orders.value = data.items || data || []
    meta.value = data.meta || {}
  } catch {
    fetchError.value = true
  } finally {
    loading.value = false
  }
}

function goToPage(p) { page.value = p; fetchOrders() }

onMounted(fetchOrders)

function formatPrice(p) { return parseFloat(p).toFixed(2) }
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="orders-page">
    <h1>My Orders</h1>

    <div v-if="loading" class="skeleton-list">
      <div v-for="n in 4" :key="n" class="skeleton" style="height:72px;border-radius:10px;margin-bottom:10px"></div>
    </div>

    <div v-else-if="fetchError" class="empty">
      <p>Failed to load orders.</p>
      <button class="btn-outline" @click="fetchOrders">Retry</button>
    </div>

    <div v-else-if="orders.length" class="orders-list">
      <router-link v-for="order in orders" :key="order.id" :to="`/orders/${order.id}`" class="order-card">
        <div class="order-top">
          <span class="order-id">Order #{{ order.id }}</span>
          <span class="order-status" :class="order.status">{{ order.status }}</span>
        </div>
        <div class="order-bottom">
          <span class="order-date">{{ formatDate(order.created_at) }}</span>
          <span class="order-total">${{ formatPrice(order.total) }}</span>
        </div>
      </router-link>

      <div v-if="meta.last_page > 1" class="pagination">
        <button :disabled="page <= 1" @click="goToPage(page - 1)">Prev</button>
        <button v-for="p in meta.last_page" :key="p" :class="{ active: p === page }" @click="goToPage(p)">{{ p }}</button>
        <button :disabled="page >= meta.last_page" @click="goToPage(page + 1)">Next</button>
      </div>
    </div>

    <div v-else class="empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p>You have no orders yet.</p>
      <router-link to="/products" class="btn-outline">Browse Products</router-link>
    </div>
  </div>
</template>

<style scoped>
.orders-page h1 { font-size: 26px; margin: 0 0 24px; }

.orders-list { display: flex; flex-direction: column; gap: 10px; }

.order-card {
  display: block; padding: 16px 18px; border: 1px solid var(--border);
  border-radius: var(--radius); text-decoration: none; color: inherit;
  transition: box-shadow var(--transition);
}
.order-card:hover { box-shadow: var(--shadow); text-decoration: none; }

.order-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.order-id { font-weight: 600; color: var(--text-h); font-size: 15px; }

.order-status {
  font-size: 12px; padding: 3px 10px; border-radius: 20px; font-weight: 500; text-transform: capitalize;
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

.order-bottom { display: flex; justify-content: space-between; align-items: center; }
.order-date { font-size: 13px; color: var(--text); }
.order-total { font-weight: 600; color: var(--text-h); font-size: 15px; }

.pagination { display: flex; justify-content: center; gap: 6px; margin-top: 22px; }
.pagination button {
  padding: 7px 12px; border: 1px solid var(--border); background: var(--bg);
  color: var(--text-h); border-radius: var(--radius-sm); cursor: pointer; font-size: 13px;
  transition: all var(--transition); font-family: inherit;
}
.pagination button:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.pagination button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.pagination button:disabled { opacity: 0.35; cursor: not-allowed; }

.empty { text-align: center; padding: 48px 0; color: var(--text); }
.empty svg { margin-bottom: 12px; }
.empty p { margin-bottom: 16px; }
.btn-outline {
  display: inline-block; padding: 9px 24px; border: 1px solid var(--border);
  color: var(--text-h); border-radius: 8px; text-decoration: none; font-size: 14px;
  transition: all var(--transition); background: none; cursor: pointer; font-family: inherit;
}
.btn-outline:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }
</style>

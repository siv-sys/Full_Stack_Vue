import api from './axios.js'

export function getOrders(params = {}) {
  return api.get('/orders', { params })
}

export function getOrder(id) {
  return api.get(`/orders/${id}`)
}

export function checkout() {
  return api.post('/checkout')
}

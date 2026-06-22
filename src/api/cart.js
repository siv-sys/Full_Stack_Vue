import api from './axios.js'

export function getCart() {
  return api.get('/cart')
}

export function addToCart(product_id, quantity = 1) {
  return api.post('/cart', { product_id, quantity })
}

export function updateCartItem(id, quantity) {
  return api.put(`/cart/${id}`, { quantity })
}

export function removeCartItem(id) {
  return api.delete(`/cart/${id}`)
}

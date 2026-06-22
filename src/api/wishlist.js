import api from './axios.js'

export function getWishlist() {
  return api.get('/wishlist')
}

export function addToWishlist(product_id) {
  return api.post('/wishlist', { product_id })
}

export function removeFromWishlist(productId) {
  return api.delete(`/wishlist/${productId}`)
}

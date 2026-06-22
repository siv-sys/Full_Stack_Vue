import api from './axios.js'

export function getProducts(params = {}) {
  return api.get('/products', { params })
}

export function getProduct(id) {
  return api.get(`/products/${id}`)
}

export function getProductReviews(id, params = {}) {
  return api.get(`/products/${id}/reviews`, { params })
}

export function createReview(productId, data) {
  return api.post(`/products/${productId}/reviews`, data)
}

export function getCategories() {
  return api.get('/categories')
}

export function createProduct(formData) {
  return api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function updateProduct(id, formData) {
  formData.append('_method', 'PUT')
  return api.post(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function deleteProduct(id) {
  return api.delete(`/products/${id}`)
}

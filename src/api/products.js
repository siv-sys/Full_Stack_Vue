import api from './axios.js'

let productsAbort = null

export function getProducts(params = {}) {
  if (productsAbort) productsAbort.abort()
  productsAbort = new AbortController()
  return api.get('/products', { params, signal: productsAbort.signal })
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

let categoriesCache = null

export function getCategories() {
  if (categoriesCache) return Promise.resolve(categoriesCache)
  return api.get('/categories').then(res => { categoriesCache = res; return res })
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

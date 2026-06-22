import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '/api'

const api = axios.create({
  baseURL,
  headers: { Accept: 'application/json' }
})

let _router = null

export function setRouter(router) {
  _router = router
}

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      response.data = response.data.data
    }
    return response
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (_router) {
        const current = _router.currentRoute.value.fullPath
        if (current !== '/login' && current !== '/register') {
          _router.push({ path: '/login', query: { redirect: current } })
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

import api from './axios.js'

export function loginApi(email, password) {
  return api.post('/auth/login', { email, password })
}

export function registerApi(name, email, password, password_confirmation) {
  return api.post('/auth/register', { name, email, password, password_confirmation })
}

export function getMe() {
  return api.get('/user')
}

export function logoutApi() {
  return api.post('/auth/logout')
}

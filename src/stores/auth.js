import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, registerApi, getMe, logoutApi } from '../api/auth.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  function setAuth(t, u) {
    token.value = t
    user.value = u
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function login(email, password) {
    const { data } = await loginApi(email, password)
    setAuth(data.token, data.user)
    return data
  }

  async function register(name, email, password, passwordConfirmation) {
    const { data } = await registerApi(name, email, password, passwordConfirmation)
    setAuth(data.token, data.user)
    return data
  }

  async function fetchUser() {
    const { data } = await getMe()
    user.value = data.user || data
    localStorage.setItem('user', JSON.stringify(user.value))
    return user.value
  }

  async function logout() {
    try {
      await logoutApi()
    } finally {
      clearAuth()
    }
  }

  return { token, user, isAuthenticated, login, register, fetchUser, logout, clearAuth }
})

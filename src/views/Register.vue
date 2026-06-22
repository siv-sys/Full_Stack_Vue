<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const errors = ref({})
const loading = ref(false)
const showPw = ref(false)
const showCpw = ref(false)

const emailValid = computed(() => !email.value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const pwdLong = computed(() => !password.value || password.value.length >= 6)
const pwdMatch = computed(() => !confirmPassword.value || password.value === confirmPassword.value)

async function handleRegister() {
  error.value = ''; errors.value = {}
  if (!emailValid.value) { errors.value.email = 'Invalid email format'; return }
  if (!pwdLong.value) { errors.value.password = 'Must be at least 6 characters'; return }
  if (!pwdMatch.value) { errors.value.password_confirmation = 'Passwords do not match'; return }

  loading.value = true
  try {
    await auth.register(name.value, email.value, password.value, confirmPassword.value)
    router.push(route.query.redirect || '/')
  } catch (err) {
    if (err.response?.status === 422 && err.response.data?.errors) {
      Object.entries(err.response.data.errors).forEach(([k,v]) => { errors.value[k] = Array.isArray(v) ? v[0] : v })
    }
    error.value = err.response?.data?.message || 'Registration failed'
  } finally { loading.value = false }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <router-link to="/" class="auth-logo">ShopVue</router-link>
      <h1>Create account</h1>
      <p class="subtitle">Sign up to get started</p>

      <div v-if="error" class="msg error-msg">{{ error }}</div>

      <form @submit.prevent="handleRegister">
        <div class="fg">
          <label for="name">Full Name</label>
          <input id="name" v-model="name" type="text" placeholder="John Doe" required autocomplete="name" :class="{ 'has-error': errors.name }" />
          <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
        </div>

        <div class="fg">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" placeholder="you@example.com" required autocomplete="email" :class="{ 'has-error': errors.email || (!emailValid && email) }" />
          <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
          <span v-else-if="!emailValid && email" class="field-error">Invalid email format</span>
        </div>

        <div class="fg">
          <label for="password">Password</label>
          <div class="pw-wrap">
            <input id="password" v-model="password" :type="showPw ? 'text' : 'password'" placeholder="At least 6 characters" required autocomplete="new-password" :class="{ 'has-error': errors.password || (!pwdLong && password) }" />
            <button type="button" class="pw-toggle" @click="showPw = !showPw" tabindex="-1" :aria-label="showPw ? 'Hide password' : 'Show password'">{{ showPw ? 'Hide' : 'Show' }}</button>
          </div>
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
          <span v-else-if="!pwdLong && password" class="field-error">Must be at least 6 characters</span>
        </div>

        <div class="fg">
          <label for="confirm">Confirm Password</label>
          <div class="pw-wrap">
            <input id="confirm" v-model="confirmPassword" :type="showCpw ? 'text' : 'password'" placeholder="Re-enter your password" required autocomplete="new-password" :class="{ 'has-error': errors.password_confirmation || (!pwdMatch && confirmPassword) }" />
            <button type="button" class="pw-toggle" @click="showCpw = !showCpw" tabindex="-1" :aria-label="showCpw ? 'Hide password' : 'Show password'">{{ showCpw ? 'Hide' : 'Show' }}</button>
          </div>
          <span v-if="errors.password_confirmation" class="field-error">{{ errors.password_confirmation }}</span>
          <span v-else-if="!pwdMatch && confirmPassword" class="field-error">Passwords do not match</span>
        </div>

        <button type="submit" class="btn-submit" :disabled="loading || !emailValid || (!pwdLong && !!password) || (!pwdMatch && !!confirmPassword)">
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <p class="switch">Already have an account? <router-link to="/login">Login</router-link></p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 20px; background: var(--bg-soft);
}

.auth-card {
  width: 100%; max-width: 400px; padding: 36px;
  border-radius: 12px; border: 1px solid var(--border); background: var(--bg);
  box-shadow: var(--shadow);
}

.auth-logo {
  display: block; text-align: center; font-size: 22px; font-weight: 700;
  color: var(--accent); text-decoration: none; margin-bottom: 24px;
}

h1 { font-size: 24px; margin: 0 0 4px; text-align: center; }
.subtitle { text-align: center; margin-bottom: 24px; color: var(--text); font-size: 14px; }

.fg { margin-bottom: 16px; }
.fg label { display: block; font-size: 13px; font-weight: 500; color: var(--text-h); margin-bottom: 5px; }

.fg input {
  width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px;
  font-size: 15px; background: var(--bg); color: var(--text-h);
  transition: border-color var(--transition);
}
.fg input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-bg); }
.has-error { border-color: var(--danger) !important; }

.pw-wrap { position: relative; }
.pw-wrap input { padding-right: 56px; }
.pw-toggle {
  position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: var(--accent); font-size: 13px;
  cursor: pointer; padding: 6px 8px; font-weight: 500;
}

.field-error { display: block; font-size: 12px; color: var(--danger); margin-top: 4px; }

.msg { padding: 10px 14px; border-radius: 8px; font-size: 14px; margin-bottom: 16px; }
.error-msg { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(220,38,38,0.2); }

.btn-submit {
  width: 100%; padding: 11px; background: var(--accent); color: #fff;
  border: none; border-radius: 8px; font-size: 15px; font-weight: 500;
  cursor: pointer; margin-top: 4px; transition: background var(--transition);
}
.btn-submit:hover:not(:disabled) { background: var(--accent-hover); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.switch { text-align: center; margin-top: 20px; font-size: 14px; color: var(--text); }
.switch a { color: var(--accent); text-decoration: none; font-weight: 500; }
.switch a:hover { text-decoration: underline; }
</style>

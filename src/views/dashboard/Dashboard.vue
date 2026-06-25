<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMe, logout, getUser } from '../../api/auth.js'

const router = useRouter()
const user = ref(getUser())
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await getMe()
    user.value = data.user
  } catch {
    handleLogout()
  } finally {
    loading.value = false
  }
})

async function handleLogout() {
  await logout()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-container">
    <div class="dashboard-card" v-if="!loading">
      <div class="avatar">{{ user?.name?.charAt(0)?.toUpperCase() }}</div>
      <h1>Welcome, {{ user?.name }}!</h1>
      <p class="email">{{ user?.email }}</p>
      <p class="message">You are successfully logged in.</p>
      <button @click="handleLogout">Logout</button>
    </div>
    <div v-else class="loading">Loading...</div>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.dashboard-card {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg);
  box-shadow: var(--shadow);
  text-align: center;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  margin: 0 auto 20px;
}

h1 {
  font-size: 24px;
  margin: 0 0 8px;
}

.email {
  color: var(--text);
  font-size: 14px;
  margin-bottom: 8px;
}

.message {
  color: var(--accent);
  font-size: 14px;
  margin-bottom: 24px;
}

button {
  padding: 10px 32px;
  background: transparent;
  color: var(--text-h);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.loading {
  color: var(--text);
  font-size: 18px;
}
</style>

<script setup>
import { useAuthStore } from '../stores/auth.js'
import { useCartStore } from '../stores/cart.js'
import { useWishlistStore } from '../stores/wishlist.js'
import { useConfirm } from '../composables/useConfirm.js'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, onUnmounted, watch } from 'vue'

const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const { confirm } = useConfirm()
const router = useRouter()
const route = useRoute()

const mobileOpen = ref(false)
const userMenuOpen = ref(false)
const headerSearch = ref('')

onMounted(() => {
  if (auth.isAuthenticated) {
    cart.fetchCart()
    wishlist.fetchWishlist()
  }
  document.addEventListener('click', closeMenus)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenus)
})

watch(route, () => {
  mobileOpen.value = false
  userMenuOpen.value = false
})

function closeMenus(e) {
  if (!e.target.closest('.user-menu-wrap')) userMenuOpen.value = false
}

function submitSearch() {
  const q = headerSearch.value.trim()
  if (q) router.push({ path: '/products', query: { search: q } })
  else router.push('/products')
  headerSearch.value = ''
  mobileOpen.value = false
}

async function requestLogout() {
  userMenuOpen.value = false
  mobileOpen.value = false
  const ok = await confirm({
    title: 'Are you sure you want to logout?',
    message: 'You will need to sign in again to access your account.',
    confirmLabel: 'Logout',
    danger: true
  })
  if (ok) {
    await auth.logout()
    router.push('/login')
  }
}
</script>

<template>
  <div class="app-layout">
    <header class="nav-header">
      <div class="nav-inner">
        <router-link to="/" class="nav-logo" aria-label="ShopVue Home">ShopVue</router-link>

        <form class="header-search" @submit.prevent="submitSearch" role="search">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            v-model="headerSearch"
            type="search"
            placeholder="Search products..."
            aria-label="Search products"
          />
        </form>

        <nav class="nav-actions">
          <router-link to="/products" class="nav-link desktop-only" aria-label="Products">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            <span class="nav-label">Products</span>
          </router-link>

          <template v-if="auth.isAuthenticated">
            <router-link to="/wishlist" class="nav-link" aria-label="Wishlist">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span class="nav-label desktop-only">Wishlist</span>
            </router-link>

            <router-link to="/cart" class="nav-link cart-link" aria-label="Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span v-if="cart.itemCount" class="cart-badge">{{ cart.itemCount > 9 ? '9+' : cart.itemCount }}</span>
              <span class="nav-label desktop-only">Cart</span>
            </router-link>

            <div class="user-menu-wrap" @click.stop>
              <button
                class="user-avatar-btn"
                @click="userMenuOpen = !userMenuOpen"
                :aria-expanded="userMenuOpen"
                aria-haspopup="true"
                aria-label="User menu"
              >
                <span class="avatar-circle">{{ auth.user?.name?.charAt(0)?.toUpperCase() || 'U' }}</span>
                <svg class="chevron" :class="{ open: userMenuOpen }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <Transition name="dropdown">
                <div v-if="userMenuOpen" class="user-dropdown" role="menu">
                  <div class="dropdown-header">{{ auth.user?.name }}<br><small>{{ auth.user?.email }}</small></div>
                  <router-link to="/profile" class="dropdown-item" role="menuitem" @click="userMenuOpen = false">Profile</router-link>
                  <router-link to="/orders" class="dropdown-item" role="menuitem" @click="userMenuOpen = false">My Orders</router-link>
                  <button class="dropdown-item logout" role="menuitem" @click="requestLogout">Logout</button>
                </div>
              </Transition>
            </div>
          </template>

          <template v-else>
            <router-link to="/login" class="nav-btn">Login</router-link>
            <router-link to="/register" class="nav-btn primary">Register</router-link>
          </template>

          <button class="hamburger" @click="mobileOpen = !mobileOpen" :aria-expanded="mobileOpen" aria-label="Menu">
            <svg v-if="!mobileOpen" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </nav>
      </div>

      <Transition name="slide">
        <div v-if="mobileOpen" class="mobile-drawer">
          <form class="mobile-search" @submit.prevent="submitSearch">
            <input v-model="headerSearch" type="search" placeholder="Search products..." aria-label="Search products" />
            <button type="submit" aria-label="Search">Go</button>
          </form>
          <router-link to="/" class="mobile-link" @click="mobileOpen = false">Home</router-link>
          <router-link to="/products" class="mobile-link" @click="mobileOpen = false">Products</router-link>
          <template v-if="auth.isAuthenticated">
            <router-link to="/wishlist" class="mobile-link" @click="mobileOpen = false">Wishlist</router-link>
            <router-link to="/cart" class="mobile-link" @click="mobileOpen = false">
              Cart <span v-if="cart.itemCount" class="mobile-badge">{{ cart.itemCount }}</span>
            </router-link>
            <router-link to="/orders" class="mobile-link" @click="mobileOpen = false">My Orders</router-link>
            <router-link to="/profile" class="mobile-link" @click="mobileOpen = false">Profile</router-link>
            <button class="mobile-link logout" @click="requestLogout">Logout</button>
          </template>
          <template v-else>
            <router-link to="/login" class="mobile-link" @click="mobileOpen = false">Login</router-link>
            <router-link to="/register" class="mobile-link" @click="mobileOpen = false">Register</router-link>
          </template>
        </div>
      </Transition>
    </header>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ===== Header ===== */
.nav-header {
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
  text-decoration: none;
  letter-spacing: -0.5px;
  flex-shrink: 0;
}

/* ===== Header search ===== */
.header-search {
  flex: 1;
  max-width: 420px;
  position: relative;
  display: flex;
  align-items: center;
}

.header-search .search-icon {
  position: absolute;
  left: 12px;
  color: var(--text);
  pointer-events: none;
}

.header-search input {
  width: 100%;
  padding: 8px 14px 8px 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-soft);
  color: var(--text-h);
  transition: border-color var(--transition);
}

.header-search input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
}

/* ===== Nav actions ===== */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  color: var(--text);
  text-decoration: none;
  font-size: 14px;
  transition: color var(--transition), background var(--transition);
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--accent);
  background: var(--accent-bg);
  text-decoration: none;
}

.nav-label {
  font-size: 13px;
}

.cart-link {
  position: relative;
}

.cart-badge {
  position: absolute;
  top: -2px;
  right: -4px;
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

/* ===== Nav buttons ===== */
.nav-btn {
  font-size: 13px;
  padding: 6px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-h);
  cursor: pointer;
  text-decoration: none;
  transition: all var(--transition);
}

.nav-btn:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }

.nav-btn.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.nav-btn.primary:hover { opacity: 0.9; }

/* ===== User dropdown ===== */
.user-menu-wrap {
  position: relative;
}

.user-avatar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: background var(--transition);
}

.user-avatar-btn:hover {
  background: var(--accent-bg);
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.chevron {
  color: var(--text);
  transition: transform var(--transition);
}

.chevron.open {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  min-width: 200px;
  overflow: hidden;
  z-index: 110;
}

.dropdown-header {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-h);
  border-bottom: 1px solid var(--border);
  line-height: 1.4;
}

.dropdown-header small {
  font-weight: 400;
  color: var(--text);
  font-size: 12px;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  font-size: 14px;
  color: var(--text-h);
  text-decoration: none;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background var(--transition);
}

.dropdown-item:hover {
  background: var(--accent-bg);
  color: var(--accent);
  text-decoration: none;
}

.dropdown-item.logout {
  color: var(--danger);
  border-top: 1px solid var(--border);
}

.dropdown-item.logout:hover {
  background: var(--danger-bg);
  color: var(--danger);
}

.dropdown-enter-active { transition: all 0.15s ease; }
.dropdown-leave-active { transition: all 0.1s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px) scale(0.97); }

/* ===== Hamburger ===== */
.hamburger {
  display: none;
  background: none;
  border: none;
  color: var(--text-h);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  transition: background var(--transition);
}

.hamburger:hover { background: var(--accent-bg); }

/* ===== Mobile drawer ===== */
.mobile-drawer {
  border-top: 1px solid var(--border);
  padding: 12px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bg);
}

.mobile-search {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.mobile-search input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  background: var(--bg-soft);
  color: var(--text-h);
}

.mobile-search input:focus {
  outline: none;
  border-color: var(--accent);
}

.mobile-search button {
  padding: 8px 16px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
}

.mobile-link {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-h);
  text-decoration: none;
  font-size: 15px;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background var(--transition);
}

.mobile-link:hover { background: var(--accent-bg); color: var(--accent); text-decoration: none; }

.mobile-link.router-link-active { color: var(--accent); background: var(--accent-bg); }

.mobile-link.logout { color: var(--danger); }
.mobile-link.logout:hover { background: var(--danger-bg); }

.mobile-badge {
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 10px;
  margin-left: 8px;
}

.slide-enter-active { transition: all 0.2s ease; }
.slide-leave-active { transition: all 0.15s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ===== Main ===== */
.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px;
  box-sizing: border-box;
}

/* ===== Responsive ===== */
.desktop-only { display: flex; }

@media (max-width: 768px) {
  .nav-inner {
    padding: 0 16px;
  }
  .header-search { display: none; }
  .desktop-only { display: none !important; }
  .hamburger { display: flex; }
  .nav-label { display: none; }
  .nav-actions { gap: 2px; }
  .nav-btn { display: none; }
  .user-menu-wrap { display: none; }
  .main-content {
    padding: 20px 16px;
  }
}

@media (min-width: 769px) {
  .mobile-drawer { display: none !important; }
  .hamburger { display: none !important; }
}
</style>

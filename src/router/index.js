import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'

const routes = [
  { path: '/login', component: () => import('../views/auth/Login.vue'), meta: { guest: true } },
  { path: '/register', component: () => import('../views/auth/Register.vue'), meta: { guest: true } },
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'home', component: () => import('../views/Home.vue') },
      { path: 'products', name: 'products', component: () => import('../views/products/Products.vue') },
      { path: 'products/create', name: 'product-create', component: () => import('../views/products/CreateProduct.vue'), meta: { requiresAuth: true } },
      { path: 'products/:id/edit', name: 'product-edit', component: () => import('../views/products/EditProduct.vue'), meta: { requiresAuth: true } },
      { path: 'products/:id', name: 'product-detail', component: () => import('../views/products/ProductDetail.vue') },
      { path: 'wishlist', name: 'wishlist', component: () => import('../views/wishlist/Wishlist.vue'), meta: { requiresAuth: true } },
      { path: 'cart', name: 'cart', component: () => import('../views/cart/Cart.vue'), meta: { requiresAuth: true } },
      { path: 'checkout', name: 'checkout', component: () => import('../views/orders/Checkout.vue'), meta: { requiresAuth: true } },
      { path: 'orders', name: 'orders', component: () => import('../views/orders/Orders.vue'), meta: { requiresAuth: true } },
      { path: 'orders/:id', name: 'order-detail', component: () => import('../views/orders/OrderDetail.vue'), meta: { requiresAuth: true } },
      { path: 'profile', name: 'profile', component: () => import('../views/profile/Profile.vue'), meta: { requiresAuth: true } },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && token) {
    next('/')
  } else {
    next()
  }
})

export default router

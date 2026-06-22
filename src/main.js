import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setRouter } from './api/axios.js'
import './style.css'

setRouter(router)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

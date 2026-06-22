import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

function addToast(message, type = 'success', duration = 3500) {
  const id = nextId++
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

export function useToast() {
  return {
    toasts,
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    dismiss: (id) => { toasts.value = toasts.value.filter(t => t.id !== id) }
  }
}

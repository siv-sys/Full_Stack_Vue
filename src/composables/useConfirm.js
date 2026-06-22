import { ref } from 'vue'

const visible = ref(false)
const title = ref('')
const message = ref('')
const confirmLabel = ref('Confirm')
const danger = ref(false)
let resolveFn = null

export function useConfirm() {
  function confirm(opts = {}) {
    title.value = opts.title || 'Are you sure?'
    message.value = opts.message || ''
    confirmLabel.value = opts.confirmLabel || 'Confirm'
    danger.value = opts.danger ?? true
    visible.value = true
    return new Promise(resolve => { resolveFn = resolve })
  }

  function onConfirm() {
    visible.value = false
    resolveFn?.(true)
    resolveFn = null
  }

  function onCancel() {
    visible.value = false
    resolveFn?.(false)
    resolveFn = null
  }

  return { visible, title, message, confirmLabel, danger, confirm, onConfirm, onCancel }
}

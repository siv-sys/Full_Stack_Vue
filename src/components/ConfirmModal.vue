<script setup>
import { useConfirm } from '../composables/useConfirm.js'
import { ref } from 'vue'

const { visible, title, message, confirmLabel, danger, onConfirm, onCancel } = useConfirm()
const confirming = ref(false)

async function handleConfirm() {
  confirming.value = true
  onConfirm()
  confirming.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="confirm-overlay" @click.self="onCancel" role="dialog" aria-modal="true">
        <div class="confirm-card">
          <h3>{{ title }}</h3>
          <p v-if="message">{{ message }}</p>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" @click="onCancel">Cancel</button>
            <button
              class="confirm-btn ok"
              :class="{ danger }"
              :disabled="confirming"
              @click="handleConfirm"
            >{{ confirmLabel }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.confirm-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 28px 32px;
  max-width: 400px;
  width: calc(100% - 32px);
  box-shadow: var(--shadow);
  text-align: center;
}

.confirm-card h3 {
  font-size: 17px;
  color: var(--text-h);
  margin: 0 0 6px;
}

.confirm-card p {
  font-size: 14px;
  color: var(--text);
  margin-bottom: 22px;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn {
  padding: 9px 22px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-btn.cancel {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-h);
}

.confirm-btn.cancel:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.confirm-btn.ok {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: #fff;
}

.confirm-btn.ok:hover:not(:disabled) {
  opacity: 0.9;
}

.confirm-btn.ok.danger {
  background: #dc2626;
  border-color: #dc2626;
}

.confirm-btn.ok.danger:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
}

.modal-enter-active { transition: opacity 0.2s ease; }
.modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .confirm-card { animation: modal-in 0.2s ease; }
.modal-leave-active .confirm-card { animation: modal-out 0.15s ease; }

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes modal-out {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(0.95) translateY(8px); }
}
</style>

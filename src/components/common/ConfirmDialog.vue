<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <div v-if="open" class="overlay" role="dialog" aria-modal="true" :aria-label="title">
    <div class="dialog">
      <h2 class="dialog-title">{{ title }}</h2>
      <p class="dialog-message">{{ message }}</p>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="loading"
          @click="emit('cancel')"
        >
          {{ cancelLabel ?? '取消' }}
        </button>
        <button
          type="button"
          class="btn"
          :class="danger ? 'btn-danger' : 'btn-primary'"
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ loading ? '處理中…' : (confirmLabel ?? '確認') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(44, 42, 40, 0.45);
}

.dialog {
  width: 100%;
  max-width: 22rem;
  background: var(--color-surface);
  border-radius: var(--radius);
  padding: 1.25rem;
  box-shadow: var(--shadow);
}

.dialog-title {
  font-size: 1.15rem;
  margin-bottom: 0.5rem;
}

.dialog-message {
  margin-bottom: 1.25rem;
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  min-height: 44px;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  border: none;
  font-weight: 600;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-secondary {
  background: #fff;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn-danger {
  background: var(--color-danger);
  color: #fff;
}
</style>

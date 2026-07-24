<script setup lang="ts">
import type { ChecklistItem } from '@/types/checklist'

defineProps<{
  item: ChecklistItem
  assigneeName: string
  canEdit: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  toggle: [completed: boolean]
  edit: []
  remove: []
}>()
</script>

<template>
  <article class="check-item" :class="{ done: item.is_completed }">
    <label class="check">
      <input
        type="checkbox"
        :checked="item.is_completed"
        :disabled="!canEdit || disabled"
        @change="emit('toggle', ($event.target as HTMLInputElement).checked)"
      />
      <span class="content">{{ item.content }}</span>
    </label>

    <p v-if="item.assigned_to" class="assignee">指派：{{ assigneeName }}</p>

    <div v-if="canEdit" class="actions">
      <button type="button" class="btn-text" :disabled="disabled" @click="emit('edit')">
        編輯
      </button>
      <button
        type="button"
        class="btn-text danger"
        :disabled="disabled"
        @click="emit('remove')"
      >
        刪除
      </button>
    </div>
  </article>
</template>

<style scoped>
.check-item {
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--color-border);
}

.check-item:last-child {
  border-bottom: none;
}

.check-item.done .content {
  text-decoration: line-through;
  color: var(--color-text-muted);
}

.check {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  cursor: pointer;
}

.check input {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.15rem;
  flex-shrink: 0;
  accent-color: var(--color-primary);
}

.content {
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
}

.assignee {
  margin: 0.35rem 0 0 1.9rem;
  font-size: 0.85rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin: 0.35rem 0 0 1.9rem;
}

.btn-text {
  min-height: 40px;
  padding: 0.25rem 0.1rem;
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-weight: 600;
}

.btn-text.danger {
  color: var(--color-danger);
}

.btn-text:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>

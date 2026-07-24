<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { ChecklistFormValues, ChecklistItem } from '@/types/checklist'
import type { TripMemberWithProfile } from '@/types/trip'
import { validateChecklistForm } from '@/utils/checklistValidation'

const props = defineProps<{
  mode: 'create' | 'edit'
  initialItem?: ChecklistItem | null
  members: TripMemberWithProfile[]
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [values: ChecklistFormValues]
  cancel: []
}>()

const form = reactive<ChecklistFormValues>({
  content: '',
  assigned_to: '',
})

const fieldErrors = reactive<Partial<Record<keyof ChecklistFormValues, string>>>({})

function memberLabel(member: TripMemberWithProfile): string {
  return member.profile?.display_name || `成員 ${member.user_id.slice(0, 6)}`
}

function fillForm(item: ChecklistItem | null | undefined) {
  form.content = item?.content ?? ''
  form.assigned_to = item?.assigned_to ?? ''
}

watch(
  () => [props.initialItem, props.mode] as const,
  () => {
    fillForm(props.mode === 'edit' ? props.initialItem : null)
  },
  { immediate: true },
)

function handleSubmit() {
  if (props.submitting) {
    return
  }

  const result = validateChecklistForm(form)
  ;(Object.keys(fieldErrors) as Array<keyof ChecklistFormValues>).forEach((key) => {
    delete fieldErrors[key]
  })
  Object.assign(fieldErrors, result.errors)

  if (!result.ok) {
    return
  }

  emit('submit', { ...form })
}
</script>

<template>
  <form class="check-form" @submit.prevent="handleSubmit">
    <label class="field">
      <span class="label">項目名稱 <em>*</em></span>
      <input
        v-model="form.content"
        class="input"
        type="text"
        maxlength="120"
        placeholder="例如：充電器、雨衣"
        :disabled="submitting"
      />
      <span v-if="fieldErrors.content" class="field-error">{{ fieldErrors.content }}</span>
    </label>

    <label class="field">
      <span class="label">指派對象</span>
      <select v-model="form.assigned_to" class="input" :disabled="submitting">
        <option value="">未指派</option>
        <option v-for="member in members" :key="member.user_id" :value="member.user_id">
          {{ memberLabel(member) }}
        </option>
      </select>
    </label>

    <div class="actions">
      <button type="button" class="btn btn-secondary" :disabled="submitting" @click="emit('cancel')">
        取消
      </button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        {{ submitting ? '處理中…' : mode === 'create' ? '新增項目' : '儲存變更' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.check-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.label {
  font-size: 0.9rem;
  font-weight: 700;
}

.label em {
  color: var(--color-danger);
  font-style: normal;
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}
</style>

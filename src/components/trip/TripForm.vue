<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { Trip, TripFormValues } from '@/types/trip'
import { validateTripForm } from '@/utils/tripValidation'

const props = defineProps<{
  mode: 'create' | 'edit'
  initialTrip?: Trip | null
  submitting?: boolean
  submitLabel?: string
}>()

const emit = defineEmits<{
  submit: [values: TripFormValues]
  cancel: []
}>()

const form = reactive<TripFormValues>({
  title: '',
  destination: '',
  description: '',
  start_date: '',
  end_date: '',
  cover_image_url: '',
})

const fieldErrors = reactive<Partial<Record<keyof TripFormValues, string>>>({})

function fillFromTrip(trip: Trip | null | undefined) {
  form.title = trip?.title ?? ''
  form.destination = trip?.destination ?? ''
  form.description = trip?.description ?? ''
  form.start_date = trip?.start_date ?? ''
  form.end_date = trip?.end_date ?? ''
  form.cover_image_url = trip?.cover_image_url ?? ''
}

watch(
  () => props.initialTrip,
  (trip) => {
    if (props.mode === 'edit') {
      fillFromTrip(trip)
    }
  },
  { immediate: true },
)

const resolvedSubmitLabel = computed(() => {
  if (props.submitLabel) {
    return props.submitLabel
  }
  return props.mode === 'create' ? '建立旅行' : '儲存變更'
})

function handleSubmit() {
  if (props.submitting) {
    return
  }

  const result = validateTripForm(form)
  Object.keys(fieldErrors).forEach((key) => {
    delete fieldErrors[key as keyof TripFormValues]
  })
  Object.assign(fieldErrors, result.errors)

  if (!result.ok) {
    return
  }

  emit('submit', { ...form })
}
</script>

<template>
  <form class="trip-form" @submit.prevent="handleSubmit">
    <label class="field">
      <span class="label">旅行名稱 <em>*</em></span>
      <input v-model="form.title" class="input" type="text" maxlength="80" :disabled="submitting" />
      <span v-if="fieldErrors.title" class="field-error">{{ fieldErrors.title }}</span>
    </label>

    <label class="field">
      <span class="label">目的地</span>
      <input v-model="form.destination" class="input" type="text" maxlength="80" :disabled="submitting" />
    </label>

    <div class="row">
      <label class="field">
        <span class="label">開始日期 <em>*</em></span>
        <input v-model="form.start_date" class="input" type="date" :disabled="submitting" />
        <span v-if="fieldErrors.start_date" class="field-error">{{ fieldErrors.start_date }}</span>
      </label>
      <label class="field">
        <span class="label">結束日期 <em>*</em></span>
        <input v-model="form.end_date" class="input" type="date" :disabled="submitting" />
        <span v-if="fieldErrors.end_date" class="field-error">{{ fieldErrors.end_date }}</span>
      </label>
    </div>

    <label class="field">
      <span class="label">旅行介紹</span>
      <textarea
        v-model="form.description"
        class="input textarea"
        rows="3"
        maxlength="500"
        :disabled="submitting"
      />
    </label>

    <label class="field">
      <span class="label">封面圖片網址</span>
      <input
        v-model="form.cover_image_url"
        class="input"
        type="url"
        placeholder="https://"
        :disabled="submitting"
      />
      <span v-if="fieldErrors.cover_image_url" class="field-error">
        {{ fieldErrors.cover_image_url }}
      </span>
    </label>

    <div class="actions">
      <button
        v-if="mode === 'edit'"
        type="button"
        class="btn btn-secondary"
        :disabled="submitting"
        @click="emit('cancel')"
      >
        取消
      </button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        {{ submitting ? '處理中…' : resolvedSubmitLabel }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.trip-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-width: 0;
}

.label {
  font-size: 0.9rem;
  font-weight: 700;
}

.label em {
  color: var(--color-danger);
  font-style: normal;
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

@media (min-width: 640px) {
  .row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.actions .btn {
  width: 100%;
}

@media (min-width: 640px) {
  .actions {
    flex-direction: row;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .actions .btn {
    width: auto;
  }
}
</style>

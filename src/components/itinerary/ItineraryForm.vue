<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { ItineraryFormValues, ItineraryItem } from '@/types/itinerary'
import { ITINERARY_CATEGORIES } from '@/types/itinerary'
import { toTimeInputValue, validateItineraryForm } from '@/utils/itineraryHelpers'

const props = defineProps<{
  mode: 'create' | 'edit'
  initialItem?: ItineraryItem | null
  defaultDayNumber?: number
  maxDayNumber?: number
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [values: ItineraryFormValues]
  cancel: []
}>()

const form = reactive<ItineraryFormValues>({
  day_number: 1,
  start_time: '',
  end_time: '',
  title: '',
  location: '',
  category: '景點',
  description: '',
  map_url: '',
  sort_order: 0,
})

const fieldErrors = reactive<Partial<Record<keyof ItineraryFormValues, string>>>({})

function fillForm(item: ItineraryItem | null | undefined) {
  if (item) {
    form.day_number = item.day_number
    form.start_time = toTimeInputValue(item.start_time)
    form.end_time = toTimeInputValue(item.end_time)
    form.title = item.title
    form.location = item.location ?? ''
    form.category = item.category
    form.description = item.description ?? ''
    form.map_url = item.map_url ?? ''
    form.sort_order = item.sort_order
    return
  }

  form.day_number = props.defaultDayNumber ?? 1
  form.start_time = ''
  form.end_time = ''
  form.title = ''
  form.location = ''
  form.category = '景點'
  form.description = ''
  form.map_url = ''
  form.sort_order = 0
}

watch(
  () => [props.initialItem, props.mode, props.defaultDayNumber] as const,
  () => {
    fillForm(props.mode === 'edit' ? props.initialItem : null)
  },
  { immediate: true },
)

function handleSubmit() {
  if (props.submitting) {
    return
  }

  const result = validateItineraryForm(form)
  ;(Object.keys(fieldErrors) as Array<keyof ItineraryFormValues>).forEach((key) => {
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
  <form class="itin-form" @submit.prevent="handleSubmit">
    <div class="row">
      <label class="field">
        <span class="label">第幾天 <em>*</em></span>
        <input
          v-model.number="form.day_number"
          class="input"
          type="number"
          min="1"
          :max="maxDayNumber ?? undefined"
          :disabled="submitting"
        />
        <span v-if="fieldErrors.day_number" class="field-error">{{ fieldErrors.day_number }}</span>
      </label>

      <label class="field">
        <span class="label">分類 <em>*</em></span>
        <select v-model="form.category" class="input" :disabled="submitting">
          <option v-for="category in ITINERARY_CATEGORIES" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
        <span v-if="fieldErrors.category" class="field-error">{{ fieldErrors.category }}</span>
      </label>
    </div>

    <label class="field">
      <span class="label">標題 <em>*</em></span>
      <input v-model="form.title" class="input" type="text" maxlength="100" :disabled="submitting" />
      <span v-if="fieldErrors.title" class="field-error">{{ fieldErrors.title }}</span>
    </label>

    <div class="row">
      <label class="field">
        <span class="label">開始時間</span>
        <input v-model="form.start_time" class="input" type="time" :disabled="submitting" />
      </label>
      <label class="field">
        <span class="label">結束時間</span>
        <input v-model="form.end_time" class="input" type="time" :disabled="submitting" />
        <span v-if="fieldErrors.end_time" class="field-error">{{ fieldErrors.end_time }}</span>
      </label>
    </div>

    <label class="field">
      <span class="label">地點</span>
      <input v-model="form.location" class="input" type="text" maxlength="120" :disabled="submitting" />
    </label>

    <label class="field">
      <span class="label">說明</span>
      <textarea
        v-model="form.description"
        class="input textarea"
        rows="3"
        maxlength="500"
        :disabled="submitting"
      />
    </label>

    <label class="field">
      <span class="label">Google Maps 網址</span>
      <input
        v-model="form.map_url"
        class="input"
        type="url"
        placeholder="https://"
        :disabled="submitting"
      />
      <span v-if="fieldErrors.map_url" class="field-error">{{ fieldErrors.map_url }}</span>
    </label>

    <label class="field">
      <span class="label">排序</span>
      <input v-model.number="form.sort_order" class="input" type="number" :disabled="submitting" />
      <span v-if="fieldErrors.sort_order" class="field-error">{{ fieldErrors.sort_order }}</span>
    </label>

    <div class="actions">
      <button type="button" class="btn btn-secondary" :disabled="submitting" @click="emit('cancel')">
        取消
      </button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        {{ submitting ? '處理中…' : mode === 'create' ? '新增行程' : '儲存變更' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.itin-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
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
  grid-template-columns: 1fr;
  gap: 0.9rem;
}

@media (min-width: 480px) {
  .row {
    grid-template-columns: 1fr 1fr;
  }
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}
</style>

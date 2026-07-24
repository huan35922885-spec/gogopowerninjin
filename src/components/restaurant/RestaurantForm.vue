<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Restaurant, RestaurantFormValues } from '@/types/restaurant'
import {
  MEAL_TYPES,
  RESTAURANT_STATUSES,
  RESTAURANT_STATUS_LABELS,
} from '@/types/restaurant'
import { validateRestaurantForm } from '@/utils/restaurantValidation'

const props = defineProps<{
  mode: 'create' | 'edit'
  initialRestaurant?: Restaurant | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [values: RestaurantFormValues]
  cancel: []
}>()

const form = reactive<RestaurantFormValues>({
  name: '',
  meal_type: '',
  address: '',
  budget: '',
  map_url: '',
  status: 'candidate',
  note: '',
})

const fieldErrors = reactive<Partial<Record<keyof RestaurantFormValues, string>>>({})

function fillForm(restaurant: Restaurant | null | undefined) {
  form.name = restaurant?.name ?? ''
  form.meal_type = restaurant?.meal_type ?? ''
  form.address = restaurant?.address ?? ''
  form.budget = restaurant?.budget ?? ''
  form.map_url = restaurant?.map_url ?? ''
  form.status = restaurant?.status ?? 'candidate'
  form.note = restaurant?.note ?? ''
}

watch(
  () => [props.initialRestaurant, props.mode] as const,
  () => {
    fillForm(props.mode === 'edit' ? props.initialRestaurant : null)
  },
  { immediate: true },
)

function handleSubmit() {
  if (props.submitting) {
    return
  }

  const result = validateRestaurantForm(form)
  ;(Object.keys(fieldErrors) as Array<keyof RestaurantFormValues>).forEach((key) => {
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
  <form class="resto-form" @submit.prevent="handleSubmit">
    <label class="field">
      <span class="label">餐廳名稱 <em>*</em></span>
      <input v-model="form.name" class="input" type="text" maxlength="100" :disabled="submitting" />
      <span v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</span>
    </label>

    <div class="row">
      <label class="field">
        <span class="label">用餐類型</span>
        <select v-model="form.meal_type" class="input" :disabled="submitting">
          <option value="">未指定</option>
          <option v-for="type in MEAL_TYPES" :key="type" :value="type">{{ type }}</option>
        </select>
      </label>

      <label class="field">
        <span class="label">狀態 <em>*</em></span>
        <select v-model="form.status" class="input" :disabled="submitting">
          <option v-for="status in RESTAURANT_STATUSES" :key="status" :value="status">
            {{ RESTAURANT_STATUS_LABELS[status] }}
          </option>
        </select>
      </label>
    </div>

    <label class="field">
      <span class="label">地址</span>
      <input v-model="form.address" class="input" type="text" maxlength="200" :disabled="submitting" />
    </label>

    <label class="field">
      <span class="label">預算</span>
      <input
        v-model="form.budget"
        class="input"
        type="text"
        placeholder="例如：一人 300 元"
        maxlength="80"
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
      <span class="label">備註</span>
      <textarea
        v-model="form.note"
        class="input textarea"
        rows="3"
        maxlength="500"
        :disabled="submitting"
      />
    </label>

    <div class="actions">
      <button type="button" class="btn btn-secondary" :disabled="submitting" @click="emit('cancel')">
        取消
      </button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        {{ submitting ? '處理中…' : mode === 'create' ? '新增餐廳' : '儲存變更' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.resto-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
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
  gap: 0.9rem;
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

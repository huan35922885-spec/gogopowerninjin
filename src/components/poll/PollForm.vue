<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { PollFormValues, PollOptionSource } from '@/types/poll'
import { validatePollForm } from '@/utils/pollValidation'

const props = defineProps<{
  restaurants: { id: string; name: string }[]
  itineraryItems: { id: string; title: string; day_number: number }[]
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [values: PollFormValues]
  cancel: []
}>()

const form = reactive<PollFormValues>({
  title: '',
  description: '',
  optionSource: 'custom',
  customOptions: ['', ''],
  selectedIds: [],
})

const formError = ref<string | null>(null)

const sourceTabs: { id: PollOptionSource; label: string }[] = [
  { id: 'custom', label: '自訂／時間' },
  { id: 'restaurant', label: '餐廳' },
  { id: 'itinerary', label: '行程' },
]

const sortedItinerary = computed(() =>
  [...props.itineraryItems].sort(
    (a, b) => a.day_number - b.day_number || a.title.localeCompare(b.title),
  ),
)

watch(
  () => form.optionSource,
  () => {
    form.selectedIds = []
    formError.value = null
  },
)

function setSource(source: PollOptionSource) {
  form.optionSource = source
}

function addCustomOption() {
  if (form.customOptions.length >= 10) {
    return
  }
  form.customOptions.push('')
}

function removeCustomOption(index: number) {
  if (form.customOptions.length <= 2) {
    return
  }
  form.customOptions.splice(index, 1)
}

function toggleSelected(id: string) {
  const idx = form.selectedIds.indexOf(id)
  if (idx >= 0) {
    form.selectedIds.splice(idx, 1)
  } else if (form.selectedIds.length < 10) {
    form.selectedIds.push(id)
  }
}

function handleSubmit() {
  if (props.submitting) {
    return
  }

  formError.value = validatePollForm(form)
  if (formError.value) {
    return
  }

  emit('submit', {
    title: form.title,
    description: form.description,
    optionSource: form.optionSource,
    customOptions: [...form.customOptions],
    selectedIds: [...form.selectedIds],
  })
}
</script>

<template>
  <form class="poll-form card" @submit.prevent="handleSubmit">
    <h2 class="form-title">發起投票</h2>
    <p class="form-hint">2～10 個選項，每人一票。可用自訂文字（含時間）、餐廳或行程。</p>

    <label class="field">
      <span class="label">標題 <em>*</em></span>
      <input
        v-model="form.title"
        class="input"
        type="text"
        maxlength="80"
        placeholder="例如：週五午餐吃哪？"
        :disabled="submitting"
      />
    </label>

    <label class="field">
      <span class="label">說明（選填）</span>
      <textarea
        v-model="form.description"
        class="input textarea"
        rows="2"
        maxlength="200"
        placeholder="補充分享給大家的脈絡"
        :disabled="submitting"
      />
    </label>

    <div class="field">
      <span class="label">選項來源</span>
      <div class="source-tabs" role="tablist">
        <button
          v-for="tab in sourceTabs"
          :key="tab.id"
          type="button"
          class="source-tab"
          :class="{ active: form.optionSource === tab.id }"
          :disabled="submitting"
          @click="setSource(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="form.optionSource === 'custom'" class="field">
      <span class="label">選項 <em>*</em></span>
      <p class="mini-hint">可填店名、景點，或時間如 14:00、15:30</p>
      <div
        v-for="(_, index) in form.customOptions"
        :key="index"
        class="option-row"
      >
        <input
          v-model="form.customOptions[index]"
          class="input"
          type="text"
          maxlength="60"
          :placeholder="`選項 ${index + 1}`"
          :disabled="submitting"
        />
        <button
          type="button"
          class="btn btn-secondary btn-icon"
          :disabled="submitting || form.customOptions.length <= 2"
          aria-label="移除選項"
          @click="removeCustomOption(index)"
        >
          −
        </button>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        :disabled="submitting || form.customOptions.length >= 10"
        @click="addCustomOption"
      >
        ＋ 新增選項
      </button>
    </div>

    <div v-else-if="form.optionSource === 'restaurant'" class="field">
      <span class="label">勾選餐廳（至少 2 家）</span>
      <p v-if="restaurants.length === 0" class="mini-hint">尚無餐廳，請先到餐廳頁新增候選。</p>
      <div v-else class="check-list">
        <label v-for="restaurant in restaurants" :key="restaurant.id" class="check-item">
          <input
            type="checkbox"
            :checked="form.selectedIds.includes(restaurant.id)"
            :disabled="submitting"
            @change="toggleSelected(restaurant.id)"
          />
          <span>{{ restaurant.name }}</span>
        </label>
      </div>
    </div>

    <div v-else class="field">
      <span class="label">勾選行程（至少 2 項）</span>
      <p v-if="sortedItinerary.length === 0" class="mini-hint">尚無行程，請先到行程頁新增。</p>
      <div v-else class="check-list">
        <label v-for="item in sortedItinerary" :key="item.id" class="check-item">
          <input
            type="checkbox"
            :checked="form.selectedIds.includes(item.id)"
            :disabled="submitting"
            @change="toggleSelected(item.id)"
          />
          <span>
            <em>D{{ item.day_number }}</em>
            {{ item.title }}
          </span>
        </label>
      </div>
    </div>

    <p v-if="formError" class="message-error" role="alert">{{ formError }}</p>

    <div class="actions">
      <button class="btn btn-primary" type="submit" :disabled="submitting">
        {{ submitting ? '建立中…' : '建立投票' }}
      </button>
      <button class="btn btn-secondary" type="button" :disabled="submitting" @click="emit('cancel')">
        取消
      </button>
    </div>
  </form>
</template>

<style scoped>
.poll-form {
  border-top: 3px solid var(--color-purple);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-title {
  margin: 0;
  font-size: 1.15rem;
}

.form-hint,
.mini-hint {
  margin: 0;
  font-size: 0.85rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.label {
  font-size: 0.9rem;
  font-weight: 700;
}

.label em {
  color: var(--color-danger);
  font-style: normal;
}

.source-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.source-tab {
  min-height: 40px;
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-pill);
  border: 1.5px solid var(--color-border);
  background: #fff;
  font: inherit;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.source-tab.active {
  border-color: transparent;
  background: var(--color-purple-soft);
  color: var(--color-purple-deep);
}

.option-row {
  display: flex;
  gap: 0.45rem;
  align-items: center;
}

.option-row .input {
  flex: 1;
  min-width: 0;
}

.btn-icon {
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  flex-shrink: 0;
}

.btn-sm {
  min-height: 40px;
  align-self: flex-start;
  font-size: 0.85rem;
}

.check-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 14rem;
  overflow-y: auto;
  padding: 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #faf8fc;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.45rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
}

.check-item:hover {
  background: var(--color-purple-soft);
}

.check-item em {
  font-style: normal;
  color: var(--color-purple);
  font-weight: 800;
  margin-right: 0.25rem;
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
    flex-wrap: wrap;
  }

  .actions .btn {
    width: auto;
  }
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTrip } from '@/composables/useTrip'
import { usePermission } from '@/composables/usePermission'
import { useChecklist } from '@/composables/useChecklist'
import ChecklistItemCard from '@/components/checklist/ChecklistItem.vue'
import ChecklistForm from '@/components/checklist/ChecklistForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { ChecklistFormValues, ChecklistItem } from '@/types/checklist'

const route = useRoute()
const tripId = computed(() => String(route.params.tripId))

const {
  currentTrip,
  members,
  myRole,
  isLoading: isTripLoading,
  fetchTripDetail,
} = useTrip()

const { canEditContent } = usePermission(myRole)

const {
  items,
  pendingItems,
  completedItems,
  isLoading,
  isSaving,
  errorMessage,
  successMessage,
  clearMessages,
  fetchItems,
  createItem,
  updateItem,
  toggleCompleted,
  deleteItem,
} = useChecklist(tripId)

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingItem = ref<ChecklistItem | null>(null)
const pendingDelete = ref<ChecklistItem | null>(null)
const localError = ref<string | null>(null)

const memberNameMap = computed(() => {
  const map = new Map<string, string>()
  for (const member of members.value) {
    map.set(
      member.user_id,
      member.profile?.display_name || `成員 ${member.user_id.slice(0, 6)}`,
    )
  }
  return map
})

function assigneeName(userId: string | null): string {
  if (!userId) {
    return '未指派'
  }
  return memberNameMap.value.get(userId) ?? '未知成員'
}

watch(
  tripId,
  async (id) => {
    if (!currentTrip.value || currentTrip.value.id !== id) {
      await fetchTripDetail(id)
    }
    await fetchItems()
  },
  { immediate: true },
)

function openCreate() {
  if (!canEditContent.value) {
    return
  }
  clearMessages()
  localError.value = null
  formMode.value = 'create'
  editingItem.value = null
  showForm.value = true
}

function openEdit(item: ChecklistItem) {
  if (!canEditContent.value) {
    return
  }
  clearMessages()
  localError.value = null
  formMode.value = 'edit'
  editingItem.value = item
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingItem.value = null
}

async function handleSubmit(values: ChecklistFormValues) {
  if (isSaving.value) {
    return
  }

  localError.value = null
  try {
    if (formMode.value === 'create') {
      await createItem(values)
    } else if (editingItem.value) {
      await updateItem(editingItem.value.id, values)
    }
    closeForm()
  } catch (error) {
    localError.value = error instanceof Error ? error.message : '儲存失敗'
  }
}

async function handleToggle(item: ChecklistItem, completed: boolean) {
  if (!canEditContent.value || isSaving.value) {
    return
  }

  try {
    await toggleCompleted(item.id, completed)
  } catch {
    // 錯誤由 composable 處理
  }
}

async function confirmDelete() {
  if (!pendingDelete.value || isSaving.value) {
    return
  }

  try {
    await deleteItem(pendingDelete.value.id)
  } finally {
    pendingDelete.value = null
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">行李清單</h1>
        <p class="page-subtitle">
          新增項目、勾選完成與指派成員。
          <span v-if="!canEditContent">（唯讀）</span>
        </p>
      </div>
      <button
        v-if="canEditContent"
        type="button"
        class="create-btn"
        @click="openCreate"
      >
        新增項目
      </button>
    </div>

    <p v-if="localError || errorMessage" class="message-error" role="alert">
      {{ localError || errorMessage }}
    </p>
    <p v-if="successMessage" class="message-success" role="status">{{ successMessage }}</p>

    <LoadingState v-if="(isLoading || isTripLoading) && items.length === 0" />

    <div v-if="showForm" class="card form-card">
      <h2 class="form-title">
        {{ formMode === 'create' ? '新增行李項目' : '編輯行李項目' }}
      </h2>
      <ChecklistForm
        :mode="formMode"
        :initial-item="editingItem"
        :members="members"
        :submitting="isSaving"
        @submit="handleSubmit"
        @cancel="closeForm"
      />
    </div>

    <template v-else>
      <EmptyState
        v-if="!isLoading && items.length === 0"
        title="清單是空的"
        description="把充電器、證件、雨衣都先記下來吧。"
      >
        <button
          v-if="canEditContent"
          type="button"
          class="create-btn"
          @click="openCreate"
        >
          新增項目
        </button>
      </EmptyState>

      <template v-else>
        <div class="card">
          <h2 class="section-title">待辦（{{ pendingItems.length }}）</h2>
          <p v-if="pendingItems.length === 0" class="empty">目前沒有待辦項目。</p>
          <ChecklistItemCard
            v-for="item in pendingItems"
            :key="item.id"
            :item="item"
            :assignee-name="assigneeName(item.assigned_to)"
            :can-edit="canEditContent"
            :disabled="isSaving"
            @toggle="handleToggle(item, $event)"
            @edit="openEdit(item)"
            @remove="pendingDelete = item"
          />
        </div>

        <div v-if="completedItems.length > 0" class="card">
          <h2 class="section-title">已完成（{{ completedItems.length }}）</h2>
          <ChecklistItemCard
            v-for="item in completedItems"
            :key="item.id"
            :item="item"
            :assignee-name="assigneeName(item.assigned_to)"
            :can-edit="canEditContent"
            :disabled="isSaving"
            @toggle="handleToggle(item, $event)"
            @edit="openEdit(item)"
            @remove="pendingDelete = item"
          />
        </div>
      </template>
    </template>

    <ConfirmDialog
      :open="pendingDelete != null"
      title="刪除項目？"
      :message="pendingDelete ? `確定要刪除「${pendingDelete.content}」嗎？` : ''"
      confirm-label="確認刪除"
      danger
      :loading="isSaving"
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </section>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.create-btn {
  flex-shrink: 0;
  min-height: 44px;
  padding: 0.5rem 0.9rem;
  border: none;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.form-title,
.section-title {
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
}

.form-card {
  margin-bottom: 1rem;
}

.empty {
  margin: 0;
  font-size: 0.9rem;
}

.message-error {
  color: var(--color-danger);
}

.message-success {
  color: var(--color-primary);
}
</style>

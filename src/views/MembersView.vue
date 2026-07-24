<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useTrip } from '@/composables/useTrip'
import { usePermission } from '@/composables/usePermission'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import type { TripRole } from '@/types/trip'
import { TRIP_ROLE_LABELS } from '@/types/trip'

const route = useRoute()
const { user } = useAuth()
const {
  members,
  myRole,
  isLoading,
  isSaving,
  errorMessage,
  successMessage,
  fetchTripDetail,
  addMember,
  changeMemberRole,
  removeMember,
  clearMessages,
} = useTrip()

const { canManageMembers } = usePermission(myRole)

const tripId = computed(() => String(route.params.tripId))
const inviteEmail = ref('')
const inviteRole = ref<TripRole>('viewer')
const localError = ref<string | null>(null)
const memberPendingRemove = ref<string | null>(null)

watch(
  tripId,
  (id) => {
    void fetchTripDetail(id)
  },
  { immediate: true },
)

function validateEmail(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return '請輸入 Email'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Email 格式不正確'
  }
  return null
}

async function handleAddMember() {
  if (isSaving.value) {
    return
  }

  clearMessages()
  localError.value = validateEmail(inviteEmail.value)
  if (localError.value) {
    return
  }

  try {
    await addMember(tripId.value, inviteEmail.value, inviteRole.value)
    inviteEmail.value = ''
    inviteRole.value = 'viewer'
  } catch (error) {
    localError.value = error instanceof Error ? error.message : '新增成員失敗'
  }
}

async function handleRoleChange(memberId: string, role: string) {
  if (!canManageMembers.value || isSaving.value) {
    return
  }

  if (role !== 'owner' && role !== 'editor' && role !== 'viewer') {
    return
  }

  clearMessages()
  try {
    await changeMemberRole(tripId.value, memberId, role)
  } catch {
    // store 已處理錯誤訊息
  }
}

async function confirmRemove() {
  if (!memberPendingRemove.value || isSaving.value) {
    return
  }

  clearMessages()
  try {
    await removeMember(tripId.value, memberPendingRemove.value)
  } finally {
    memberPendingRemove.value = null
  }
}

function displayName(member: (typeof members.value)[number]): string {
  return member.profile?.display_name || `成員 ${member.user_id.slice(0, 6)}`
}
</script>

<template>
  <section class="page">
    <h1 class="page-title">旅行成員</h1>
    <p class="page-subtitle">owner 可新增成員、調整角色與移除成員。</p>

    <p v-if="localError || errorMessage" class="message-error" role="alert">
      {{ localError || errorMessage }}
    </p>
    <p v-if="successMessage" class="message-success" role="status">{{ successMessage }}</p>

    <LoadingState v-if="isLoading && members.length === 0" />

    <div v-if="canManageMembers" class="card">
      <h2 class="section-title">新增成員</h2>
      <p class="hint">對方必須已用該 Email 完成過 Magic Link 登入。</p>
      <form class="invite-form" @submit.prevent="handleAddMember">
        <label class="field">
          <span class="label">Email</span>
          <input
            v-model="inviteEmail"
            class="input"
            type="email"
            placeholder="friend@example.com"
            :disabled="isSaving"
          />
        </label>
        <label class="field">
          <span class="label">角色</span>
          <select v-model="inviteRole" class="input" :disabled="isSaving">
            <option value="viewer">唯讀</option>
            <option value="editor">編輯者</option>
            <option value="owner">擁有者</option>
          </select>
        </label>
        <button class="btn btn-primary" type="submit" :disabled="isSaving">
          {{ isSaving ? '處理中…' : '新增成員' }}
        </button>
      </form>
    </div>

    <ul class="member-list">
      <li v-for="member in members" :key="member.id" class="card member-card">
        <div class="member-main">
          <div class="avatar">
            <img
              v-if="member.profile?.avatar_url"
              :src="member.profile.avatar_url"
              alt=""
            />
            <span v-else>{{ displayName(member).slice(0, 1) }}</span>
          </div>
          <div>
            <p class="name">
              {{ displayName(member) }}
              <span v-if="member.user_id === user?.id" class="you">（你）</span>
            </p>
            <p class="role-text">{{ TRIP_ROLE_LABELS[member.role] }}</p>
          </div>
        </div>

        <div v-if="canManageMembers" class="member-actions">
          <select
            class="input role-select"
            :value="member.role"
            :disabled="isSaving || member.user_id === user?.id"
            @change="handleRoleChange(member.id, ($event.target as HTMLSelectElement).value)"
          >
            <option value="viewer">唯讀</option>
            <option value="editor">編輯者</option>
            <option value="owner">擁有者</option>
          </select>
          <button
            type="button"
            class="btn btn-danger-outline"
            :disabled="isSaving || member.user_id === user?.id"
            @click="memberPendingRemove = member.id"
          >
            移除
          </button>
        </div>
      </li>
    </ul>

    <ConfirmDialog
      :open="memberPendingRemove != null"
      title="移除成員？"
      message="確定要將此成員移出旅行嗎？"
      confirm-label="確認移除"
      danger
      :loading="isSaving"
      @cancel="memberPendingRemove = null"
      @confirm="confirmRemove"
    />
  </section>
</template>

<style scoped>
.section-title {
  font-size: 1.05rem;
  margin-bottom: 0.35rem;
}

.hint {
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.invite-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.label {
  font-size: 0.9rem;
  font-weight: 600;
}

.input {
  width: 100%;
  min-height: 44px;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font: inherit;
  background: #fff;
}

.member-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.member-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.member-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  margin: 0;
  font-weight: 600;
  color: var(--color-text);
}

.you {
  font-weight: 500;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.role-text {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
}

.member-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.role-select {
  flex: 1;
  min-width: 7rem;
}

.btn {
  min-height: 44px;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  border: none;
  font-weight: 600;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-danger-outline {
  background: #fff;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
}

.message-error {
  color: var(--color-danger);
}

.message-success {
  color: var(--color-primary);
}
</style>

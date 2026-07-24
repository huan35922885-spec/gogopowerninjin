<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useTrip } from '@/composables/useTrip'
import { usePermission } from '@/composables/usePermission'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import * as memberService from '@/services/memberService'
import type { AppUser, TripRole } from '@/types/trip'
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
const allUsers = ref<AppUser[]>([])
const selectedUserId = ref('')
const inviteRole = ref<TripRole>('viewer')
const localError = ref<string | null>(null)
const memberPendingRemove = ref<string | null>(null)
const isLoadingUsers = ref(false)

const memberUserIds = computed(() => new Set(members.value.map((m) => m.user_id)))

/** 尚未加入此旅行的使用者 */
const candidateUsers = computed(() =>
  allUsers.value.filter((u) => !memberUserIds.value.has(u.id)),
)

watch(
  tripId,
  async (id) => {
    await fetchTripDetail(id)
    if (canManageMembers.value) {
      await loadUsers()
    }
  },
  { immediate: true },
)

watch(canManageMembers, async (canManage) => {
  if (canManage && allUsers.value.length === 0) {
    await loadUsers()
  }
})

async function loadUsers() {
  isLoadingUsers.value = true
  try {
    allUsers.value = await memberService.listAppUsers()
  } catch (error) {
    localError.value =
      error instanceof Error ? error.message : '無法載入使用者列表'
  } finally {
    isLoadingUsers.value = false
  }
}

function userLabel(appUser: AppUser): string {
  if (appUser.email && appUser.display_name) {
    return `${appUser.display_name}（${appUser.email}）`
  }
  return appUser.email || appUser.display_name || appUser.id.slice(0, 8)
}

async function handleAddMember() {
  if (isSaving.value) {
    return
  }

  clearMessages()
  if (!selectedUserId.value) {
    localError.value = '請選擇要加入的使用者'
    return
  }

  localError.value = null

  try {
    await addMember(tripId.value, selectedUserId.value, inviteRole.value)
    selectedUserId.value = ''
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
    <p class="page-subtitle">owner 可從已註冊使用者中挑選成員。</p>

    <p v-if="localError || errorMessage" class="message-error" role="alert">
      {{ localError || errorMessage }}
    </p>
    <p v-if="successMessage" class="message-success" role="status">{{ successMessage }}</p>

    <LoadingState v-if="isLoading && members.length === 0" />

    <div v-if="canManageMembers" class="card">
      <h2 class="section-title">新增成員</h2>
      <p class="hint">從已註冊的朋友中選擇，不用手動輸入 Email。</p>

      <form class="invite-form" @submit.prevent="handleAddMember">
        <label class="field">
          <span class="label">選擇使用者</span>
          <select
            v-model="selectedUserId"
            class="input"
            :disabled="isSaving || isLoadingUsers"
          >
            <option value="">
              {{
                isLoadingUsers
                  ? '載入中…'
                  : candidateUsers.length === 0
                    ? '目前沒有可新增的人'
                    : '請選擇'
              }}
            </option>
            <option
              v-for="appUser in candidateUsers"
              :key="appUser.id"
              :value="appUser.id"
            >
              {{ userLabel(appUser) }}
            </option>
          </select>
        </label>
        <label class="field">
          <span class="label">角色</span>
          <select v-model="inviteRole" class="input" :disabled="isSaving">
            <option value="viewer">唯讀</option>
            <option value="editor">編輯者</option>
            <option value="owner">擁有者</option>
          </select>
        </label>
        <button
          class="btn btn-primary"
          type="submit"
          :disabled="isSaving || !selectedUserId"
        >
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
            class="btn-danger-outline"
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
  color: var(--color-purple-deep);
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
  font-weight: 700;
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
  background: var(--color-pink-soft);
  color: var(--color-pink-deep);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
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
  font-weight: 700;
  color: var(--color-text);
}

.you {
  font-weight: 600;
  color: var(--color-purple);
  font-size: 0.85rem;
}

.role-text {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
  color: var(--color-green-deep);
  font-weight: 700;
}

.member-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.role-select {
  width: 100%;
  min-width: 0;
}

@media (min-width: 480px) {
  .member-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .role-select {
    flex: 1;
    min-width: 7rem;
  }
}

.btn-danger-outline {
  min-height: 44px;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  background: #fff;
  border: 1.5px solid var(--color-danger);
  color: var(--color-danger);
  font-weight: 700;
}

.btn-danger-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

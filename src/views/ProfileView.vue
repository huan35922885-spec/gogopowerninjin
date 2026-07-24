<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'

const {
  user,
  profile,
  isLoading,
  isSavingProfile,
  errorMessage,
  successMessage,
  loadProfile,
  updateMyProfile,
  clearMessages,
} = useAuth()

const displayName = ref('')
const avatarUrl = ref('')
const avatarFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const localError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const currentAvatar = computed(() => {
  return previewUrl.value || avatarUrl.value || profile.value?.avatar_url || ''
})

function syncFromProfile() {
  displayName.value = profile.value?.display_name ?? ''
  avatarUrl.value = profile.value?.avatar_url ?? ''
  avatarFile.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

onMounted(async () => {
  clearMessages()
  if (!profile.value) {
    await loadProfile()
  }
  syncFromProfile()
})

watch(profile, () => {
  if (!avatarFile.value) {
    syncFromProfile()
  }
})

function onPickFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  localError.value = null

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }

  avatarFile.value = file
  if (file) {
    previewUrl.value = URL.createObjectURL(file)
  }
}

function clearAvatarFile() {
  avatarFile.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function removeAvatar() {
  clearAvatarFile()
  avatarUrl.value = ''
}

async function handleSubmit() {
  if (isSavingProfile.value) {
    return
  }

  clearMessages()
  localError.value = null

  if (!displayName.value.trim()) {
    localError.value = '請輸入顯示名稱'
    return
  }

  try {
    await updateMyProfile({
      display_name: displayName.value,
      avatar_url: avatarUrl.value || null,
      avatarFile: avatarFile.value,
    })
    clearAvatarFile()
  } catch (error) {
    localError.value = error instanceof Error ? error.message : '更新失敗'
  }
}
</script>

<template>
  <section class="page">
    <h1 class="page-title">個人資料</h1>
    <p class="page-subtitle">修改顯示名稱與頭貼，朋友在成員列表會看到這些資訊。</p>

    <div class="card profile-card">
      <div class="avatar-block">
        <div class="avatar-preview" aria-hidden="true">
          <img v-if="currentAvatar" :src="currentAvatar" alt="" />
          <span v-else>{{ (displayName || user?.email || '?').slice(0, 1) }}</span>
        </div>
        <div class="avatar-actions">
          <label class="btn btn-ghost file-btn">
            上傳頭貼
            <input
              ref="fileInputRef"
              class="file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              :disabled="isSavingProfile || isLoading"
              @change="onPickFile"
            />
          </label>
          <button
            v-if="currentAvatar"
            type="button"
            class="btn btn-secondary"
            :disabled="isSavingProfile"
            @click="removeAvatar"
          >
            移除頭貼
          </button>
        </div>
        <p class="hint">支援 JPG／PNG／WebP／GIF，最大 2MB。</p>
      </div>

      <form class="profile-form" @submit.prevent="handleSubmit">
        <label class="field">
          <span class="label">Email</span>
          <input class="input" type="email" :value="user?.email ?? ''" disabled />
        </label>

        <label class="field">
          <span class="label">顯示名稱 <em>*</em></span>
          <input
            v-model="displayName"
            class="input"
            type="text"
            maxlength="40"
            placeholder="例如：小明"
            :disabled="isSavingProfile"
          />
        </label>

        <label class="field">
          <span class="label">頭貼網址（選填）</span>
          <input
            v-model="avatarUrl"
            class="input"
            type="url"
            placeholder="https://..."
            :disabled="isSavingProfile || !!avatarFile"
          />
          <span class="hint">也可貼圖片網址；若有選擇上傳檔案會優先使用上傳。</span>
        </label>

        <p v-if="localError || errorMessage" class="message-error" role="alert">
          {{ localError || errorMessage }}
        </p>
        <p v-if="successMessage" class="message-success" role="status">
          {{ successMessage }}
        </p>

        <button class="btn btn-primary btn-block" type="submit" :disabled="isSavingProfile">
          {{ isSavingProfile ? '儲存中…' : '儲存變更' }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.profile-card {
  border-top: 3px solid var(--color-purple);
}

.avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.avatar-preview {
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-pink-soft), var(--color-purple-soft));
  color: var(--color-purple-deep);
  font-size: 2rem;
  font-weight: 800;
  border: 3px solid #fff;
  box-shadow: var(--shadow);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.file-btn {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.hint {
  margin: 0;
  font-size: 0.8rem;
  text-align: center;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.field .hint {
  text-align: left;
}
</style>

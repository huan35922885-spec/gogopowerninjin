<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTrip } from '@/composables/useTrip'
import TripForm from '@/components/trip/TripForm.vue'
import type { TripFormValues } from '@/types/trip'

const router = useRouter()
const { isSaving, errorMessage, successMessage, createTrip, clearMessages } = useTrip()
const localError = ref<string | null>(null)

async function handleSubmit(values: TripFormValues) {
  if (isSaving.value) {
    return
  }

  clearMessages()
  localError.value = null

  try {
    const trip = await createTrip({
      title: values.title,
      destination: values.destination || null,
      description: values.description || null,
      start_date: values.start_date,
      end_date: values.end_date,
      cover_image_url: values.cover_image_url || null,
    })
    await router.push(`/trips/${trip.id}`)
  } catch (error) {
    localError.value = error instanceof Error ? error.message : '建立旅行失敗'
  }
}
</script>

<template>
  <section class="page">
    <h1 class="page-title">建立旅行</h1>
    <p class="page-subtitle">填寫基本資訊，建立後你會成為 owner。</p>

    <div class="card create-card">
      <p v-if="localError || errorMessage" class="message-error" role="alert">
        {{ localError || errorMessage }}
      </p>
      <p v-if="successMessage" class="message-success" role="status">{{ successMessage }}</p>

      <TripForm mode="create" :submitting="isSaving" @submit="handleSubmit" />
    </div>
  </section>
</template>

<style scoped>
.create-card {
  border-top: 3px solid var(--color-pink);
}
</style>

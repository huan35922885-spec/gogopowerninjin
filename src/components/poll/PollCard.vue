<script setup lang="ts">
import { computed } from 'vue'
import type { Poll } from '@/types/poll'
import { POLL_STATUS_LABELS } from '@/types/poll'

const props = defineProps<{
  poll: Poll
  canManage: boolean
  canVote: boolean
  submitting?: boolean
}>()

const emit = defineEmits<{
  vote: [optionId: string]
  close: []
  remove: []
}>()

const isOpen = computed(() => props.poll.status === 'open')

const leadingOptionIds = computed(() => {
  if (props.poll.total_votes === 0) {
    return new Set<string>()
  }
  const max = Math.max(...props.poll.options.map((o) => o.vote_count))
  return new Set(
    props.poll.options.filter((o) => o.vote_count === max && max > 0).map((o) => o.id),
  )
})

function percent(count: number) {
  if (props.poll.total_votes === 0) {
    return 0
  }
  return Math.round((count / props.poll.total_votes) * 100)
}

function onVote(optionId: string) {
  if (!props.canVote || !isOpen.value || props.submitting) {
    return
  }
  if (props.poll.my_option_id === optionId) {
    return
  }
  emit('vote', optionId)
}
</script>

<template>
  <article class="poll-card card" :class="{ closed: !isOpen }">
    <header class="poll-head">
      <div class="poll-titles">
        <h3 class="poll-title">{{ poll.title }}</h3>
        <p v-if="poll.description" class="poll-desc">{{ poll.description }}</p>
      </div>
      <span class="chip" :class="isOpen ? 'chip-green' : 'chip-purple'">
        {{ POLL_STATUS_LABELS[poll.status] }}
      </span>
    </header>

    <p class="vote-meta">
      共 {{ poll.total_votes }} 票
      <template v-if="poll.my_option_id"> · 你已投票</template>
    </p>

    <ul class="options" role="list">
      <li v-for="option in poll.options" :key="option.id">
        <button
          type="button"
          class="option-btn"
          :class="{
            selected: poll.my_option_id === option.id,
            leading: leadingOptionIds.has(option.id),
            disabled: !canVote || !isOpen,
          }"
          :disabled="!canVote || !isOpen || submitting"
          @click="onVote(option.id)"
        >
          <span class="option-bar" :style="{ width: `${percent(option.vote_count)}%` }" />
          <span class="option-content">
            <span class="option-label">
              <span v-if="poll.my_option_id === option.id" class="my-mark" aria-hidden="true">✓</span>
              {{ option.label }}
            </span>
            <span class="option-count">{{ option.vote_count }}（{{ percent(option.vote_count) }}%）</span>
          </span>
        </button>
      </li>
    </ul>

    <footer v-if="canManage" class="poll-actions">
      <button
        v-if="isOpen"
        type="button"
        class="btn btn-ghost"
        :disabled="submitting"
        @click="emit('close')"
      >
        結束投票
      </button>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="submitting"
        @click="emit('remove')"
      >
        刪除
      </button>
    </footer>
  </article>
</template>

<style scoped>
.poll-card {
  border-top: 3px solid var(--color-pink);
}

.poll-card.closed {
  border-top-color: var(--color-purple);
  opacity: 0.95;
}

.poll-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.poll-titles {
  min-width: 0;
}

.poll-title {
  margin: 0;
  font-size: 1.05rem;
}

.poll-desc {
  margin: 0.35rem 0 0;
  font-size: 0.88rem;
}

.vote-meta {
  margin: 0 0 0.85rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.options {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-btn {
  position: relative;
  width: 100%;
  display: block;
  text-align: left;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
  padding: 0;
  overflow: hidden;
  font: inherit;
  min-height: 48px;
}

.option-btn:not(.disabled):hover {
  border-color: var(--color-purple);
}

.option-btn.selected {
  border-color: var(--color-pink);
  box-shadow: 0 0 0 2px var(--color-pink-soft);
}

.option-btn.leading:not(.selected) {
  border-color: var(--color-green);
}

.option-btn.disabled {
  cursor: default;
}

.option-bar {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--color-purple-soft);
  transition: width 0.25s ease;
  pointer-events: none;
}

.option-btn.selected .option-bar {
  background: var(--color-pink-soft);
}

.option-btn.leading .option-bar {
  background: var(--color-green-soft);
}

.option-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
}

.option-label {
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
}

.my-mark {
  color: var(--color-pink-deep);
  font-weight: 900;
}

.option-count {
  flex-shrink: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.poll-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.9rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--color-border);
}

.poll-actions .btn {
  min-height: 40px;
  font-size: 0.85rem;
}
</style>

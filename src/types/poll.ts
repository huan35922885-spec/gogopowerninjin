export const POLL_STATUSES = ['open', 'closed'] as const
export type PollStatus = (typeof POLL_STATUSES)[number]

export const POLL_STATUS_LABELS: Record<PollStatus, string> = {
  open: '進行中',
  closed: '已結束',
}

/** 建立投票時的選項來源 */
export type PollOptionSource = 'custom' | 'restaurant' | 'itinerary'

export interface PollOptionDraft {
  label: string
  restaurant_id?: string | null
  itinerary_item_id?: string | null
}

export interface PollFormValues {
  title: string
  description: string
  optionSource: PollOptionSource
  /** custom：文字／時間選項 */
  customOptions: string[]
  /** restaurant / itinerary：勾選的 id */
  selectedIds: string[]
}

export interface PollOption {
  id: string
  poll_id: string
  label: string
  restaurant_id: string | null
  itinerary_item_id: string | null
  sort_order: number
  created_at: string
  vote_count: number
}

export interface Poll {
  id: string
  trip_id: string
  title: string
  description: string | null
  status: PollStatus
  created_by: string
  closed_by: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  options: PollOption[]
  total_votes: number
  my_option_id: string | null
}

export interface CreatePollInput {
  trip_id: string
  title: string
  description?: string | null
  options: PollOptionDraft[]
}

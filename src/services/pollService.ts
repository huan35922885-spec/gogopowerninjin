import { supabase } from '@/lib/supabaseClient'
import { toReadableError } from '@/utils/errors'
import type { CreatePollInput, Poll, PollOption, PollStatus } from '@/types/poll'

type RawOption = {
  id: string
  poll_id: string
  label: string
  restaurant_id: string | null
  itinerary_item_id: string | null
  sort_order: number
  created_at: string
}

type RawVote = {
  option_id: string
  user_id: string
}

type RawPoll = {
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
  poll_options: RawOption[] | null
  poll_votes: RawVote[] | null
}

function mapPoll(row: RawPoll, currentUserId: string | null): Poll {
  const votes = row.poll_votes ?? []
  const optionsRaw = [...(row.poll_options ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
  )

  const countByOption = new Map<string, number>()
  for (const vote of votes) {
    countByOption.set(vote.option_id, (countByOption.get(vote.option_id) ?? 0) + 1)
  }

  const myVote = currentUserId
    ? votes.find((vote) => vote.user_id === currentUserId)
    : undefined

  const options: PollOption[] = optionsRaw.map((option) => ({
    id: option.id,
    poll_id: option.poll_id,
    label: option.label,
    restaurant_id: option.restaurant_id,
    itinerary_item_id: option.itinerary_item_id,
    sort_order: option.sort_order,
    created_at: option.created_at,
    vote_count: countByOption.get(option.id) ?? 0,
  }))

  return {
    id: row.id,
    trip_id: row.trip_id,
    title: row.title,
    description: row.description,
    status: row.status,
    created_by: row.created_by,
    closed_by: row.closed_by,
    closed_at: row.closed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    options,
    total_votes: votes.length,
    my_option_id: myVote?.option_id ?? null,
  }
}

/** 取得旅行的投票列表（含選項與票數） */
export async function listPolls(tripId: string, currentUserId: string | null): Promise<Poll[]> {
  const { data, error } = await supabase
    .from('polls')
    .select(
      `
      *,
      poll_options (*),
      poll_votes (option_id, user_id)
    `,
    )
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(toReadableError(error, '無法載入投票列表'))
  }

  return ((data ?? []) as RawPoll[]).map((row) => mapPoll(row, currentUserId))
}

/** 建立投票（含選項） */
export async function createPoll(input: CreatePollInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_poll', {
    p_trip_id: input.trip_id,
    p_title: input.title.trim(),
    p_description: input.description?.trim() || null,
    p_options: input.options.map((option) => ({
      label: option.label.trim(),
      restaurant_id: option.restaurant_id ?? null,
      itinerary_item_id: option.itinerary_item_id ?? null,
    })),
  })

  if (error) {
    throw new Error(toReadableError(error, '建立投票失敗。請確認已執行 010_polls.sql'))
  }

  return data as string
}

/** 投下或改投 */
export async function castVote(pollId: string, optionId: string): Promise<void> {
  const { error } = await supabase.rpc('cast_poll_vote', {
    p_poll_id: pollId,
    p_option_id: optionId,
  })

  if (error) {
    throw new Error(toReadableError(error, '投票失敗'))
  }
}

/** 結束投票 */
export async function closePoll(pollId: string): Promise<void> {
  const { error } = await supabase.rpc('close_poll', {
    p_poll_id: pollId,
  })

  if (error) {
    throw new Error(toReadableError(error, '結束投票失敗'))
  }
}

/** 刪除投票 */
export async function deletePoll(pollId: string): Promise<void> {
  const { error } = await supabase.from('polls').delete().eq('id', pollId)

  if (error) {
    throw new Error(toReadableError(error, '刪除投票失敗'))
  }
}

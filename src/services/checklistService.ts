import { supabase } from '@/lib/supabaseClient'
import { toReadableError } from '@/utils/errors'
import type {
  ChecklistItem,
  CreateChecklistInput,
  UpdateChecklistInput,
} from '@/types/checklist'

/** 取得旅行的行李清單 */
export async function listChecklistItems(tripId: string): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('is_completed', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(toReadableError(error, '無法載入行李清單'))
  }

  return (data ?? []) as ChecklistItem[]
}

/** 新增行李項目 */
export async function createChecklistItem(
  input: CreateChecklistInput,
): Promise<ChecklistItem> {
  const { data, error } = await supabase
    .from('checklist_items')
    .insert({
      trip_id: input.trip_id,
      content: input.content.trim(),
      assigned_to: input.assigned_to || null,
      created_by: input.created_by,
      is_completed: false,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(toReadableError(error, '新增行李項目失敗'))
  }

  return data as ChecklistItem
}

/** 更新行李項目（內容／指派／完成狀態） */
export async function updateChecklistItem(
  itemId: string,
  input: UpdateChecklistInput,
): Promise<ChecklistItem> {
  const payload: Record<string, unknown> = {}

  if (input.content !== undefined) {
    payload.content = input.content.trim()
  }
  if (input.assigned_to !== undefined) {
    payload.assigned_to = input.assigned_to || null
  }
  if (input.is_completed !== undefined) {
    payload.is_completed = input.is_completed
  }

  const { data, error } = await supabase
    .from('checklist_items')
    .update(payload)
    .eq('id', itemId)
    .select('*')
    .single()

  if (error) {
    throw new Error(toReadableError(error, '更新行李項目失敗'))
  }

  return data as ChecklistItem
}

/** 刪除行李項目 */
export async function deleteChecklistItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('checklist_items').delete().eq('id', itemId)

  if (error) {
    throw new Error(toReadableError(error, '刪除行李項目失敗'))
  }
}

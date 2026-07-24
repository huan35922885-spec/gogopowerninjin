export interface ChecklistItem {
  id: string
  trip_id: string
  content: string
  is_completed: boolean
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ChecklistFormValues {
  content: string
  assigned_to: string
}

export interface CreateChecklistInput {
  trip_id: string
  content: string
  assigned_to?: string | null
  created_by: string
}

export interface UpdateChecklistInput {
  content?: string
  assigned_to?: string | null
  is_completed?: boolean
}

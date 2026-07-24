import type { ChecklistFormValues } from '@/types/checklist'

export interface ChecklistValidationResult {
  ok: boolean
  errors: Partial<Record<keyof ChecklistFormValues, string>>
}

export function validateChecklistForm(
  values: ChecklistFormValues,
): ChecklistValidationResult {
  const errors: ChecklistValidationResult['errors'] = {}

  if (!values.content.trim()) {
    errors.content = '請輸入項目名稱'
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  }
}

import { type FormField, type FormConfig } from './form-builder-types'

const API_BASE = process.env.NEXT_PUBLIC_FORM99_API_URL || 'http://localhost:8000'

export const DEFAULT_ACCOUNT_ID = '0'
export const DEFAULT_SERVER_ID = ''

export interface FormSummary {
  id: string
  account_id: string
  server_id: string
  name: string
  title: string
  updated_at: string
}

export interface FormResponse {
  id: string
  account_id: string
  server_id: string
  name: string
  title: string
  description: string | null
  submit_button_text: string
  direction: 'ltr' | 'rtl'
  fields: FormField[]
  created_at: string
  updated_at: string
}

export interface FormCreatePayload {
  account_id: string
  server_id: string
  name: string
  title: string
  description: string | null
  submit_button_text: string
  direction: 'ltr' | 'rtl'
  fields: FormField[]
}

export interface FormUpdatePayload {
  name?: string
  title?: string
  description?: string | null
  submit_button_text?: string
  direction?: 'ltr' | 'rtl'
  fields?: FormField[]
}

export function formConfigToPayload(config: FormConfig, accountId: string): FormCreatePayload {
  return {
    account_id: accountId,
    server_id: config.serverId,
    name: config.name,
    title: config.title,
    description: config.description ?? null,
    submit_button_text: config.submitButtonText,
    direction: config.direction,
    fields: config.fields,
  }
}

export async function getForms(accountId: string, serverId: string = DEFAULT_SERVER_ID): Promise<FormSummary[]> {
  const params = new URLSearchParams({ server_id: serverId })
  const res = await fetch(`${API_BASE}/api/accounts/${accountId}/forms?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch forms: ${res.status}`)
  return res.json() as Promise<FormSummary[]>
}

export async function getForm(formId: string): Promise<FormResponse> {
  const res = await fetch(`${API_BASE}/api/forms/${formId}`)
  if (!res.ok) throw new Error(`Failed to fetch form: ${res.status}`)
  return res.json() as Promise<FormResponse>
}

export async function createForm(payload: FormCreatePayload): Promise<FormResponse> {
  const res = await fetch(`${API_BASE}/api/forms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string }
    throw new Error(err.detail ?? `Failed to create form: ${res.status}`)
  }
  return res.json() as Promise<FormResponse>
}

export async function updateForm(formId: string, payload: FormUpdatePayload): Promise<FormResponse> {
  const res = await fetch(`${API_BASE}/api/forms/${formId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string }
    throw new Error(err.detail ?? `Failed to update form: ${res.status}`)
  }
  return res.json() as Promise<FormResponse>
}

export async function deleteForm(formId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/forms/${formId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete form: ${res.status}`)
}

export async function duplicateForm(formId: string): Promise<FormResponse> {
  const res = await fetch(`${API_BASE}/api/forms/${formId}/duplicate`, { method: 'POST' })
  if (!res.ok) throw new Error(`Failed to duplicate form: ${res.status}`)
  return res.json() as Promise<FormResponse>
}

export async function checkFormNameUnique(
  serverId: string,
  accountId: string,
  name: string,
  excludeId?: string,
): Promise<boolean> {
  const params = new URLSearchParams({ server_id: serverId, account_id: accountId, name })
  if (excludeId) params.set('exclude_id', excludeId)
  const res = await fetch(`${API_BASE}/api/form-name-check?${params}`)
  if (!res.ok) return true
  const data = await res.json() as { available: boolean }
  return data.available
}

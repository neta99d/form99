'use client'

import { use } from 'react'
import { FormBuilder } from '@/components/form-builder'
import { DEFAULT_ACCOUNT_ID, DEFAULT_SERVER_ID } from '@/lib/forms-api'

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <FormBuilder mode="edit" formId={id} accountId={DEFAULT_ACCOUNT_ID} serverId={DEFAULT_SERVER_ID} />
}

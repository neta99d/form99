import { FormBuilder } from '@/components/form-builder'
import { DEFAULT_ACCOUNT_ID } from '@/lib/forms-api'

export default function NewFormPage() {
  return <FormBuilder mode="create" accountId={DEFAULT_ACCOUNT_ID} />
}

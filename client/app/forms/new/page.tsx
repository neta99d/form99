import { FormBuilder } from '@/components/form-builder'
import { DEFAULT_ACCOUNT_ID, DEFAULT_SERVER_ID } from '@/lib/forms-api'

export default function NewFormPage() {
  return <FormBuilder mode="create" accountId={DEFAULT_ACCOUNT_ID} serverId={DEFAULT_SERVER_ID} />
}

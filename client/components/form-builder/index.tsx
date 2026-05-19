'use client'

import { FormBuilderProvider, useFormBuilder } from '@/lib/form-builder-store'
import { BuilderHeader } from './builder-header'
import { FieldLibrary } from './field-library'
import { FormCanvas } from './form-canvas'
import { FieldSettings } from './field-settings'
import { OnboardingScreen } from './onboarding-screen'

function FormBuilderContent() {
  const { previewMode, isOnboarded, mode } = useFormBuilder()

  if (!isOnboarded && !mode) {
    return <OnboardingScreen />
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <BuilderHeader />
      <div className="flex-1 flex overflow-hidden">
        {!previewMode && <FieldSettings />}
        <FormCanvas />
        {!previewMode && <FieldLibrary />}
      </div>
    </div>
  )
}

export interface FormBuilderProps {
  mode?: 'create' | 'edit'
  formId?: string
  accountId?: string
}

export function FormBuilder({ mode, formId, accountId }: FormBuilderProps = {}) {
  return (
    <FormBuilderProvider mode={mode} formId={formId} initialAccountId={accountId}>
      <FormBuilderContent />
    </FormBuilderProvider>
  )
}

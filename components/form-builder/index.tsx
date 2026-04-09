'use client'

import { FormBuilderProvider, useFormBuilder } from '@/lib/form-builder-store'
import { BuilderHeader } from './builder-header'
import { FieldLibrary } from './field-library'
import { FormCanvas } from './form-canvas'
import { FieldSettings } from './field-settings'
import { OnboardingScreen } from './onboarding-screen'

function FormBuilderContent() {
  const { previewMode, isOnboarded } = useFormBuilder()

  if (!isOnboarded) {
    return <OnboardingScreen />
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <BuilderHeader />
      <div className="flex-1 flex overflow-hidden">
        {!previewMode && <FieldLibrary />}
        <FormCanvas />
        {!previewMode && <FieldSettings />}
      </div>
    </div>
  )
}

export function FormBuilder() {
  return (
    <FormBuilderProvider>
      <FormBuilderContent />
    </FormBuilderProvider>
  )
}

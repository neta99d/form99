'use client'

import { FormBuilderProvider, useFormBuilder } from '@/lib/form-builder-store'
import { BuilderHeader } from './builder-header'
import { FieldLibrary } from './field-library'
import { FormCanvas } from './form-canvas'
import { FieldSettings } from './field-settings'
import { ThemeSettings } from './theme-settings'

export interface FormBuilderProps {
  mode: 'create' | 'edit'
  formId?: string
  accountId: string
  serverId?: string
}

function FormBuilderContent() {
  const { previewMode, themeOpen } = useFormBuilder()

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <BuilderHeader />
      <div className="flex-1 flex overflow-hidden">
        {!previewMode && (themeOpen ? <ThemeSettings /> : <FieldSettings />)}
        <FormCanvas />
        {!previewMode && <FieldLibrary />}
      </div>
    </div>
  )
}

export function FormBuilder({ mode, formId, accountId, serverId }: FormBuilderProps) {
  return (
    <FormBuilderProvider mode={mode} formId={formId} accountId={accountId} serverId={serverId}>
      <FormBuilderContent />
    </FormBuilderProvider>
  )
}

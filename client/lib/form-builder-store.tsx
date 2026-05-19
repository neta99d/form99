'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { type FormField, type FormConfig, createField, generateFieldId, type FieldType, sanitizeFieldVisibilityRules } from './form-builder-types'
import { getForm } from './forms-api'

interface FormBuilderState {
  formConfig: FormConfig
  selectedFieldId: string | null
  previewMode: boolean
  previewDevice: 'desktop' | 'mobile'
  accountId: string
  mode: 'create' | 'edit'
  formId?: string
}

interface FormBuilderActions {
  addField: (type: FieldType) => void
  removeField: (id: string) => void
  updateField: (id: string, updates: Partial<FormField>) => void
  renameFieldId: (oldId: string, newId: string) => void
  moveField: (fromIndex: number, toIndex: number) => void
  selectField: (id: string | null) => void
  updateFormConfig: (updates: Partial<Pick<FormConfig, 'title' | 'description' | 'submitButtonText' | 'direction'>>) => void
  setPreviewMode: (enabled: boolean) => void
  setPreviewDevice: (device: 'desktop' | 'mobile') => void
  duplicateField: (id: string) => void
}

type FormBuilderContextType = FormBuilderState & FormBuilderActions

const FormBuilderContext = createContext<FormBuilderContextType | null>(null)

export const API_BASE_URL = process.env.NEXT_PUBLIC_FORM99_API_URL || 'http://localhost:8000'

const blankFormConfig: FormConfig = {
  id: '',
  title: 'טופס חדש',
  description: undefined,
  fields: [],
  submitButtonText: 'שליחה',
  direction: 'rtl',
}

interface FormBuilderProviderProps {
  children: ReactNode
  mode: 'create' | 'edit'
  formId?: string
  accountId: string
}

export function FormBuilderProvider({ children, mode, formId, accountId }: FormBuilderProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [formConfig, setFormConfig] = useState<FormConfig>(blankFormConfig)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [previewMode, setPreviewModeState] = useState(false)
  const [previewDevice, setPreviewDeviceState] = useState<'desktop' | 'mobile'>('desktop')

  useEffect(() => {
    if (mode === 'edit' && formId) {
      getForm(formId)
        .then(form => {
          setFormConfig({
            id: form.id,
            title: form.title,
            description: form.description ?? undefined,
            fields: sanitizeFieldVisibilityRules(form.fields),
            submitButtonText: form.submit_button_text,
            direction: form.direction,
          })
        })
        .catch(() => {
          // Form not found — proceed with blank config
        })
        .finally(() => setIsHydrated(true))
    } else {
      setIsHydrated(true)
    }
  }, [mode, formId])

  const addField = useCallback((type: FieldType) => {
    let newFieldId = ''
    setFormConfig(prev => {
      const newField = createField(type, prev.fields)
      newFieldId = newField.id
      return { ...prev, fields: [...prev.fields, newField] }
    })
    setSelectedFieldId(newFieldId)
  }, [])

  const removeField = useCallback((id: string) => {
    setFormConfig(prev => ({
      ...prev,
      fields: sanitizeFieldVisibilityRules(prev.fields.filter(f => f.id !== id)),
    }))
    setSelectedFieldId(prev => (prev === id ? null : prev))
  }, [])

  const updateField = useCallback((id: string, updates: Partial<FormField>) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.map(f => (f.id === id ? { ...f, ...updates } : f)),
    }))
  }, [])

  const renameFieldId = useCallback((oldId: string, newId: string) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.map(f => {
        if (f.id === oldId) return { ...f, id: newId }
        if (!f.visibleWhen) return f
        if ('conditions' in f.visibleWhen) {
          return {
            ...f,
            visibleWhen: {
              conditions: f.visibleWhen.conditions.map(c =>
                c.sourceFieldId === oldId ? { ...c, sourceFieldId: newId } : c
              ),
            },
          }
        }
        if (f.visibleWhen.sourceFieldId === oldId) {
          return { ...f, visibleWhen: { ...f.visibleWhen, sourceFieldId: newId } }
        }
        return f
      }),
    }))
    setSelectedFieldId(prev => (prev === oldId ? newId : prev))
  }, [])

  const moveField = useCallback((fromIndex: number, toIndex: number) => {
    setFormConfig(prev => {
      const fields = [...prev.fields]
      const [moved] = fields.splice(fromIndex, 1)
      fields.splice(toIndex, 0, moved)
      return { ...prev, fields: sanitizeFieldVisibilityRules(fields) }
    })
  }, [])

  const selectField = useCallback((id: string | null) => setSelectedFieldId(id), [])

  const updateFormConfig = useCallback(
    (updates: Partial<Pick<FormConfig, 'title' | 'description' | 'submitButtonText' | 'direction'>>) => {
      setFormConfig(prev => ({ ...prev, ...updates }))
    },
    []
  )

  const setPreviewMode = useCallback((enabled: boolean) => {
    setPreviewModeState(enabled)
    if (enabled) setSelectedFieldId(null)
  }, [])

  const setPreviewDevice = useCallback((device: 'desktop' | 'mobile') => {
    setPreviewDeviceState(device)
  }, [])

  const duplicateField = useCallback((id: string) => {
    setFormConfig(prev => {
      const idx = prev.fields.findIndex(f => f.id === id)
      if (idx === -1) return prev
      const field = prev.fields[idx]
      const copy: FormField = {
        ...field,
        id: generateFieldId(field.type, prev.fields),
        label: `${field.label} (עותק)`,
        options: field.options?.map(o => ({
          ...o,
          id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        })),
      }
      const fields = [...prev.fields]
      fields.splice(idx + 1, 0, copy)
      return { ...prev, fields: sanitizeFieldVisibilityRules(fields) }
    })
  }, [])

  if (!isHydrated) return null

  return (
    <FormBuilderContext.Provider
      value={{
        formConfig,
        selectedFieldId,
        previewMode,
        previewDevice,
        accountId,
        mode,
        formId,
        addField,
        removeField,
        updateField,
        renameFieldId,
        moveField,
        selectField,
        updateFormConfig,
        setPreviewMode,
        setPreviewDevice,
        duplicateField,
      }}
    >
      {children}
    </FormBuilderContext.Provider>
  )
}

export function useFormBuilder() {
  const context = useContext(FormBuilderContext)
  if (!context) throw new Error('useFormBuilder must be used within a FormBuilderProvider')
  return context
}

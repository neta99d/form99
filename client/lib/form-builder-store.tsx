'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { type FormField, type FormConfig, type FormTheme, DEFAULT_THEME, createField, generateFieldId, type FieldType, sanitizeFieldVisibilityRules, normalizeLayoutRows } from './form-builder-types'
import { getForm, DEFAULT_SERVER_ID } from './forms-api'

interface FormBuilderState {
  formConfig: FormConfig
  selectedFieldId: string | null
  previewMode: boolean
  previewDevice: 'desktop' | 'mobile'
  themeOpen: boolean
  accountId: string
  serverId: string
  mode: 'create' | 'edit'
  formId?: string
}

interface FormBuilderActions {
  addField: (type: FieldType) => void
  addFieldAt: (type: FieldType, index: number, layout?: FormField['layout']) => void
  removeField: (id: string) => void
  updateField: (id: string, updates: Partial<FormField>) => void
  renameFieldId: (oldId: string, newId: string) => void
  moveField: (fromIndex: number, toIndex: number) => void
  moveFieldWithLayoutUpdates: (
    fromIndex: number,
    toIndex: number,
    layoutUpdates: Record<string, FormField['layout']>
  ) => void
  selectField: (id: string | null) => void
  updateFormConfig: (updates: Partial<Pick<FormConfig, 'name' | 'title' | 'description' | 'submitButtonText' | 'direction'>>) => void
  updateTheme: (theme: FormTheme) => void
  setPreviewMode: (enabled: boolean) => void
  setPreviewDevice: (device: 'desktop' | 'mobile') => void
  setThemeOpen: (open: boolean) => void
  duplicateField: (id: string) => void
}

type FormBuilderContextType = FormBuilderState & FormBuilderActions

const FormBuilderContext = createContext<FormBuilderContextType | null>(null)

export const API_BASE_URL = process.env.NEXT_PUBLIC_FORM99_API_URL || 'http://localhost:8000'

const blankFormConfig: FormConfig = {
  id: '',
  name: '',
  serverId: DEFAULT_SERVER_ID,
  title: 'טופס חדש',
  description: undefined,
  fields: [],
  submitButtonText: 'שליחה',
  direction: 'rtl',
  theme: DEFAULT_THEME,
}

interface FormBuilderProviderProps {
  children: ReactNode
  mode: 'create' | 'edit'
  formId?: string
  accountId: string
  serverId?: string
}

export function FormBuilderProvider({ children, mode, formId, accountId, serverId = DEFAULT_SERVER_ID }: FormBuilderProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [formConfig, setFormConfig] = useState<FormConfig>({ ...blankFormConfig, serverId })
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [previewMode, setPreviewModeState] = useState(false)
  const [previewDevice, setPreviewDeviceState] = useState<'desktop' | 'mobile'>('desktop')
  const [themeOpen, setThemeOpenState] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && formId) {
      getForm(formId)
        .then(form => {
          setFormConfig({
            id: form.id,
            name: form.name ?? '',
            serverId: form.server_id ?? '',
            title: form.title,
            description: form.description ?? undefined,
            fields: normalizeLayoutRows(sanitizeFieldVisibilityRules(form.fields)),
            submitButtonText: form.submit_button_text,
            direction: form.direction,
            theme: form.theme ? { ...DEFAULT_THEME, ...form.theme } as FormTheme : DEFAULT_THEME,
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
    const newField = createField(type, formConfig.fields)
    setFormConfig(prev => {
      return { ...prev, fields: normalizeLayoutRows([...prev.fields, newField]) }
    })
    setSelectedFieldId(newField.id)
  }, [formConfig.fields])

  const addFieldAt = useCallback((type: FieldType, index: number, layout?: FormField['layout']) => {
    const newField = {
      ...createField(type, formConfig.fields),
      layout: layout ?? { row: 0, column: 'full' as const },
    }
    setFormConfig(prev => {
      const fields = [...prev.fields]
      const insertIndex = Math.max(0, Math.min(index, fields.length))
      fields.splice(insertIndex, 0, newField)
      return { ...prev, fields: normalizeLayoutRows(sanitizeFieldVisibilityRules(fields)) }
    })
    setSelectedFieldId(newField.id)
  }, [formConfig.fields])

  const removeField = useCallback((id: string) => {
    setFormConfig(prev => ({
      ...prev,
      fields: sanitizeFieldVisibilityRules(prev.fields.filter(f => f.id !== id)),
    }))
    setSelectedFieldId(prev => (prev === id ? null : prev))
  }, [])

  const updateField = useCallback((id: string, updates: Partial<FormField>) => {
    setFormConfig(prev => {
      const updated = prev.fields.map(f => (f.id === id ? { ...f, ...updates } : f))
      return { ...prev, fields: 'layout' in updates ? normalizeLayoutRows(updated) : updated }
    })
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
      return { ...prev, fields: normalizeLayoutRows(sanitizeFieldVisibilityRules(fields)) }
    })
  }, [])

  const moveFieldWithLayoutUpdates = useCallback((
    fromIndex: number,
    toIndex: number,
    layoutUpdates: Record<string, FormField['layout']>
  ) => {
    setFormConfig(prev => {
      const fields = [...prev.fields]
      const [moved] = fields.splice(fromIndex, 1)
      fields.splice(toIndex, 0, moved)
      const updated = fields.map(field =>
        layoutUpdates[field.id] ? { ...field, layout: layoutUpdates[field.id] } : field
      )
      return { ...prev, fields: normalizeLayoutRows(sanitizeFieldVisibilityRules(updated)) }
    })
  }, [])

  const selectField = useCallback((id: string | null) => setSelectedFieldId(id), [])

  const updateFormConfig = useCallback(
    (updates: Partial<Pick<FormConfig, 'name' | 'title' | 'description' | 'submitButtonText' | 'direction'>>) => {
      setFormConfig(prev => ({ ...prev, ...updates }))
    },
    []
  )

  const updateTheme = useCallback((theme: FormTheme) => {
    setFormConfig(prev => ({ ...prev, theme }))
  }, [])

  const setThemeOpen = useCallback((open: boolean) => {
    setThemeOpenState(open)
  }, [])

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
        layout: { row: 0, column: 'full' },
        options: field.options?.map(o => ({
          ...o,
          id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        })),
      }
      const fields = [...prev.fields]
      fields.splice(idx + 1, 0, copy)
      return { ...prev, fields: normalizeLayoutRows(sanitizeFieldVisibilityRules(fields)) }
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
        themeOpen,
        accountId,
        serverId: formConfig.serverId,
        mode,
        formId,
        addField,
        addFieldAt,
        removeField,
        updateField,
        renameFieldId,
        moveField,
        moveFieldWithLayoutUpdates,
        selectField,
        updateFormConfig,
        updateTheme,
        setPreviewMode,
        setPreviewDevice,
        setThemeOpen,
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

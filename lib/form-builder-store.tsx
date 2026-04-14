'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { type FormField, type FormConfig, createField, type FieldType, type FormDirection, type UserInfo, sanitizeFieldVisibilityRules } from './form-builder-types'

interface FormBuilderState {
  formConfig: FormConfig
  selectedFieldId: string | null
  previewMode: boolean
  previewDevice: 'desktop' | 'mobile'
  userInfo: UserInfo | null
  isOnboarded: boolean
}

interface FormBuilderActions {
  addField: (type: FieldType) => void
  removeField: (id: string) => void
  updateField: (id: string, updates: Partial<FormField>) => void
  moveField: (fromIndex: number, toIndex: number) => void
  selectField: (id: string | null) => void
  updateFormConfig: (updates: Partial<Pick<FormConfig, 'title' | 'description' | 'submitButtonText' | 'direction'>>) => void
  setPreviewMode: (enabled: boolean) => void
  setPreviewDevice: (device: 'desktop' | 'mobile') => void
  duplicateField: (id: string) => void
  setUserInfo: (info: UserInfo) => void
  resetBuilder: () => void
}

type FormBuilderContextType = FormBuilderState & FormBuilderActions

const FormBuilderContext = createContext<FormBuilderContextType | null>(null)

const STORAGE_KEY = 'form-builder-state'

interface PersistedState {
  formConfig: FormConfig
  userInfo: UserInfo | null
  isOnboarded: boolean
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved) as PersistedState
    }
  } catch {
    // Invalid JSON, ignore
  }
  return null
}

function saveState(state: PersistedState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable, ignore
  }
}

function clearPersistedState() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable, ignore
  }
}

const initialFormConfig: FormConfig = {
  id: 'form_1',
  title: 'טופס יצירת קשר',
  description: 'מלאו את הפרטים בטופס ונחזור אליכם בהקדם.',
  fields: [],
  submitButtonText: 'שליחה',
  direction: 'rtl',
}

export function FormBuilderProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [formConfig, setFormConfig] = useState<FormConfig>(initialFormConfig)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [previewMode, setPreviewModeState] = useState(false)
  const [previewDevice, setPreviewDeviceState] = useState<'desktop' | 'mobile'>('desktop')
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null)
  const [isOnboarded, setIsOnboarded] = useState(false)
  
  // Load persisted state on mount
  useEffect(() => {
    const persisted = loadPersistedState()
    if (persisted) {
      setFormConfig({
        ...persisted.formConfig,
        fields: sanitizeFieldVisibilityRules(persisted.formConfig.fields),
      })
      setUserInfoState(persisted.userInfo)
      setIsOnboarded(persisted.isOnboarded)
    }
    setIsHydrated(true)
  }, [])
  
  // Auto-save state on changes (debounced)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (!isHydrated) return
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveState({
        formConfig,
        userInfo,
        isOnboarded,
      })
    }, 300)
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [formConfig, userInfo, isOnboarded, isHydrated])

  const addField = useCallback((type: FieldType) => {
    const newField = createField(type)
    setFormConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }))
    setSelectedFieldId(newField.id)
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

  const moveField = useCallback((fromIndex: number, toIndex: number) => {
    setFormConfig(prev => {
      const newFields = [...prev.fields]
      const [movedField] = newFields.splice(fromIndex, 1)
      newFields.splice(toIndex, 0, movedField)
      return { ...prev, fields: sanitizeFieldVisibilityRules(newFields) }
    })
  }, [])

  const selectField = useCallback((id: string | null) => {
    setSelectedFieldId(id)
  }, [])

  const updateFormConfig = useCallback(
    (updates: Partial<Pick<FormConfig, 'title' | 'description' | 'submitButtonText' | 'direction'>>) => {
      setFormConfig(prev => ({ ...prev, ...updates }))
    },
    []
  )

  const setUserInfo = useCallback((info: UserInfo) => {
    setUserInfoState(info)
    setIsOnboarded(true)
  }, [])

  const resetBuilder = useCallback(() => {
    clearPersistedState()
    setFormConfig(initialFormConfig)
    setSelectedFieldId(null)
    setPreviewModeState(false)
    setPreviewDeviceState('desktop')
    setUserInfoState(null)
    setIsOnboarded(false)
  }, [])

  const setPreviewMode = useCallback((enabled: boolean) => {
    setPreviewModeState(enabled)
    if (enabled) {
      setSelectedFieldId(null)
    }
  }, [])

  const setPreviewDevice = useCallback((device: 'desktop' | 'mobile') => {
    setPreviewDeviceState(device)
  }, [])

  const duplicateField = useCallback((id: string) => {
    setFormConfig(prev => {
      const fieldIndex = prev.fields.findIndex(f => f.id === id)
      if (fieldIndex === -1) return prev
      const field = prev.fields[fieldIndex]
      const newField: FormField = {
        ...field,
        id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        label: `${field.label} (עותק)`,
        options: field.options?.map(o => ({
          ...o,
          id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        })),
      }
      const newFields = [...prev.fields]
      newFields.splice(fieldIndex + 1, 0, newField)
      return { ...prev, fields: sanitizeFieldVisibilityRules(newFields) }
    })
  }, [])

  const value: FormBuilderContextType = {
    formConfig,
    selectedFieldId,
    previewMode,
    previewDevice,
    userInfo,
    isOnboarded,
    addField,
    removeField,
    updateField,
    moveField,
    selectField,
    updateFormConfig,
    setPreviewMode,
    setPreviewDevice,
    duplicateField,
    setUserInfo,
    resetBuilder,
  }

  // Show nothing until hydrated to prevent flash
  if (!isHydrated) {
    return null
  }

  return <FormBuilderContext.Provider value={value}>{children}</FormBuilderContext.Provider>
}

export function useFormBuilder() {
  const context = useContext(FormBuilderContext)
  if (!context) {
    throw new Error('useFormBuilder must be used within a FormBuilderProvider')
  }
  return context
}

'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { type FormField, type FormConfig, createField, type FieldType, type UserInfo, sanitizeFieldVisibilityRules } from './form-builder-types'
import { getForm } from './forms-api'

interface FormBuilderState {
  formConfig: FormConfig
  selectedFieldId: string | null
  previewMode: boolean
  previewDevice: 'desktop' | 'mobile'
  userInfo: UserInfo | null
  isOnboarded: boolean
  accountId: string
  mode?: 'create' | 'edit'
  formId?: string
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
  accountId: string
}

type FormBuilderContextType = FormBuilderState & FormBuilderActions

const FormBuilderContext = createContext<FormBuilderContextType | null>(null)

const STORAGE_KEY = 'form-builder-state'
export const API_BASE_URL = process.env.NEXT_PUBLIC_FORM99_API_URL || 'http://localhost:8000'

function getOrCreateAccountId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'form-builder-account-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

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

async function loadServerState(): Promise<PersistedState | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/state`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as PersistedState | null
  } catch {
    return null
  }
}

async function saveServerState(state: PersistedState) {
  try {
    await fetch(`${API_BASE_URL}/state`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state),
    })
  } catch {
    // Backend unavailable, localStorage remains the fallback.
  }
}

async function clearServerState() {
  try {
    await fetch(`${API_BASE_URL}/state`, {
      method: 'DELETE',
    })
  } catch {
    // Backend unavailable, localStorage remains the fallback.
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

interface FormBuilderProviderProps {
  children: ReactNode
  mode?: 'create' | 'edit'
  formId?: string
  initialAccountId?: string
}

export function FormBuilderProvider({ children, mode, formId, initialAccountId }: FormBuilderProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [accountId] = useState(() => initialAccountId ?? getOrCreateAccountId())
  const [formConfig, setFormConfig] = useState<FormConfig>(initialFormConfig)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [previewMode, setPreviewModeState] = useState(false)
  const [previewDevice, setPreviewDeviceState] = useState<'desktop' | 'mobile'>('desktop')
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null)
  const [isOnboarded, setIsOnboarded] = useState(false)

  // Load state on mount — behavior depends on mode
  useEffect(() => {
    let isCancelled = false

    const loadInitialState = async () => {
      if (mode === 'create') {
        // Fresh form, skip loading
        setIsOnboarded(true)
        setIsHydrated(true)
        return
      }

      if (mode === 'edit' && formId) {
        // Load form from the forms API
        try {
          const form = await getForm(formId)
          if (isCancelled) return
          setFormConfig({
            id: form.id,
            title: form.title,
            description: form.description ?? undefined,
            fields: sanitizeFieldVisibilityRules(form.fields),
            submitButtonText: form.submit_button_text,
            direction: form.direction,
          })
        } catch {
          // Form not found or server error — proceed with empty config
        }
        setIsOnboarded(true)
        setIsHydrated(true)
        return
      }

      // Legacy mode: load from /state or localStorage
      const persisted = (await loadServerState()) ?? loadPersistedState()

      if (isCancelled) {
        return
      }

      if (persisted) {
        const sanitizedState = {
          ...persisted,
          formConfig: {
            ...persisted.formConfig,
            fields: sanitizeFieldVisibilityRules(persisted.formConfig.fields),
          },
        }

        setFormConfig(sanitizedState.formConfig)
        setUserInfoState(sanitizedState.userInfo)
        setIsOnboarded(sanitizedState.isOnboarded)
        saveState(sanitizedState)
      }

      setIsHydrated(true)
    }

    void loadInitialState()

    return () => {
      isCancelled = true
    }
  }, [mode, formId])

  // Auto-save state on changes (debounced) — legacy mode only
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isHydrated || mode !== undefined) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      const state = {
        formConfig,
        userInfo,
        isOnboarded,
      }

      saveState(state)
      void saveServerState(state)
    }, 300)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [formConfig, userInfo, isOnboarded, isHydrated, mode])

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
    void clearServerState()
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
    accountId,
    mode,
    formId,
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

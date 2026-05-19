'use client'

import { useState, useEffect } from 'react'
import { useFormBuilder } from '@/lib/form-builder-store'
import {
  type FormField,
  type SelectOption,
  type VisibilityCondition,
  type VisibilityConditionOperator,
  createDefaultVisibilityCondition,
  createDefaultVisibilityRule,
  getConditionalSourceFields,
  getConditionalValueOptions,
  getConditionOperatorLabel,
  getOperatorsForField,
  getVisibilityConditions,
} from '@/lib/form-builder-types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

function OptionsEditor({
  options,
  onChange,
}: {
  options: SelectOption[]
  onChange: (options: SelectOption[]) => void
}) {
  const addOption = () => {
    const newOption: SelectOption = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      label: `אפשרות ${options.length + 1}`,
      value: `option${options.length + 1}`,
    }
    onChange([...options, newOption])
  }

  const updateOption = (id: string, updates: Partial<SelectOption>) => {
    onChange(options.map(o => (o.id === id ? { ...o, ...updates } : o)))
  }

  const removeOption = (id: string) => {
    onChange(options.filter(o => o.id !== id))
  }

  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">אפשרויות</Label>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={option.id} className="flex items-center gap-2 group">
            <GripVertical className="size-4 text-muted-foreground/50" />
            <Input
              value={option.label}
              onChange={e => updateOption(option.id, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              placeholder={`אפשרות ${index + 1}`}
              className="flex-1 h-8 text-sm"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeOption(option.id)}
              disabled={options.length <= 1}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addOption} className="w-full">
        <Plus className="size-3.5 mr-1.5" />
        הוספת אפשרות
      </Button>
    </div>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  )
}

function FieldSettingsForm({ field }: { field: FormField }) {
  const { formConfig, updateField, renameFieldId } = useFormBuilder()
  const [editedId, setEditedId] = useState(field.id)
  const [idError, setIdError] = useState<string | null>(null)

  useEffect(() => {
    setEditedId(field.id)
    setIdError(null)
  }, [field.id])

  const handleIdChange = (value: string) => {
    setEditedId(value)
    if (!value.trim()) {
      setIdError('מזהה שדה לא יכול להיות ריק')
    } else if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      setIdError('מזהה יכול להכיל רק אותיות, מספרים, _ ו-')
    } else if (formConfig.fields.some(f => f.id !== field.id && f.id === value)) {
      setIdError('מזהה זה כבר בשימוש')
    } else {
      setIdError(null)
    }
  }

  const handleIdBlur = () => {
    if (!idError && editedId !== field.id) {
      renameFieldId(field.id, editedId)
    }
  }

  const handleUpdate = (updates: Partial<FormField>) => {
    updateField(field.id, updates)
  }

  const isInputField = ['text', 'email', 'number', 'phone', 'textarea', 'date'].includes(field.type)
  const hasOptions = ['select', 'radio'].includes(field.type)
  const isLayoutElement = ['heading', 'paragraph'].includes(field.type)
  const conditionalSourceFields = getConditionalSourceFields(formConfig.fields, field.id)
  const visibilityConditions = getVisibilityConditions(field.visibleWhen)
  const canAddCondition = conditionalSourceFields.length > 0

  const updateVisibilityConditions = (conditions: VisibilityCondition[]) => {
    handleUpdate({ visibleWhen: conditions.length > 0 ? { conditions } : undefined })
  }

  const updateVisibilityCondition = (index: number, updates: Partial<VisibilityCondition>) => {
    if (visibilityConditions.length === 0) {
      return
    }

    updateVisibilityConditions(
      visibilityConditions.map((condition, conditionIndex) =>
        conditionIndex === index ? { ...condition, ...updates } : condition
      )
    )
  }

  const addVisibilityCondition = () => {
    const defaultSourceField = conditionalSourceFields[0]
    if (!defaultSourceField) {
      return
    }

    updateVisibilityConditions([
      ...visibilityConditions,
      createDefaultVisibilityCondition(defaultSourceField),
    ])
  }

  const removeVisibilityCondition = (index: number) => {
    updateVisibilityConditions(visibilityConditions.filter((_, conditionIndex) => conditionIndex !== index))
  }

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <SettingsSection title="בסיסי">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fieldId">מזהה שדה (ID)</Label>
            <Input
              id="fieldId"
              value={editedId}
              onChange={e => handleIdChange(e.target.value)}
              onBlur={handleIdBlur}
              className={idError ? 'border-destructive focus-visible:ring-destructive' : ''}
              dir="ltr"
            />
            {idError && (
              <p className="text-xs text-destructive">{idError}</p>
            )}
          </div>

          {!isLayoutElement && (
            <div className="space-y-2">
              <Label htmlFor="label">תווית</Label>
              <Input
                id="label"
                value={field.label}
                onChange={e => handleUpdate({ label: e.target.value })}
                placeholder="תווית השדה"
              />
            </div>
          )}

          {isInputField && field.type !== 'date' && (
            <div className="space-y-2">
              <Label htmlFor="placeholder">טקסט בתוך השדה</Label>
              <Input
                id="placeholder"
                value={field.placeholder || ''}
                onChange={e => handleUpdate({ placeholder: e.target.value })}
                placeholder="טקסט שיופיע בתוך השדה"
              />
            </div>
          )}

          {isLayoutElement && (
            <div className="space-y-2">
              <Label htmlFor="content">תוכן</Label>
              {field.type === 'heading' ? (
                <Input
                  id="content"
                  value={field.content || ''}
                  onChange={e => handleUpdate({ content: e.target.value })}
                  placeholder="טקסט כותרת"
                />
              ) : (
                <Textarea
                  id="content"
                  value={field.content || ''}
                  onChange={e => handleUpdate({ content: e.target.value })}
                  placeholder="טקסט פסקה"
                  rows={3}
                />
              )}
            </div>
          )}

          {field.type === 'heading' && (
            <div className="space-y-2">
              <Label htmlFor="headingLevel">רמת כותרת</Label>
              <Select
                value={field.headingLevel || 'h2'}
                onValueChange={value => handleUpdate({ headingLevel: value as 'h1' | 'h2' | 'h3' | 'h4' })}
              >
                <SelectTrigger id="headingLevel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">כותרת 1 (הגדולה ביותר)</SelectItem>
                  <SelectItem value="h2">כותרת 2</SelectItem>
                  <SelectItem value="h3">כותרת 3</SelectItem>
                  <SelectItem value="h4">כותרת 4 (הקטנה ביותר)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!isLayoutElement && (
            <div className="space-y-2">
              <Label htmlFor="helperText">טקסט עזר</Label>
              <Input
                id="helperText"
                value={field.helperText || ''}
                onChange={e => handleUpdate({ helperText: e.target.value })}
                placeholder="הנחיות נוספות"
              />
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Options for select/radio */}
      {hasOptions && field.options && (
        <SettingsSection title="אפשרויות בחירה">
          <OptionsEditor
            options={field.options}
            onChange={options => handleUpdate({ options })}
          />
        </SettingsSection>
      )}

      <SettingsSection title="תצוגה חכמה">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Label htmlFor="conditionalVisibility" className="cursor-pointer">הצגה לפי תשובה</Label>
              <p className="text-xs text-muted-foreground">
                הציגו את השדה רק כששדה קודם עומד בתנאי שבחרתם.
              </p>
            </div>
            <Switch
              id="conditionalVisibility"
              checked={!!field.visibleWhen}
              disabled={!canAddCondition}
              onCheckedChange={checked => {
                if (!checked) {
                  handleUpdate({ visibleWhen: undefined })
                  return
                }

                const defaultSourceField = conditionalSourceFields[0]
                if (!defaultSourceField) {
                  return
                }

                handleUpdate({ visibleWhen: createDefaultVisibilityRule(defaultSourceField) })
              }}
            />
          </div>

          {!canAddCondition && (
            <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
              הוסיפו מעל השדה הזה שאלה עם תשובה כדי להפעיל תצוגה חכמה.
            </div>
          )}

          {field.visibleWhen && canAddCondition && (
            <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground">
                הוסיפו תנאים שכולם חייבים להתקיים כדי שהשדה יוצג.
              </p>

              {visibilityConditions.map((condition, index) => {
                const selectedSourceField = conditionalSourceFields.find(candidate => candidate.id === condition.sourceFieldId)
                const sourceValueOptions = selectedSourceField ? getConditionalValueOptions(selectedSourceField) : []

                return (
                  <div key={index} className="space-y-3 rounded-md border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs text-muted-foreground">תנאי {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeVisibilityCondition(index)}
                        disabled={visibilityConditions.length <= 1}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="מחיקת תנאי"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`visibilitySource-${index}`}>כאשר התשובה של</Label>
                      <Select
                        value={condition.sourceFieldId}
                        onValueChange={value => {
                          const nextSourceField = conditionalSourceFields.find(candidate => candidate.id === value)
                          if (!nextSourceField) {
                            return
                          }

                          updateVisibilityCondition(index, createDefaultVisibilityCondition(nextSourceField))
                        }}
                      >
                        <SelectTrigger id={`visibilitySource-${index}`} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionalSourceFields.map(candidate => (
                            <SelectItem key={candidate.id} value={candidate.id}>
                              {candidate.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`visibilityOperator-${index}`}>תנאי</Label>
                      <Select
                        value={condition.operator}
                        onValueChange={value => updateVisibilityCondition(index, { operator: value as VisibilityConditionOperator })}
                      >
                        <SelectTrigger id={`visibilityOperator-${index}`} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(selectedSourceField ? getOperatorsForField(selectedSourceField) : ['equals', 'not_equals'] as VisibilityConditionOperator[]).map(op => (
                            <SelectItem key={op} value={op}>
                              {getConditionOperatorLabel(op)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {sourceValueOptions.length > 0 ? (
                      <div className="space-y-2">
                        <Label htmlFor={`visibilityValue-${index}`}>ערך</Label>
                        <Select
                          value={condition.value}
                          onValueChange={value => updateVisibilityCondition(index, { value })}
                        >
                          <SelectTrigger id={`visibilityValue-${index}`} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sourceValueOptions.map(option => (
                              <SelectItem key={option.id} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : selectedSourceField && ['number', 'slider'].includes(selectedSourceField.type) ? (
                      <div className="space-y-2">
                        <Label htmlFor={`visibilityValue-${index}`}>ערך</Label>
                        <Input
                          id={`visibilityValue-${index}`}
                          type="number"
                          min={selectedSourceField.min}
                          max={selectedSourceField.max}
                          value={condition.value}
                          onChange={e => updateVisibilityCondition(index, { value: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor={`visibilityValue-${index}`}>ערך</Label>
                        <Input
                          id={`visibilityValue-${index}`}
                          value={condition.value}
                          onChange={e => updateVisibilityCondition(index, { value: e.target.value })}
                          placeholder="למשל: כן"
                        />
                      </div>
                    )}
                  </div>
                )
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVisibilityCondition}
                className="w-full"
              >
                <Plus className="size-3.5 mr-1.5" />
                הוספת תנאי
              </Button>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Validation Settings */}
      {!isLayoutElement && (
        <SettingsSection title="אימות">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="required" className="cursor-pointer">שדה חובה</Label>
              <Switch
                id="required"
                checked={field.required}
                onCheckedChange={checked => handleUpdate({ required: checked })}
              />
            </div>

            {field.type === 'textarea' && (
              <div className="space-y-2">
                  <Label htmlFor="rows">מספר שורות</Label>
                <Input
                  id="rows"
                  type="number"
                  value={field.rows || 4}
                  onChange={e => handleUpdate({ rows: parseInt(e.target.value) || 4 })}
                  min={2}
                  max={20}
                />
              </div>
            )}

            {(field.type === 'text' || field.type === 'textarea') && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="minLength">אורך מינימלי</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={field.minLength || ''}
                    onChange={e => handleUpdate({ minLength: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLength">אורך מקסימלי</Label>
                  <Input
                    id="maxLength"
                    type="number"
                    value={field.maxLength || ''}
                    onChange={e => handleUpdate({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="ללא"
                    min={0}
                  />
                </div>
              </div>
            )}

            {(field.type === 'number' || field.type === 'slider') && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="min">ערך מינימלי</Label>
                  <Input
                    id="min"
                    type="number"
                    value={field.min ?? ''}
                    onChange={e => handleUpdate({ min: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="ללא"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">ערך מקסימלי</Label>
                  <Input
                    id="max"
                    type="number"
                    value={field.max ?? ''}
                    onChange={e => handleUpdate({ max: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="ללא"
                  />
                </div>
              </div>
            )}
          </div>
        </SettingsSection>
      )}
    </div>
  )
}

export function FieldSettings() {
  const { formConfig, selectedFieldId, updateFormConfig } = useFormBuilder()
  const selectedField = formConfig.fields.find(f => f.id === selectedFieldId)

  return (
    <aside className="w-72 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">
          {selectedField ? 'הגדרות שדה' : 'הגדרות טופס'}
        </h2>
      </div>
      <div className="scrollbar-right flex-1 overflow-y-auto p-4">
        {selectedField ? (
          <FieldSettingsForm field={selectedField} />
        ) : (
          <div className="space-y-6">
            <SettingsSection title="פרטי הטופס">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="formTitle">כותרת הטופס</Label>
                  <Input
                    id="formTitle"
                    value={formConfig.title}
                    onChange={e => updateFormConfig({ title: e.target.value })}
                    placeholder="כותרת הטופס"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formDescription">תיאור</Label>
                  <Textarea
                    id="formDescription"
                    value={formConfig.description || ''}
                    onChange={e => updateFormConfig({ description: e.target.value })}
                    placeholder="תיאור הטופס"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submitButton">טקסט כפתור שליחה</Label>
                  <Input
                    id="submitButton"
                    value={formConfig.submitButtonText}
                    onChange={e => updateFormConfig({ submitButtonText: e.target.value })}
                    placeholder="שליחה"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direction">כיוון הטופס</Label>
                  <Select
                    value={formConfig.direction}
                    onValueChange={(value: 'ltr' | 'rtl') => updateFormConfig({ direction: value })}
                  >
                    <SelectTrigger id="direction">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ltr">משמאל לימין (אנגלית)</SelectItem>
                      <SelectItem value="rtl">מימין לשמאל (עברית)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SettingsSection>

            <div className={cn(
              'rounded-lg border border-dashed border-border p-4 text-center',
              'text-muted-foreground'
            )}>
              <p className="text-sm">בחרו שדה כדי לערוך את ההגדרות שלו</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

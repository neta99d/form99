'use client'

import { useEffect, useState } from 'react'
import { useFormBuilder } from '@/lib/form-builder-store'
import {
  type FormAnswers,
  type FormField,
  getConditionOperatorLabel,
  getConditionalValueOptions,
  isFieldVisible,
} from '@/lib/form-builder-types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { GripVertical, Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react'

function FieldRenderer({
  field,
  isSelected,
  isPreview,
  answerValue,
  onAnswerChange,
  conditionSummary,
}: {
  field: FormField
  isSelected: boolean
  isPreview: boolean
  answerValue: FormAnswers[string]
  onAnswerChange: (value: FormAnswers[string]) => void
  conditionSummary?: string
}) {
  const { selectField, removeField, duplicateField, moveField, formConfig } = useFormBuilder()
  
  const fieldIndex = formConfig.fields.findIndex(f => f.id === field.id)
  const canMoveUp = fieldIndex > 0
  const canMoveDown = fieldIndex < formConfig.fields.length - 1

  const handleClick = (e: React.MouseEvent) => {
    if (isPreview) return
    e.stopPropagation()
    selectField(field.id)
  }

  const renderFieldInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'phone':
      case 'date':
        return (
          <Input
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder}
            value={typeof answerValue === 'string' ? answerValue : ''}
            onChange={e => onAnswerChange(e.target.value)}
            disabled={!isPreview}
            className="pointer-events-auto"
          />
        )
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            rows={field.rows || 4}
            value={typeof answerValue === 'string' ? answerValue : ''}
            onChange={e => onAnswerChange(e.target.value)}
            disabled={!isPreview}
            className="pointer-events-auto"
          />
        )
      case 'select':
        return (
          <Select
            disabled={!isPreview}
            value={typeof answerValue === 'string' ? answerValue : ''}
            onValueChange={value => onAnswerChange(value)}
          >
            <SelectTrigger className="w-full pointer-events-auto">
              <SelectValue placeholder="בחרו אפשרות..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={field.id}
              checked={!!answerValue}
              onChange={e => onAnswerChange(e.target.checked)}
              disabled={!isPreview}
              className="size-4 rounded border-input accent-primary pointer-events-auto"
            />
            <label htmlFor={field.id} className="text-sm text-foreground">
              {field.label}
            </label>
          </div>
        )
      case 'radio':
        return (
          <div className="flex flex-col gap-2">
            {field.options?.map(option => (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.id}
                  id={option.id}
                  value={option.value}
                  checked={answerValue === option.value}
                  onChange={e => onAnswerChange(e.target.value)}
                  disabled={!isPreview}
                  className="size-4 accent-primary pointer-events-auto"
                />
                <label htmlFor={option.id} className="text-sm text-foreground">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )
      case 'file':
        return (
          <Input
            type="file"
            accept={field.accept}
            multiple={field.multiple}
            disabled={!isPreview}
            className="pointer-events-auto"
          />
        )
      case 'heading':
        const HeadingTag = field.headingLevel || 'h2'
        const headingClasses = {
          h1: 'text-2xl font-bold',
          h2: 'text-xl font-semibold',
          h3: 'text-lg font-semibold',
          h4: 'text-base font-semibold',
        }
        return (
          <HeadingTag className={cn(headingClasses[HeadingTag], 'text-foreground')}>
            {field.content || 'כותרת'}
          </HeadingTag>
        )
      case 'paragraph':
        return <p className="text-sm text-muted-foreground">{field.content || 'טקסט פסקה'}</p>
      default:
        return null
    }
  }

  const showLabel = field.type !== 'checkbox' && field.type !== 'heading' && field.type !== 'paragraph'

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative rounded-lg border bg-card p-4 transition-all',
        isPreview
          ? 'border-transparent'
          : isSelected
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-border/50 hover:border-primary/30 cursor-pointer'
      )}
    >
      {!isPreview && (
        <div
          className={cn(
            'absolute -left-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
            isSelected && 'opacity-100'
          )}
        >
          <GripVertical className="size-4 text-muted-foreground" />
        </div>
      )}

      <div className="space-y-2">
        {showLabel && (
          <label className="text-sm font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-destructive mr-1">*</span>}
          </label>
        )}
        {renderFieldInput()}
        {field.helperText && (
          <p className="text-xs text-muted-foreground">{field.helperText}</p>
        )}
        {!isPreview && conditionSummary && (
          <p className="text-xs text-primary/80">{conditionSummary}</p>
        )}
      </div>

      {!isPreview && (
        <div
          className={cn(
            'absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
            isSelected && 'opacity-100'
          )}
        >
          <Button
            variant="outline"
            size="icon-sm"
            onClick={e => {
              e.stopPropagation()
              if (canMoveUp) moveField(fieldIndex, fieldIndex - 1)
            }}
            disabled={!canMoveUp}
            className="size-6 bg-card"
          >
            <ChevronUp className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={e => {
              e.stopPropagation()
              if (canMoveDown) moveField(fieldIndex, fieldIndex + 1)
            }}
            disabled={!canMoveDown}
            className="size-6 bg-card"
          >
            <ChevronDown className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={e => {
              e.stopPropagation()
              duplicateField(field.id)
            }}
            className="size-6 bg-card"
          >
            <Copy className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={e => {
              e.stopPropagation()
              removeField(field.id)
            }}
            className="size-6 bg-card text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

export function FormCanvas() {
  const { formConfig, selectedFieldId, selectField, previewMode, previewDevice } = useFormBuilder()
  const [answers, setAnswers] = useState<FormAnswers>({})

  useEffect(() => {
    setAnswers(prevAnswers => {
      const validFieldIds = new Set(formConfig.fields.map(field => field.id))
      return Object.fromEntries(
        Object.entries(prevAnswers).filter(([fieldId]) => validFieldIds.has(fieldId))
      )
    })
  }, [formConfig.fields])

  const visibleFieldIds = new Set<string>()
  const activeAnswers: FormAnswers = {}

  for (const field of formConfig.fields) {
    const isVisible = !previewMode || isFieldVisible(field, activeAnswers)
    if (isVisible) {
      visibleFieldIds.add(field.id)
      activeAnswers[field.id] = answers[field.id]
    }
  }

  const visibleFields = previewMode
    ? formConfig.fields.filter(field => visibleFieldIds.has(field.id))
    : formConfig.fields

  const updateAnswer = (fieldId: string, value: FormAnswers[string]) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [fieldId]: value,
    }))
  }

  const getConditionSummary = (field: FormField) => {
    if (!field.visibleWhen) {
      return undefined
    }

    const sourceField = formConfig.fields.find(candidate => candidate.id === field.visibleWhen?.sourceFieldId)
    if (!sourceField) {
      return 'תצוגה חכמה: תנאי לא זמין'
    }

    const optionLabel = getConditionalValueOptions(sourceField).find(
      option => option.value === field.visibleWhen?.value
    )?.label

    return `מוצג כאשר "${sourceField.label}" ${getConditionOperatorLabel(field.visibleWhen.operator)} "${optionLabel ?? field.visibleWhen.value}"`
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="scrollbar-right flex-1 overflow-auto p-6">
        <div
          className={cn(
            'mx-auto transition-all duration-300',
            previewMode
              ? previewDevice === 'mobile'
                ? 'max-w-sm'
                : 'max-w-2xl'
              : 'max-w-2xl'
          )}
        >
          <div
            className={cn(
              'bg-card rounded-xl border border-border shadow-sm p-6',
              previewMode && previewDevice === 'mobile' && 'rounded-2xl shadow-lg'
            )}
            dir={formConfig.direction}
            onClick={() => !previewMode && selectField(null)}
          >
            {/* Form Header */}
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-foreground">{formConfig.title}</h1>
              {formConfig.description && (
                <p className="text-sm text-muted-foreground mt-1">{formConfig.description}</p>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {formConfig.fields.length === 0 ? (
                <div className="py-16 px-8 text-center border-2 border-dashed border-border rounded-lg">
                  <div className="text-muted-foreground">
                    <p className="text-sm font-medium">עדיין אין שדות</p>
                    <p className="text-xs mt-1">הוסיפו שדות מהחלונית הימנית כדי להתחיל</p>
                  </div>
                </div>
              ) : (
                visibleFields.map(field => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    isSelected={selectedFieldId === field.id}
                    isPreview={previewMode}
                    answerValue={answers[field.id]}
                    onAnswerChange={value => updateAnswer(field.id, value)}
                    conditionSummary={getConditionSummary(field)}
                  />
                ))
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <Button className="w-full" disabled={!previewMode}>
                {formConfig.submitButtonText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

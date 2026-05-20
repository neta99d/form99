'use client'

import { useEffect, useState, type ReactElement } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { enUS, he } from 'date-fns/locale'
import { useFormBuilder } from '@/lib/form-builder-store'
import {
  type FormAnswers,
  type FormField,
  type FieldType,
  getConditionOperatorLabel,
  getConditionalValueOptions,
  getVisibilityConditions,
  isFieldVisible,
} from '@/lib/form-builder-types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Trash2, Copy, CalendarIcon } from 'lucide-react'

function FieldRenderer({
  field,
  isSelected,
  isPreview,
  answerValue,
  onAnswerChange,
  conditionSummary,
  isDragged,
}: {
  field: FormField
  isSelected: boolean
  isPreview: boolean
  answerValue: FormAnswers[string]
  onAnswerChange: (value: FormAnswers[string]) => void
  conditionSummary?: string
  isDragged?: boolean
}) {
  const { selectField, removeField, duplicateField, formConfig } = useFormBuilder()
  const isRtl = formConfig.direction === 'rtl'
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (isPreview) return
    e.stopPropagation()
    selectField(field.id)
  }

  const renderFieldInput = () => {
    const inputClassName = cn(
      'pointer-events-auto',
      isRtl && 'text-right placeholder:text-right [direction:rtl]'
    )

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'phone':
        return (
          <Input
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder}
            value={typeof answerValue === 'string' ? answerValue : ''}
            onChange={e => onAnswerChange(e.target.value)}
            disabled={!isPreview}
            className={inputClassName}
          />
        )
      case 'date': {
        const parsedDate =
          typeof answerValue === 'string' && answerValue
            ? parseISO(answerValue)
            : null
        const selectedDate = parsedDate && isValid(parsedDate) ? parsedDate : undefined
        const displayValue = selectedDate
          ? format(selectedDate, 'dd/MM/yyyy')
          : field.placeholder || 'בחרו תאריך'

        return (
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={!isPreview}
                dir={formConfig.direction}
                className={cn(
                  'h-9 w-full px-3 py-2 font-normal',
                  isRtl ? 'flex-row-reverse justify-start' : 'justify-start',
                  !selectedDate && 'text-muted-foreground'
                )}
              >
                <span className={cn('min-w-0 flex-1', isRtl ? 'text-right' : 'text-left')}>
                  {displayValue}
                </span>
                <CalendarIcon
                  className={cn(
                    'pointer-events-none size-4 shrink-0 opacity-70',
                    isRtl ? 'ml-0 mr-2' : 'ml-2 mr-0'
                  )}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align={isRtl ? 'end' : 'start'}
              dir={formConfig.direction}
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={date => {
                  onAnswerChange(date ? format(date, 'yyyy-MM-dd') : '')
                  setDatePickerOpen(false)
                }}
                locale={isRtl ? he : enUS}
                dir={formConfig.direction}
              />
            </PopoverContent>
          </Popover>
        )
      }
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            rows={field.rows || 4}
            value={typeof answerValue === 'string' ? answerValue : ''}
            onChange={e => onAnswerChange(e.target.value)}
            disabled={!isPreview}
            className={inputClassName}
          />
        )
      case 'select':
        return (
          <Select
            dir={formConfig.direction}
            disabled={!isPreview}
            value={typeof answerValue === 'string' ? answerValue : ''}
            onValueChange={value => onAnswerChange(value)}
          >
            <SelectTrigger className={cn('w-full pointer-events-auto', isRtl && 'text-right')}>
              <SelectValue placeholder="בחרו אפשרות..." />
            </SelectTrigger>
            <SelectContent className={cn(isRtl && 'text-right')}>
              {field.options?.map(option => (
                <SelectItem key={option.id} value={option.value} className={cn(isRtl && 'text-right')}>
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
      case 'star_rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => isPreview && onAnswerChange(String(star))}
                disabled={!isPreview}
                className={cn(
                  'text-2xl leading-none transition-colors pointer-events-auto',
                  isPreview ? 'cursor-pointer' : 'cursor-default',
                  Number(answerValue) >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                )}
              >
                ★
              </button>
            ))}
          </div>
        )
      case 'slider': {
        const sliderVal = typeof answerValue === 'string' && answerValue !== '' ? answerValue : String(field.min ?? 0)
        return (
          <div className="flex items-center gap-3 pointer-events-auto">
            <input
              type="range"
              min={field.min ?? 0}
              max={field.max ?? 100}
              value={sliderVal}
              onChange={e => onAnswerChange(e.target.value)}
              disabled={!isPreview}
              className="flex-1 accent-primary"
            />
            <span className="text-sm font-semibold min-w-8 text-center">{sliderVal}</span>
          </div>
        )
      }
      case 'number_rating':
        return (
          <div className="flex flex-wrap gap-1.5 pointer-events-auto">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                type="button"
                onClick={() => isPreview && onAnswerChange(String(n))}
                disabled={!isPreview}
                className={cn(
                  'size-9 rounded-md border text-sm font-medium transition-colors',
                  isPreview ? 'cursor-pointer' : 'cursor-default',
                  String(answerValue) === String(n)
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        )
      default:
        return null
    }
  }

  const showLabel = field.type !== 'checkbox' && field.type !== 'heading' && field.type !== 'paragraph'

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative rounded-lg border bg-card p-4 transition-all select-none',
        isPreview
          ? 'border-transparent'
          : isSelected
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-border/50 hover:border-primary/30',
        isDragged && 'opacity-50 shadow-lg'
      )}
    >
      <div className="space-y-2">
        {showLabel && (
          <label className={cn('text-sm font-medium text-foreground', isRtl && 'text-right')}>
            {field.label}
            {field.required && <span className="text-destructive mr-1">*</span>}
          </label>
        )}
        {renderFieldInput()}
        {field.helperText && (
          <p className={cn('text-xs text-muted-foreground', isRtl && 'text-right')}>{field.helperText}</p>
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

function PhantomCard({
  halfColumn, isRtl, onDragOver, onDrop,
}: {
  halfColumn?: 'left' | 'right'
  isRtl: boolean
  onDragOver?: React.DragEventHandler
  onDrop?: React.DragEventHandler
}) {
  if (!halfColumn) {
    return (
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="min-h-[70px] rounded-lg border-2 border-dashed border-primary/50 bg-primary/5"
      />
    )
  }
  // cardFirst → card gets order-1 (screen-LEFT in LTR, screen-RIGHT in RTL)
  const cardFirst = (!isRtl && halfColumn === 'left') || (isRtl && halfColumn === 'right')
  return (
    <div className="flex gap-4" onDragOver={onDragOver} onDrop={onDrop}>
      <div className={cn(
        'flex-1 min-w-0 min-h-[70px] rounded-lg border-2 border-dashed border-primary/50 bg-primary/5',
        cardFirst ? 'order-1' : 'order-2',
      )} />
      <div className={cn('flex-1 min-w-0', cardFirst ? 'order-2' : 'order-1')} />
    </div>
  )
}

function groupFieldsByRow(fields: FormField[]): FormField[][] {
  if (fields.length === 0) return []
  const rowMap = new Map<number, FormField[]>()
  for (const field of fields) {
    const row = field.layout?.row ?? 0
    if (!rowMap.has(row)) rowMap.set(row, [])
    rowMap.get(row)!.push(field)
  }
  return Array.from(rowMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, rowFields]) => rowFields)
}

type DropTarget =
  | { id: string; mode: 'before' | 'after'; halfColumn?: 'left' | 'right' }
  | { id: string; mode: 'merge'; intoColumn: 'left' | 'right' }

const FIELD_ID_DATA_TYPE = 'application/x-form99-field-id'
const FIELD_TYPE_DATA_TYPE = 'application/x-form99-field-type'
const EMPTY_DROP_TARGET_ID = '__empty__'

export function FormCanvas() {
  const {
    formConfig,
    selectedFieldId,
    selectField,
    previewMode,
    previewDevice,
    addFieldAt,
    moveField,
    moveFieldWithLayoutUpdates,
    updateField,
  } = useFormBuilder()
  const [answers, setAnswers] = useState<FormAnswers>({})
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [draggedFieldType, setDraggedFieldType] = useState<FieldType | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

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
    const conditions = getVisibilityConditions(field.visibleWhen)
    if (conditions.length === 0) return undefined

    const conditionSummaries = conditions.map(condition => {
      const sourceField = formConfig.fields.find(candidate => candidate.id === condition.sourceFieldId)
      if (!sourceField) return null
      const optionLabel = getConditionalValueOptions(sourceField).find(
        option => option.value === condition.value
      )?.label
      return `"${sourceField.label}" ${getConditionOperatorLabel(condition.operator)} "${optionLabel ?? condition.value}"`
    }).filter(Boolean)

    if (conditionSummaries.length === 0) return 'תצוגה חכמה: תנאי לא זמין'
    return `מוצג כאשר ${conditionSummaries.join(' וגם ')}`
  }

  const isRtl = formConfig.direction === 'rtl'
  const rowGroups = groupFieldsByRow(visibleFields)
  const getPointerColumn = (e: React.DragEvent, rect: DOMRect): 'left' | 'right' => {
    return e.clientX < rect.left + rect.width / 2 ? 'left' : 'right'
  }

  const hasDraggedFieldType = (e: React.DragEvent) => {
    return Array.from(e.dataTransfer.types).includes(FIELD_TYPE_DATA_TYPE)
  }

  const getDraggedFieldType = (e: React.DragEvent): FieldType | null => {
    return (draggedFieldType || e.dataTransfer.getData(FIELD_TYPE_DATA_TYPE) || null) as FieldType | null
  }

  const clearDragState = () => {
    setDraggedId(null)
    setDraggedFieldType(null)
    setDropTarget(null)
  }

  const handleDragOver = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault()
    if (draggedId === fieldId) return
    e.dataTransfer.dropEffect = draggedId ? 'move' : 'copy'

    const draggedField = formConfig.fields.find(f => f.id === draggedId)
    const targetField  = formConfig.fields.find(f => f.id === fieldId)
    const draggedIsHalf = (draggedField?.layout?.column ?? 'full') !== 'full'
    const targetIsHalf  = (targetField?.layout?.column ?? 'full') !== 'full'
    const rect = e.currentTarget.getBoundingClientRect()

    // Merge mode: both half-width and cursor in middle 50% vertically
    if (draggedIsHalf && targetIsHalf) {
      const vThreshold = rect.height * 0.25
      if (e.clientY >= rect.top + vThreshold && e.clientY <= rect.bottom - vThreshold) {
        const intoColumn = getPointerColumn(e, rect)
        setDropTarget(prev =>
          prev?.id === fieldId && prev.mode === 'merge' && (prev as { intoColumn: string }).intoColumn === intoColumn
            ? prev
            : { id: fieldId, mode: 'merge', intoColumn }
        )
        return
      }
    }

    const mode = (e.clientY < rect.top + rect.height / 2 ? 'before' : 'after') as 'before' | 'after'
    if (draggedIsHalf) {
      const halfColumn = getPointerColumn(e, rect)
      setDropTarget(prev => {
        const p = prev as ({ mode: 'before' | 'after'; halfColumn?: string } & { id: string }) | null
        return p?.id === fieldId && p.mode === mode && p.halfColumn === halfColumn
          ? prev
          : { id: fieldId, mode, halfColumn }
      })
    } else {
      setDropTarget(prev =>
        prev?.id === fieldId && prev.mode === mode ? prev : { id: fieldId, mode }
      )
    }
  }

  const handleDrop = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault()
    if (!dropTarget) return

    const fieldType = getDraggedFieldType(e)
    if (!draggedId && fieldType) {
      if (dropTarget.mode === 'merge') return
      const targetIdx = formConfig.fields.findIndex(f => f.id === fieldId)
      const insertAt = dropTarget.mode === 'after' ? targetIdx + 1 : targetIdx
      addFieldAt(fieldType, insertAt)
      clearDragState()
      return
    }

    if (!draggedId || draggedId === fieldId) return

    const allFields = formConfig.fields
    const fromIdx   = allFields.findIndex(f => f.id === draggedId)
    const targetIdx = allFields.findIndex(f => f.id === fieldId)

    if (dropTarget.mode === 'merge') {
      const { intoColumn } = dropTarget as { mode: 'merge'; id: string; intoColumn: 'left' | 'right' }
      const oppositeColumn: 'left' | 'right' = intoColumn === 'left' ? 'right' : 'left'
      const insertAt     = intoColumn === 'right' ? targetIdx + 1 : targetIdx
      const storeToIndex = fromIdx < insertAt ? insertAt - 1 : insertAt
      const targetRow = allFields[targetIdx]?.layout?.row ?? 0
      moveFieldWithLayoutUpdates(
        fromIdx,
        Math.max(0, Math.min(storeToIndex, allFields.length - 1)),
        {
          [draggedId]: { row: targetRow, column: intoColumn },
          [fieldId]: { row: targetRow, column: oppositeColumn },
        }
      )
    } else {
      const insertAt       = dropTarget.mode === 'after' ? targetIdx + 1 : targetIdx
      const storeToIndex   = fromIdx < insertAt ? insertAt - 1 : insertAt
      const draggedField   = allFields[fromIdx]
      const draggedIsHalf  = (draggedField?.layout?.column ?? 'full') !== 'full'
      const dropHalfColumn = (dropTarget as { halfColumn?: 'left' | 'right' }).halfColumn
      const targetIndex = Math.max(0, Math.min(storeToIndex, allFields.length - 1))

      if (dropHalfColumn && draggedIsHalf) {
        const standaloneRow = Math.max(...allFields.map(field => field.layout?.row ?? 0), 0) + allFields.length + 1
        moveFieldWithLayoutUpdates(fromIdx, targetIndex, {
          [draggedId]: { row: standaloneRow, column: dropHalfColumn },
        })
      } else {
        moveField(fromIdx, targetIndex)
      }
    }

    clearDragState()
  }

  const handleEmptyCanvasDragOver = (e: React.DragEvent) => {
    if (!hasDraggedFieldType(e)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDropTarget(prev =>
      prev?.id === EMPTY_DROP_TARGET_ID ? prev : { id: EMPTY_DROP_TARGET_ID, mode: 'after' }
    )
  }

  const handleEmptyCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const fieldType = getDraggedFieldType(e)
    if (!fieldType) return
    addFieldAt(fieldType, 0)
    clearDragState()
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
            <div
              className="space-y-4"
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDropTarget(null)
                }
              }}
            >
              {visibleFields.length === 0 ? (
                <div
                  onDragOver={handleEmptyCanvasDragOver}
                  onDrop={handleEmptyCanvasDrop}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDropTarget(prev => prev?.id === EMPTY_DROP_TARGET_ID ? null : prev)
                    }
                  }}
                  className={cn(
                    'py-16 px-8 text-center border-2 border-dashed rounded-lg transition-colors',
                    dropTarget?.id === EMPTY_DROP_TARGET_ID
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  )}
                >
                  <div className="text-muted-foreground">
                    <p className="text-sm font-medium">עדיין אין שדות</p>
                    <p className="text-xs mt-1">הוסיפו שדות מהחלונית הימנית כדי להתחיל</p>
                  </div>
                </div>
              ) : (
                rowGroups.flatMap((rowFields, rowIndex) => {
                  const column0 = rowFields[0].layout?.column ?? 'full'
                  const isFull = column0 === 'full'
                  const isLoneHalf = !isFull && rowFields.length === 1
                  const loneField = isLoneHalf ? rowFields[0] : null
                  const emptyColumn: 'left' | 'right' = loneField?.layout?.column === 'left' ? 'right' : 'left'
                  const zoneId = loneField ? `__zone__${loneField.id}` : ''
                  const draggedField = draggedId ? formConfig.fields.find(f => f.id === draggedId) : null
                  const draggedIsHalf = (draggedField?.layout?.column ?? 'full') !== 'full'
                  const showEmptyZone = isLoneHalf && draggedIsHalf
                  const hasBeforeTarget = !previewMode && dropTarget?.mode === 'before' && rowFields.some(f => f.id === dropTarget.id)
                  const hasAfterTarget  = !previewMode && dropTarget?.mode === 'after'  && rowFields.some(f => f.id === dropTarget.id)
                  const phantomHalfCol  = (dropTarget as { halfColumn?: 'left' | 'right' } | null)?.halfColumn

                  const rowEl = (
                    <div
                      key={rowIndex}
                      className={cn(!isFull && 'flex gap-4')}
                    >
                      {rowFields.map(field => (
                        <div
                          key={field.id}
                          className={cn(
                            'relative',
                            isFull ? 'w-full' : 'flex-1 min-w-0',
                            !isFull && isRtl && field.layout?.column === 'left' && 'order-2',
                            !isFull && isRtl && field.layout?.column === 'right' && 'order-1',
                            !previewMode && (draggedId ? 'cursor-grabbing' : 'cursor-grab'),
                          )}
                          draggable={!previewMode}
                          onDragStart={(e) => {
                            setDraggedId(field.id)
                            setDraggedFieldType(null)
                            e.dataTransfer.effectAllowed = 'move'
                            e.dataTransfer.setData(FIELD_ID_DATA_TYPE, field.id)
                            e.dataTransfer.setData('text/plain', field.id)
                          }}
                          onDragEnd={() => {
                            clearDragState()
                          }}
                          onDragOver={(e) => handleDragOver(e, field.id)}
                          onDrop={(e) => handleDrop(e, field.id)}
                        >
                          <FieldRenderer
                            field={field}
                            isSelected={selectedFieldId === field.id}
                            isPreview={previewMode}
                            answerValue={answers[field.id]}
                            onAnswerChange={value => updateAnswer(field.id, value)}
                            conditionSummary={getConditionSummary(field)}
                            isDragged={draggedId === field.id}
                          />
                          {dropTarget?.id === field.id && dropTarget.mode === 'merge' && (
                            <div className={cn(
                              'absolute inset-y-0 w-0.5 bg-primary rounded-full z-10 pointer-events-none',
                              (dropTarget as { mode: 'merge'; intoColumn: string }).intoColumn === 'right' ? '-right-2' : '-left-2'
                            )} />
                          )}
                        </div>
                      ))}
                      {isLoneHalf && loneField && (
                        <div
                          className={cn(
                            'flex-1 min-w-0 relative',
                            isRtl && emptyColumn === 'left' && 'order-2',
                            isRtl && emptyColumn === 'right' && 'order-1',
                          )}
                          onDragOver={showEmptyZone ? (e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            setDropTarget(prev =>
                              prev?.id === zoneId ? prev : { id: zoneId, mode: 'merge', intoColumn: emptyColumn }
                            )
                          } : undefined}
                          onDragLeave={showEmptyZone ? (e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setDropTarget(prev => prev?.id === zoneId ? null : prev)
                            }
                          } : undefined}
                          onDrop={showEmptyZone ? (e) => {
                            e.preventDefault()
                            if (!draggedId) return
                            const allFields = formConfig.fields
                            const fromIdx = allFields.findIndex(f => f.id === draggedId)
                            const targetIdx = allFields.findIndex(f => f.id === loneField.id)
                            const insertAt = emptyColumn === 'right' ? targetIdx + 1 : targetIdx
                            const storeToIndex = fromIdx < insertAt ? insertAt - 1 : insertAt
                            const targetRow = loneField.layout?.row ?? 0
                            moveFieldWithLayoutUpdates(
                              fromIdx,
                              Math.max(0, Math.min(storeToIndex, allFields.length - 1)),
                              {
                                [loneField.id]: { row: targetRow, column: loneField.layout?.column ?? 'left' },
                                [draggedId]: { row: targetRow, column: emptyColumn },
                              }
                            )
                            clearDragState()
                          } : undefined}
                        >
                          <div
                            className={cn(
                              'h-full min-h-[70px] rounded-lg border-2 border-dashed transition-colors',
                              showEmptyZone
                                ? dropTarget?.id === zoneId
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border/40'
                                : 'border-transparent',
                            )}
                          />
                        </div>
                      )}
                    </div>
                  )
                  const phantomHandlers = {
                    onDragOver: (e: React.DragEvent) => e.preventDefault(),
                    onDrop: (e: React.DragEvent) => {
                      if (!dropTarget || dropTarget.mode === 'merge') return
                      handleDrop(e, dropTarget.id)
                    },
                  }
                  return [
                    hasBeforeTarget ? <PhantomCard key={`before-${rowIndex}`} halfColumn={phantomHalfCol} isRtl={isRtl} {...phantomHandlers} /> : null,
                    rowEl,
                    hasAfterTarget  ? <PhantomCard key={`after-${rowIndex}`}  halfColumn={phantomHalfCol} isRtl={isRtl} {...phantomHandlers} /> : null,
                  ].filter((x): x is ReactElement => x !== null)
                })
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

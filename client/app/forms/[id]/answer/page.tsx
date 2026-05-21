'use client'

import { use, useEffect, useState } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { enUS, he } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getForm, submitFormAnswers, DEFAULT_ACCOUNT_ID, DEFAULT_SERVER_ID, type FormResponse } from '@/lib/forms-api'
import { type FormField, type FormAnswers, isFieldVisible } from '@/lib/form-builder-types'
import { cn } from '@/lib/utils'

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

function FieldInput({
  field,
  value,
  onChange,
  isRtl,
  direction,
}: {
  field: FormField
  value: FormAnswers[string]
  onChange: (v: FormAnswers[string]) => void
  isRtl: boolean
  direction: 'rtl' | 'ltr'
}) {
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const inputClassName = cn('w-full', isRtl && 'text-right placeholder:text-right [direction:rtl]')

  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
    case 'phone':
      return (
        <Input
          type={field.type === 'phone' ? 'tel' : field.type}
          placeholder={field.placeholder}
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          className={inputClassName}
        />
      )
    case 'textarea':
      return (
        <Textarea
          placeholder={field.placeholder}
          rows={field.rows || 4}
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          className={cn(inputClassName, 'resize-none')}
        />
      )
    case 'select':
      return (
        <Select dir={direction} value={typeof value === 'string' ? value : ''} onValueChange={onChange}>
          <SelectTrigger className={cn('w-full', isRtl && 'text-right')}>
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
            checked={!!value}
            onChange={e => onChange(e.target.checked)}
            className="size-4 rounded border-input accent-primary"
          />
          <label htmlFor={field.id} className="text-sm text-foreground">{field.label}</label>
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
                id={`${field.id}-${option.id}`}
                value={option.value}
                checked={value === option.value}
                onChange={e => onChange(e.target.value)}
                className="size-4 accent-primary"
              />
              <label htmlFor={`${field.id}-${option.id}`} className="text-sm text-foreground">{option.label}</label>
            </div>
          ))}
        </div>
      )
    case 'date': {
      const parsed = typeof value === 'string' && value ? parseISO(value) : null
      const selected = parsed && isValid(parsed) ? parsed : undefined
      return (
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              dir={direction}
              className={cn(
                'h-9 w-full px-3 py-2 font-normal',
                isRtl ? 'flex-row-reverse justify-start' : 'justify-start',
                !selected && 'text-muted-foreground'
              )}
            >
              <span className={cn('min-w-0 flex-1', isRtl ? 'text-right' : 'text-left')}>
                {selected ? format(selected, 'dd/MM/yyyy') : (field.placeholder || 'בחרו תאריך')}
              </span>
              <CalendarIcon className={cn('pointer-events-none size-4 shrink-0 opacity-70', isRtl ? 'mr-2' : 'ml-2')} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align={isRtl ? 'end' : 'start'} dir={direction}>
            <Calendar
              mode="single"
              selected={selected}
              onSelect={date => {
                onChange(date ? format(date, 'yyyy-MM-dd') : '')
                setDatePickerOpen(false)
              }}
              locale={isRtl ? he : enUS}
              dir={direction}
            />
          </PopoverContent>
        </Popover>
      )
    }
    case 'star_rating':
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(String(star))}
              className={cn(
                'text-2xl leading-none transition-colors cursor-pointer',
                Number(value) >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
              )}
            >★</button>
          ))}
        </div>
      )
    case 'slider': {
      const sliderVal = typeof value === 'string' && value !== '' ? value : String(field.min ?? 0)
      return (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={field.min ?? 0}
            max={field.max ?? 100}
            value={sliderVal}
            onChange={e => onChange(e.target.value)}
            className="flex-1 accent-primary"
          />
          <span className="text-sm font-semibold min-w-8 text-center">{sliderVal}</span>
        </div>
      )
    }
    case 'number_rating':
      return (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(String(n))}
              className={cn(
                'size-9 rounded-md border text-sm font-medium transition-colors cursor-pointer',
                String(value) === String(n)
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
              )}
            >{n}</button>
          ))}
        </div>
      )
    case 'heading': {
      const Tag = field.headingLevel || 'h2'
      const cls = { h1: 'text-2xl font-bold', h2: 'text-xl font-semibold', h3: 'text-lg font-semibold', h4: 'text-base font-semibold' }
      return <Tag className={cn(cls[Tag], 'text-foreground')}>{field.content || ''}</Tag>
    }
    case 'paragraph':
      return <p className="text-sm text-muted-foreground">{field.content || ''}</p>
    default:
      return null
  }
}

export default function AnswerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [form, setForm] = useState<FormResponse | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [answers, setAnswers] = useState<FormAnswers>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    getForm(id).then(setForm).catch(() => setLoadError(true))
  }, [id])

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        הטופס לא נמצא
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  const isRtl = form.direction === 'rtl'

  // Build active answers respecting visibility
  const activeAnswers: FormAnswers = {}
  const visibleFields: FormField[] = []
  for (const field of form.fields as FormField[]) {
    if (isFieldVisible(field, activeAnswers)) {
      visibleFields.push(field)
      activeAnswers[field.id] = answers[field.id]
    }
  }

  const updateAnswer = (fieldId: string, value: FormAnswers[string]) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) setErrors(prev => { const e = { ...prev }; delete e[fieldId]; return e })
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    const displayTypes = new Set(['heading', 'paragraph'])

    for (const field of visibleFields) {
      if (displayTypes.has(field.type)) continue
      if (!field.required) continue
      const val = answers[field.id]
      const isEmpty = val === undefined || val === null || val === '' || val === false
      if (isEmpty) newErrors[field.id] = 'שדה זה הוא חובה'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setStatus('loading')
    try {
      await submitFormAnswers(id, DEFAULT_ACCOUNT_ID, DEFAULT_SERVER_ID, answers)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir={form.direction}>
        <div className="text-center space-y-3 max-w-sm px-4">
          <div className="text-4xl">✓</div>
          <h2 className="text-xl font-semibold text-foreground">תודה על מילוי הטופס!</h2>
          <p className="text-sm text-muted-foreground">תגובתך נשמרה בהצלחה</p>
        </div>
      </div>
    )
  }

  const rowGroups = groupFieldsByRow(visibleFields)

  return (
    <div className="min-h-screen bg-background py-10 px-4" dir={form.direction}>
      <div className="max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="space-y-1">
            {form.title && (
              <h1 className={cn('text-2xl font-bold text-foreground', isRtl && 'text-right')}>{form.title}</h1>
            )}
            {form.description && (
              <p className={cn('text-sm text-muted-foreground', isRtl && 'text-right')}>{form.description}</p>
            )}
          </div>

          {/* Fields */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {rowGroups.map((rowFields, rowIdx) => {
              const isHalfRow = rowFields.length === 2 && rowFields.every(f => f.layout?.column && f.layout.column !== 'full')

              if (isHalfRow) {
                const [a, b] = rowFields
                const leftField = rowFields.find(f => f.layout?.column === 'left')!
                const rightField = rowFields.find(f => f.layout?.column === 'right')!
                const first = isRtl ? rightField : leftField
                const second = isRtl ? leftField : rightField

                return (
                  <div key={rowIdx} className="flex gap-4">
                    {[first, second].map(field => (
                      <div key={field.id} className="flex-1 min-w-0 space-y-1.5">
                        {field.type !== 'checkbox' && field.type !== 'heading' && field.type !== 'paragraph' && (
                          <label className={cn('text-sm font-medium text-foreground', isRtl && 'text-right block')}>
                            {field.label}
                            {field.required && <span className="text-destructive mr-1">*</span>}
                          </label>
                        )}
                        <FieldInput field={field} value={answers[field.id]} onChange={v => updateAnswer(field.id, v)} isRtl={isRtl} direction={form.direction as 'rtl' | 'ltr'} />
                        {field.helperText && <p className={cn('text-xs text-muted-foreground', isRtl && 'text-right')}>{field.helperText}</p>}
                        {errors[field.id] && <p className="text-xs text-destructive">{errors[field.id]}</p>}
                      </div>
                    ))}
                  </div>
                )
              }

              return rowFields.map(field => (
                <div key={field.id} className="space-y-1.5">
                  {field.type !== 'checkbox' && field.type !== 'heading' && field.type !== 'paragraph' && (
                    <label className={cn('text-sm font-medium text-foreground', isRtl && 'text-right block')}>
                      {field.label}
                      {field.required && <span className="text-destructive mr-1">*</span>}
                    </label>
                  )}
                  <FieldInput field={field} value={answers[field.id]} onChange={v => updateAnswer(field.id, v)} isRtl={isRtl} direction={form.direction as 'rtl' | 'ltr'} />
                  {field.helperText && <p className={cn('text-xs text-muted-foreground', isRtl && 'text-right')}>{field.helperText}</p>}
                  {errors[field.id] && <p className="text-xs text-destructive">{errors[field.id]}</p>}
                </div>
              ))
            })}

            {status === 'error' && (
              <p className="text-sm text-destructive text-center">שגיאה בשליחה, נסו שנית</p>
            )}

            <Button type="submit" className="w-full" disabled={status === 'loading'}>
              {status === 'loading' ? <Loader2 className="size-4 animate-spin" /> : (form.submit_button_text || 'שליחה')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

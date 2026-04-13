'use client'

import { useFormBuilder } from '@/lib/form-builder-store'
import { type FormField, type SelectOption } from '@/lib/form-builder-types'
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
  const { updateField } = useFormBuilder()

  const handleUpdate = (updates: Partial<FormField>) => {
    updateField(field.id, updates)
  }

  const isInputField = ['text', 'email', 'number', 'phone', 'textarea', 'date', 'file'].includes(field.type)
  const hasOptions = ['select', 'radio'].includes(field.type)
  const isLayoutElement = ['heading', 'paragraph'].includes(field.type)

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <SettingsSection title="בסיסי">
        <div className="space-y-4">
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

          {isInputField && field.type !== 'file' && field.type !== 'date' && (
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

            {field.type === 'number' && (
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

            {field.type === 'file' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="accept">סוגי קבצים מותרים</Label>
                  <Input
                    id="accept"
                    value={field.accept || ''}
                    onChange={e => handleUpdate({ accept: e.target.value })}
                    placeholder="למשל: image/*, .pdf, .doc"
                  />
                  <p className="text-xs text-muted-foreground">השאירו ריק כדי לאפשר את כל סוגי הקבצים</p>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="multiple" className="cursor-pointer">אפשר בחירת כמה קבצים</Label>
                  <Switch
                    id="multiple"
                    checked={field.multiple || false}
                    onCheckedChange={checked => handleUpdate({ multiple: checked })}
                  />
                </div>
              </>
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

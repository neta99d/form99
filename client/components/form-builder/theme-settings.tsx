'use client'

import { useFormBuilder } from '@/lib/form-builder-store'
import { type FormTheme, type FormThemePosition } from '@/lib/form-builder-types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'

// ─── Shared sub-components ────────────────────────────────────────────────────

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        {/* Color swatch — native picker hidden under the div */}
        <label className="relative size-8 shrink-0 rounded border border-border overflow-hidden cursor-pointer">
          <div className="size-full" style={{ backgroundColor: value }} />
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-8 font-mono text-xs"
          placeholder="#000000"
          dir="ltr"
        />
      </div>
    </div>
  )
}

// ─── Position options ─────────────────────────────────────────────────────────

const POSITION_OPTIONS: { value: FormThemePosition; label: string }[] = [
  { value: 'default',           label: 'ברירת מחדל' },
  { value: 'left',              label: 'שמאל' },
  { value: 'right',             label: 'ימין' },
  { value: 'center',            label: 'מרכז' },
  { value: 'center_with_banner', label: 'מרכז עם באנר' },
  { value: 'image_background',  label: 'רקע תמונה' },
]

// ─── Main component ───────────────────────────────────────────────────────────

export function ThemeSettings() {
  const { formConfig, updateTheme, setThemeOpen } = useFormBuilder()
  const theme = formConfig.theme

  const update = (patch: Partial<FormTheme>) => updateTheme({ ...theme, ...patch })

  return (
    <div
      className="w-72 shrink-0 border-e border-border bg-card flex flex-col h-full overflow-hidden"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">עיצוב הטופס</h2>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setThemeOpen(false)}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* ── Colors ── */}
        <SettingsSection title="צבעים">
          <ColorField
            label="רקע הטופס"
            value={theme.backgroundColor}
            onChange={v => update({ backgroundColor: v })}
          />
          <ColorField
            label="רקע שאלות"
            value={theme.questionsBackgroundColor}
            onChange={v => update({ questionsBackgroundColor: v })}
          />
          <ColorField
            label="צבע ראשי"
            value={theme.primaryColor}
            onChange={v => update({ primaryColor: v })}
          />
          <ColorField
            label="צבע שאלות"
            value={theme.questionsColor}
            onChange={v => update({ questionsColor: v })}
          />
          <ColorField
            label="צבע תשובות"
            value={theme.answersColor}
            onChange={v => update({ answersColor: v })}
          />
        </SettingsSection>

        {/* ── Typography ── */}
        <SettingsSection title="טיפוגרפיה">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">גופן</Label>
            <Input
              value={theme.font}
              onChange={e => update({ font: e.target.value })}
              placeholder="inherit"
              className="h-8 text-sm"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">גודל שאלות (px)</Label>
            <Input
              type="number"
              value={theme.questionsSize}
              onChange={e => update({ questionsSize: Number(e.target.value) })}
              min={8}
              max={72}
              className="h-8 text-sm"
            />
          </div>
        </SettingsSection>

        {/* ── Layout ── */}
        <SettingsSection title="פריסה">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">פריסת הטופס</Label>
            <Select
              value={theme.position}
              onValueChange={v => update({ position: v as FormThemePosition })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SettingsSection>

        {/* ── Media ── */}
        <SettingsSection title="מדיה">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">לוגו (URL)</Label>
            <Input
              value={theme.logo}
              onChange={e => update({ logo: e.target.value })}
              placeholder="https://..."
              className="h-8 text-sm"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">תמונת רקע (URL)</Label>
            <Input
              value={theme.image}
              onChange={e => update({ image: e.target.value })}
              placeholder="https://..."
              className="h-8 text-sm"
              dir="ltr"
            />
          </div>
        </SettingsSection>

      </div>
    </div>
  )
}

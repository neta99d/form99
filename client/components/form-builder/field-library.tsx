'use client'

import { useFormBuilder } from '@/lib/form-builder-store'
import { FIELD_CATEGORIES, type FieldType } from '@/lib/form-builder-types'
import {
  Type,
  Mail,
  Hash,
  Phone,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
  Calendar,
  Heading,
  FileText,
  Star,
  SlidersHorizontal,
  Gauge,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const FIELD_ICONS: Record<FieldType, React.ElementType> = {
  text: Type,
  email: Mail,
  number: Hash,
  phone: Phone,
  textarea: AlignLeft,
  select: List,
  checkbox: CheckSquare,
  radio: Circle,
  date: Calendar,
  heading: Heading,
  paragraph: FileText,
  star_rating: Star,
  slider: SlidersHorizontal,
  number_rating: Gauge,
}

const FIELD_LABELS: Record<FieldType, string> = {
  text: 'שדה טקסט',
  email: 'אימייל',
  number: 'מספר',
  phone: 'טלפון',
  textarea: 'טקסט ארוך',
  select: 'רשימה נפתחת',
  checkbox: 'תיבת סימון',
  radio: 'בחירה אחת',
  date: 'תאריך',
  heading: 'כותרת',
  paragraph: 'פסקה',
  star_rating: 'כוכבים',
  slider: 'סליידר',
  number_rating: 'דירוג 1-10',
}

export function FieldLibrary() {
  const { addField } = useFormBuilder()

  return (
    <aside className="w-64 border-l border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">רכיבי טופס</h2>
        <p className="text-xs text-muted-foreground mt-1">לחצו כדי להוסיף שדות</p>
      </div>
      <div className="scrollbar-right flex-1 overflow-y-auto p-3">
        {Object.entries(FIELD_CATEGORIES).map(([category, types]) => (
          <div key={category} className="mb-5">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {category}
            </h3>
            <div className="flex flex-col gap-1.5">
              {types.map(type => {
                const Icon = FIELD_ICONS[type as FieldType]
                return (
                  <button
                    key={type}
                    draggable
                    onClick={() => addField(type as FieldType)}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'copy'
                      e.dataTransfer.setData('application/x-form99-field-type', type)
                      e.dataTransfer.setData('text/plain', type)
                    }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-right cursor-grab active:cursor-grabbing',
                      'bg-background border border-border/50',
                      'hover:border-primary/30 hover:bg-accent/50',
                      'transition-all duration-150 group'
                    )}
                  >
                    <div className="size-8 rounded-md bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {FIELD_LABELS[type as FieldType]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

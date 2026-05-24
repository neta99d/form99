'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus, Copy, Trash2, Link, BarChart2, FileText, Loader2, Search, ChevronUp, ChevronDown, X } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getForms, deleteForm, duplicateForm, createForm, checkFormNameUnique, DEFAULT_ACCOUNT_ID, DEFAULT_SERVER_ID, type FormSummary } from '@/lib/forms-api'
import { cn } from '@/lib/utils'

export default function Page() {
  const router = useRouter()
  const [forms, setForms] = useState<FormSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc')

  const filteredForms = useMemo(() => {
    let result = [...forms]
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(f => f.name.toLowerCase().includes(q))
    }
    result.sort((a, b) => {
      const diff = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      return sortDirection === 'desc' ? -diff : diff
    })
    return result
  }, [forms, searchQuery, sortDirection])

  const loadForms = useCallback(async () => {
    try {
      const data = await getForms(DEFAULT_ACCOUNT_ID, DEFAULT_SERVER_ID)
      setForms(data)
    } catch {
      toast.error('שגיאה בטעינת הטפסים')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadForms()
  }, [loadForms])

  const handleDuplicate = async (e: React.MouseEvent, formId: string) => {
    e.stopPropagation()
    try {
      await duplicateForm(formId)
      await loadForms()
      toast.success('הטופס שוכפל בהצלחה')
    } catch {
      toast.error('שגיאה בשכפול הטופס')
    }
  }

  const handleDelete = async (e: React.MouseEvent, formId: string, formName: string) => {
    e.stopPropagation()
    if (!window.confirm(`למחוק את הטופס "${formName}"?`)) return
    try {
      await deleteForm(formId)
      await loadForms()
      toast.success('הטופס נמחק')
    } catch {
      toast.error('שגיאה במחיקת הטופס')
    }
  }

  const handleCopyLink = async (e: React.MouseEvent, formId: string) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(`${window.location.origin}/forms/${formId}/answer`)
    toast.success('הקישור הועתק!')
  }

  const handleViewResults = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Future feature
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="size-9 shrink-0 flex items-center justify-center">
            <Image
              src="/icon.svg"
              alt="אייקון בונה הטפסים"
              width={28}
              height={26}
              className="h-[26px] w-[28px]"
            />
          </div>
          <h1 className="text-base font-semibold text-foreground">FORMS</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          טופס חדש
        </Button>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">הטפסים שלי</h2>

        {!loading && forms.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="חיפוש לפי שם הטופס..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-9 pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
            טוען טפסים...
          </div>
        ) : forms.length === 0 ? (
          <EmptyState onCreateNew={() => setCreateOpen(true)} />
        ) : filteredForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="size-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">לא נמצאו טפסים</p>
            <p className="text-xs text-muted-foreground">נסו לשנות את מונחי החיפוש</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-right text-sm font-medium text-muted-foreground px-5 py-3">
                    שם הטופס
                  </th>
                  <th className="text-right text-sm font-medium text-muted-foreground px-5 py-3 w-44">
                    <button
                      onClick={() => setSortDirection(d => d === 'desc' ? 'asc' : 'desc')}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      עדכון אחרון
                      {sortDirection === 'desc'
                        ? <ChevronDown className="size-3.5" />
                        : <ChevronUp className="size-3.5" />}
                    </button>
                  </th>
                  <th className="text-right text-sm font-medium text-muted-foreground px-5 py-3 w-56">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.map((form, i) => (
                  <tr
                    key={form.id}
                    onClick={() => router.push(`/forms/${form.id}/edit`)}
                    className={`cursor-pointer transition-colors hover:bg-secondary/30 ${
                      i !== filteredForms.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="size-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{form.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {format(new Date(form.updated_at), 'd בMMM yyyy', { locale: he })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <ActionButton
                          onClick={e => handleDuplicate(e, form.id)}
                          icon={<Copy className="size-3.5" />}
                          label="שכפול"
                        />
                        <ActionButton
                          onClick={e => handleDelete(e, form.id, form.name)}
                          icon={<Trash2 className="size-3.5" />}
                          label="מחיקה"
                          destructive
                        />
                        <ActionButton
                          onClick={e => handleCopyLink(e, form.id)}
                          icon={<Link className="size-3.5" />}
                          label="קישור"
                        />
                        <ActionButton
                          onClick={handleViewResults}
                          icon={<BarChart2 className="size-3.5" />}
                          label="תוצאות"
                          disabled
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <CreateFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={id => router.push(`/forms/${id}/edit`)}
      />
    </div>
  )
}

interface CreateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void
}

function CreateFormDialog({ open, onOpenChange, onCreated }: CreateFormDialogProps) {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      setName('')
      setNameError(null)
      setStatus('idle')
    }
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!name.trim()) {
      setNameError(null)
      return
    }

    debounceRef.current = setTimeout(async () => {
      const available = await checkFormNameUnique(DEFAULT_SERVER_ID, DEFAULT_ACCOUNT_ID, name.trim())
      setNameError(available ? null : 'שם זה כבר בשימוש')
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [name])

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('שם הטופס הוא שדה חובה')
      return
    }
    if (nameError) return

    setStatus('loading')
    try {
      const created = await createForm({
        account_id: DEFAULT_ACCOUNT_ID,
        server_id: DEFAULT_SERVER_ID,
        name: name.trim(),
        title: '',
        description: null,
        submit_button_text: 'שליחה',
        direction: 'rtl',
        fields: [],
      })
      onCreated(created.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setNameError(msg.includes('כבר בשימוש') ? 'שם זה כבר בשימוש' : 'שגיאה ביצירת הטופס')
      setStatus('idle')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>טופס חדש</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-form-name">שם הטופס</Label>
            <Input
              id="new-form-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="למשל: טופס יצירת קשר"
              className={cn(nameError && 'border-destructive focus-visible:ring-destructive')}
              autoFocus
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>
          <Button type="submit" disabled={status === 'loading' || !!nameError} className="w-full">
            {status === 'loading' ? (
              <>
                <Loader2 className="size-4 animate-spin ml-2" />
                יוצר...
              </>
            ) : (
              'יצירה'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface ActionButtonProps {
  onClick: (e: React.MouseEvent) => void
  icon: React.ReactNode
  label: string
  destructive?: boolean
  disabled?: boolean
}

function ActionButton({ onClick, icon, label, destructive, disabled }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        destructive
          ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="size-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <FileText className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">אין טפסים עדיין</h3>
      <p className="text-sm text-muted-foreground mb-6">צרו את הטופס הראשון שלכם ותתחילו לאסוף נתונים</p>
      <Button onClick={onCreateNew} className="gap-2">
        <Plus className="size-4" />
        צור טופס חדש
      </Button>
    </div>
  )
}

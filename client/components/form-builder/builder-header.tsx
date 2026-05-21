'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useFormBuilder, API_BASE_URL } from '@/lib/form-builder-store'
import { generateFormHTML } from '@/lib/form-builder-types'
import { formConfigToPayload, updateForm } from '@/lib/forms-api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Eye, X, Monitor, Smartphone, Code, Copy, Check, Loader2, CheckCircle, XCircle, ArrowRight, Save, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BuilderHeader() {
  const {
    formConfig,
    previewMode,
    previewDevice,
    setPreviewMode,
    setPreviewDevice,
    accountId,
    mode,
    formId,
  } = useFormBuilder()

  const router = useRouter()
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [sendError, setSendError] = useState<string | null>(null)

  const handleCopyHTML = async () => {
    await navigator.clipboard.writeText(generateFormHTML(formConfig))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!formConfig.name.trim()) {
      setSendStatus('error')
      setSendError('יש להזין שם לטופס בהגדרות הטופס')
      setTimeout(() => { setSendStatus('idle'); setSendError(null) }, 5000)
      return
    }
    setSendStatus('loading')
    setSendError(null)
    try {
      if (mode === 'edit' && formId) {
        await updateForm(formId, {
          name: formConfig.name,
          title: formConfig.title,
          description: formConfig.description ?? null,
          submit_button_text: formConfig.submitButtonText,
          direction: formConfig.direction,
          fields: formConfig.fields,
        })
        setSendStatus('success')
        setTimeout(() => setSendStatus('idle'), 3000)
      } else {
        // create mode
        const response = await fetch(`${API_BASE_URL}/api/forms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formConfigToPayload(formConfig, accountId)),
        })
        if (!response.ok) {
          const err = await response.json().catch(() => ({})) as { detail?: string }
          throw new Error(err.detail ?? `${response.status}`)
        }
        const created = await response.json() as { id: string }
        setSendStatus('success')
        setTimeout(() => router.push(`/forms/${created.id}/edit`), 800)
      }
    } catch (e) {
      setSendStatus('error')
      setSendError(e instanceof Error ? e.message : null)
      setTimeout(() => { setSendStatus('idle'); setSendError(null) }, 5000)
    }
  }

  return (
    <>
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
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
        </div>

        <div className="flex items-center gap-2">
          {previewMode ? (
            <>
              <div className="flex items-center bg-secondary rounded-lg p-1">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    previewDevice === 'desktop'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Monitor className="size-4" />
                  מחשב
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    previewDevice === 'mobile'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Smartphone className="size-4" />
                  נייד
                </button>
              </div>
              <Button variant="outline" onClick={() => setPreviewMode(false)} className="gap-1.5">
                <X className="size-4" />
                סגירת תצוגה
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="gap-1.5 text-muted-foreground"
              >
                <ArrowRight className="size-4" />
                חזרה לרשימה
              </Button>
              <Button variant="outline" onClick={() => setPreviewMode(true)} className="gap-1.5">
                <Eye className="size-4" />
                תצוגה מקדימה
              </Button>
              <Button variant="outline" onClick={() => setPublishDialogOpen(true)} className="gap-1.5">
                <Code className="size-4" />
                HTML
              </Button>
              <Button
                onClick={handleSave}
                disabled={sendStatus === 'loading'}
                variant={sendStatus === 'error' ? 'destructive' : 'default'}
                className="gap-1.5"
              >
                {sendStatus === 'loading' ? (
                  <><Loader2 className="size-4 animate-spin" />{mode === 'edit' ? 'שומר...' : 'יוצר...'}</>
                ) : sendStatus === 'success' ? (
                  <><CheckCircle className="size-4" />{mode === 'edit' ? 'נשמר!' : 'נוצר!'}</>
                ) : sendStatus === 'error' ? (
                  <><XCircle className="size-4" />{sendError ?? 'נכשל'}</>
                ) : mode === 'edit' ? (
                  <><Save className="size-4" />שמירה</>
                ) : (
                  <><Send className="size-4" />יצירה</>
                )}
              </Button>
            </>
          )}
        </div>
      </header>

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>ייצוא קוד HTML</DialogTitle>
            <DialogDescription>
              העתיקו את קוד ה-HTML הבא כדי להטמיע את הטופס בכל אתר.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {formConfig.fields.length} שדות הוגדרו
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyHTML} className="gap-1.5">
                {copied ? (
                  <><Check className="size-4 text-success" />הועתק!</>
                ) : (
                  <><Copy className="size-4" />העתקת HTML</>
                )}
              </Button>
            </div>
            <div className="scrollbar-right-ltr-content flex-1 min-h-0 overflow-auto rounded-lg border border-border bg-secondary/30">
              <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-all">
                {generateFormHTML(formConfig)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

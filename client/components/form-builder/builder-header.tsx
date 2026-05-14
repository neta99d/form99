'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useFormBuilder } from '@/lib/form-builder-store'
import { generateFormHTML } from '@/lib/form-builder-types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Eye, X, Monitor, Smartphone, Code, Copy, Check, Send, Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BuilderHeader() {
  const {
    formConfig,
    previewMode,
    previewDevice,
    setPreviewMode,
    setPreviewDevice,
    userInfo,
    resetBuilder,
  } = useFormBuilder()

  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [sendMessage, setSendMessage] = useState('')

  const handleCopyHTML = async () => {
    const html = generateFormHTML(formConfig)
    await navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSend = async () => {
    if (!userInfo) return
    
    setSendStatus('loading')
    setSendMessage('')
    
    try {
      const html = generateFormHTML(formConfig)
      const response = await fetch(
        'https://builder4.99digital.co.il/4480/webhook/form',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName: userInfo.fullName,
            businessName: userInfo.businessName,
            html: html,
          }),
        }
      )

      if (response.ok) {
        setSendStatus('success')
        setSendMessage('הטופס נשלח בהצלחה!')
        setTimeout(() => {
          setSendStatus('idle')
          setSendMessage('')
        }, 3000)
      } else {
        throw new Error(`Request failed with status ${response.status}`)
      }
    } catch (error) {
      setSendStatus('error')
      setSendMessage(error instanceof Error ? error.message : 'שליחת הטופס נכשלה')
      setTimeout(() => {
        setSendStatus('idle')
        setSendMessage('')
      }, 5000)
    }
  }

  const generatedHTML = generateFormHTML(formConfig)

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
              {/* Device Toggle */}
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

              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
                className="gap-1.5"
              >
                <X className="size-4" />
                סגירת תצוגה
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={resetBuilder}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="size-4" />
                איפוס
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreviewMode(true)}
                className="gap-1.5"
              >
                <Eye className="size-4" />
                תצוגה מקדימה
              </Button>
              <Button
                onClick={() => setPublishDialogOpen(true)}
                className="gap-1.5"
              >
                <Code className="size-4" />
                HTML
              </Button>
              <Button
                onClick={handleSend}
                disabled={sendStatus === 'loading'}
                variant={sendStatus === 'success' ? 'outline' : sendStatus === 'error' ? 'destructive' : 'default'}
                className="gap-1.5"
              >
                {sendStatus === 'loading' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    שולח...
                  </>
                ) : sendStatus === 'success' ? (
                  <>
                    <CheckCircle className="size-4 text-success" />
                    נשלח!
                  </>
                ) : sendStatus === 'error' ? (
                  <>
                    <XCircle className="size-4" />
                    נכשל
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    שליחה
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Publish Dialog */}
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyHTML}
                className="gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-success" />
                    הועתק!
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    העתקת HTML
                  </>
                )}
              </Button>
            </div>
            <div className="scrollbar-right-ltr-content flex-1 min-h-0 overflow-auto rounded-lg border border-border bg-secondary/30">
              <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-all">
                {generatedHTML}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useState } from 'react'
import { useFormBuilder } from '@/lib/form-builder-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, ArrowLeft } from 'lucide-react'

export function OnboardingScreen() {
  const { setUserInfo } = useFormBuilder()
  const [businessName, setBusinessName] = useState('')
  const [fullName, setFullName] = useState('')
  const [errors, setErrors] = useState<{ businessName?: string; fullName?: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: { businessName?: string; fullName?: string } = {}
    
    if (!businessName.trim()) {
      newErrors.businessName = 'יש להזין שם עסק'
    }
    
    if (!fullName.trim()) {
      newErrors.fullName = 'יש להזין שם מלא'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setUserInfo({
      businessName: businessName.trim(),
      fullName: fullName.trim(),
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <FileText className="size-8" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            ברוכים הבאים לבונה הטפסים
          </h1>
          <p className="text-muted-foreground">
            נתחיל בהגדרת פרטי החשבון שלכם.
          </p>
        </div>
        
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="businessName">שם העסק</Label>
              <Input
                id="businessName"
                type="text"
                placeholder="הזינו את שם העסק"
                value={businessName}
                onChange={e => {
                  setBusinessName(e.target.value)
                  if (errors.businessName) {
                    setErrors(prev => ({ ...prev, businessName: undefined }))
                  }
                }}
                className={errors.businessName ? 'border-destructive' : ''}
              />
              {errors.businessName && (
                <p className="text-sm text-destructive">{errors.businessName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">שם מלא</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="הזינו את שמכם המלא"
                value={fullName}
                onChange={e => {
                  setFullName(e.target.value)
                  if (errors.fullName) {
                    setErrors(prev => ({ ...prev, fullName: undefined }))
                  }
                }}
                className={errors.fullName ? 'border-destructive' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full">
              המשך לבונה הטפסים
              <ArrowLeft className="size-4 mr-2" />
            </Button>
          </form>
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-6">
          הפרטים האלו ישמשו להתאמת חוויית בניית הטפסים עבורכם.
        </p>
      </div>
    </div>
  )
}

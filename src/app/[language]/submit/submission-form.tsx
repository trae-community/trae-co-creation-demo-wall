'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Tag as WorkTag, DictionaryItem } from '@/lib/types'
import { buildWorkFormSchema, WorkFormValues } from '@/lib/work-form'
import { Button } from '@/components/common/action-button'
import { StepIndicator, StepNumber } from './steps/StepIndicator'
import { Step1BasicInfo } from './steps/Step1BasicInfo'
import { Step2VisualAssets } from './steps/Step2VisualAssets'
import { Step3Content } from './steps/Step3Content'
import { Step4Team } from './steps/Step4Team'

// ─── Step → field mapping for partial validation ──────────────────────────────

const STEP_FIELDS: Record<StepNumber, (keyof WorkFormValues)[]> = {
  1: ['name', 'intro', 'country', 'city', 'category', 'devStatus', 'tags'],
  2: ['coverUrl', 'screenshots'],
  3: ['story', 'highlights', 'scenarios', 'demoUrl', 'repoUrl'],
  4: ['team', 'teamIntro', 'contactPhone', 'contactEmail'],
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SubmissionForm() {
  const { data: session } = useSession()
  const t = useTranslations('Submit')
  const locale = useLocale()
  const router = useRouter()

  // ── Wizard state ──
  const [currentStep, setCurrentStep] = useState<StepNumber>(1)
  const [isNavigating, setIsNavigating] = useState(false)
  const [showStepError, setShowStepError] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedWorkId, setSubmittedWorkId] = useState<string | null>(null)

  // ── Upload / preview state (lives here, passed to Step2) ──
  const [previewCoverUrl, setPreviewCoverUrl] = useState('')
  const [previewScreenshots, setPreviewScreenshots] = useState<string[]>([])
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false)
  const [failedCoverFile, setFailedCoverFile] = useState<File | null>(null)

  // ── Dictionary data ──
  const [availableTags, setAvailableTags] = useState<WorkTag[]>([])
  const [availableCategories, setAvailableCategories] = useState<DictionaryItem[]>([])
  const [availableCountries, setAvailableCountries] = useState<DictionaryItem[]>([])
  const [availableCities, setAvailableCities] = useState<DictionaryItem[]>([])
  const [availableDevStatuses, setAvailableDevStatuses] = useState<DictionaryItem[]>([])

  // ── Form ──
  const submissionSchema = useMemo(() => buildWorkFormSchema(t), [t])

  const form = useForm<WorkFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      name: '',
      intro: '',
      country: '',
      city: '',
      category: '',
      devStatus: '',
      tags: [],
      team: [{ value: session?.user?.name || '' }],
      teamIntro: '',
      contactPhone: '',
      contactEmail: '',
      coverUrl: '',
      story: '',
      highlights: [{ value: '' }],
      scenarios: [{ value: '' }],
      screenshots: [],
      demoUrl: '',
      repoUrl: '',
    },
  })

  const {
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { isSubmitting, isDirty },
  } = form

  const selectedCountry = watch('country')
  const screenshots = watch('screenshots') || []

  // ── Sync user ──
  useEffect(() => {
    if (session?.user?.name) {
      setValue('team', [{ value: session.user.name }])
    }
  }, [session, setValue])

  // ── Reset city on country change ──
  useEffect(() => {
    setValue('city', '')
  }, [selectedCountry, setValue])

  // ── Filtered cities ──
  const filteredCities = useMemo(() => {
    if (!selectedCountry) return []
    return availableCities.filter(c => c.parentValue === selectedCountry)
  }, [availableCities, selectedCountry])

  // ── Data fetching ──
  const apiLang = (l: string) =>
    l === 'zh' ? 'zh-CN' : l === 'en' ? 'en-US' : l === 'ja' ? 'ja-JP' : l

  useEffect(() => {
    const lang = apiLang(locale)

    const fetchTags = async () => {
      try {
        const res = await fetch('/api/tags/all')
        if (res.ok) setAvailableTags(await res.json())
      } catch (e) {
        console.error('Failed to fetch tags:', e)
      }
    }

    const fetchCategories = async () => {
      try {
        const [catRes, statusRes] = await Promise.all([
          fetch(`/api/dictionaries?code=category_code&lang=${lang}`),
          fetch(`/api/dictionaries?code=dev_status&lang=${lang}`),
        ])
        const catData = catRes.ok ? await catRes.json() : { items: [] }
        const statusData = statusRes.ok ? await statusRes.json() : { items: [] }
        setAvailableCategories(catData.items || [])
        setAvailableDevStatuses(statusData.items || [])
      } catch (e) {
        console.error('Failed to fetch categories:', e)
      }
    }

    const fetchLocations = async () => {
      try {
        const [countryRes, cityRes] = await Promise.all([
          fetch(`/api/dictionaries?code=country&lang=${lang}`),
          fetch(`/api/dictionaries?code=city&lang=${lang}`),
        ])
        const countryData = countryRes.ok ? await countryRes.json() : { items: [] }
        const cityData = cityRes.ok ? await cityRes.json() : { items: [] }
        setAvailableCountries(countryData.items || [])
        setAvailableCities(cityData.items || [])
      } catch (e) {
        console.error('Failed to fetch locations:', e)
      }
    }

    fetchTags()
    fetchCategories()
    fetchLocations()
  }, [locale])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty || isSubmitted) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty, isSubmitted])

  // ── Upload helpers ──
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/file', { method: 'POST', body: formData })
    const result = await res.json()
    if (result.success) return result.url
    throw new Error(result.error || 'Upload failed')
  }

  const uploadCoverFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('uploadSizeError'))
      return
    }
    try {
      setUploadingCover(true)
      setFailedCoverFile(null)
      const url = await uploadFile(file)
      setPreviewCoverUrl(url)
      setValue('coverUrl', url, { shouldValidate: true })
    } catch (err) {
      console.error('Cover upload failed:', err)
      setFailedCoverFile(file)
      toast.error(t('uploadError') || 'Upload failed')
    } finally {
      setUploadingCover(false)
    }
  }

  const uploadScreenshotFiles = async (files: File[]) => {
    if (files.length === 0) return
    if (files.length + screenshots.length > 5) {
      toast.error(t('uploadLimitError'))
      return
    }
    try {
      setUploadingScreenshots(true)
      const urls = await Promise.all(
        files.map(async (f) => {
          if (f.size > 5 * 1024 * 1024) throw new Error(t('uploadSizeError'))
          return uploadFile(f)
        })
      )
      const next = [...screenshots, ...urls]
      setPreviewScreenshots(next)
      setValue('screenshots', next, { shouldValidate: true })
    } catch (err) {
      console.error('Screenshot upload failed:', err)
      toast.error(t('uploadError') || 'Upload failed')
    } finally {
      setUploadingScreenshots(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await uploadCoverFile(file)
    e.target.value = ''
  }

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    await uploadScreenshotFiles(Array.from(files))
    e.target.value = ''
  }

  const removeScreenshot = (index: number) => {
    const next = screenshots.filter((_, i) => i !== index)
    setPreviewScreenshots(next)
    setValue('screenshots', next)
  }

  // ── Navigation ──
  const validateStep = async (step: StepNumber) => {
    const valid = await trigger(STEP_FIELDS[step] as Parameters<typeof trigger>[0])
    setShowStepError(!valid)
    return valid
  }

  const handleNext = async () => {
    setIsNavigating(true)
    const valid = await validateStep(currentStep)
    setIsNavigating(false)
    if (valid) {
      setShowStepError(false)
      // Defer step change so the "Next" click cannot land on the new submit button
      queueMicrotask(() => {
        setCurrentStep(s => Math.min(s + 1, 4) as StepNumber)
      })
    }
  }

  const handleBack = () => {
    setShowStepError(false)
    setCurrentStep(s => Math.max(s - 1, 1) as StepNumber)
  }

  const handleStepClick = async (n: StepNumber) => {
    if (n === currentStep) return
    if (n < currentStep) {
      setShowStepError(false)
      setCurrentStep(n)
      return
    }
    setIsNavigating(true)
    const valid = await validateStep(currentStep)
    setIsNavigating(false)
    if (valid) {
      setShowStepError(false)
      queueMicrotask(() => setCurrentStep(n))
    }
  }

  // ── Submit (only allowed from Step 4) ──
  const onSubmit = async (data: WorkFormValues) => {
    try {
      const payload = {
        ...data,
        highlights: data.highlights.map(h => h.value),
        scenarios: data.scenarios.map(s => s.value),
        team: JSON.stringify(data.team.map(t => t.value)),
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()

      if (res.ok && result.success) {
        setSubmittedWorkId(result.id)
        setIsSubmitted(true)
      } else {
        console.error('Submission error:', result.error, result.details)
        // 显示具体的错误信息
        const errorMsg = result.details?.length > 0
          ? result.details.map((d: {path?: string[], message?: string}) => d.message).filter(Boolean).join('、')
          : result.error || t('submitError')
        toast.error(errorMsg)
      }
    } catch (err) {
      console.error('Submission failed:', err)
      toast.error(t('submitError'))
    }
  }

  // ── Success screen ──
  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-card rounded-2xl shadow-sm border border-border px-8">
        <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-card-foreground mb-4">{t('successTitle')}</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t('successMessage')}</p>
        <div className="flex justify-center gap-4">
          {submittedWorkId && (
            <Button onClick={() => router.push(`/${locale}/works/${submittedWorkId}`)} variant="outline">
              {t('viewProject')}
            </Button>
          )}
          <Button onClick={() => router.push(`/${locale}`)}>{t('backHome')}</Button>
        </div>
      </div>
    )
  }

  // ── Wizard ──
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
        className="bg-card p-8 md:p-10 rounded-2xl shadow-lg border border-border"
      >
        {/* Step indicator */}
        <StepIndicator current={currentStep} onStepClick={handleStepClick} />

        {showStepError && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {t('stepValidationBanner')}
          </div>
        )}

        {/* Step panels — always mounted, hidden via class to preserve state */}
        <div className="min-h-[400px]">
          <div className={currentStep === 1 ? '' : 'hidden'}>
            <Step1BasicInfo
              form={form}
              availableCountries={availableCountries}
              availableCities={availableCities}
              availableCategories={availableCategories}
              availableDevStatuses={availableDevStatuses}
              availableTags={availableTags}
              filteredCities={filteredCities}
            />
          </div>

          <div className={currentStep === 2 ? '' : 'hidden'}>
            <Step2VisualAssets
              form={form}
              previewCoverUrl={previewCoverUrl}
              setPreviewCoverUrl={setPreviewCoverUrl}
              previewScreenshots={previewScreenshots}
              uploadingCover={uploadingCover}
              uploadingScreenshots={uploadingScreenshots}
              uploadCoverFile={uploadCoverFile}
              uploadScreenshotFiles={uploadScreenshotFiles}
              handleImageUpload={handleImageUpload}
              handleScreenshotUpload={handleScreenshotUpload}
              removeScreenshot={removeScreenshot}
              failedCoverFile={failedCoverFile}
              onRetryCover={() => {
                if (failedCoverFile) void uploadCoverFile(failedCoverFile)
              }}
            />
          </div>

          <div className={currentStep === 3 ? '' : 'hidden'}>
            <Step3Content form={form} />
          </div>

          <div className={currentStep === 4 ? '' : 'hidden'}>
            <Step4Team form={form} />
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-10 pt-6 border-t border-border flex items-center justify-between">
          {/* Back button */}
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleBack}
                disabled={isNavigating || isSubmitting}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('prevStep')}
              </Button>
            )}
          </div>

          {/* Next / Submit button */}
          <div>
            {currentStep < 4 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
                isLoading={isNavigating}
                disabled={isNavigating}
              >
                {t('nextStep')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                onClick={() => void handleSubmit(onSubmit)()}
              >
                {t('submitButton')}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

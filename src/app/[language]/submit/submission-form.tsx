'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState, useEffect, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useUser } from '@clerk/nextjs'
import { CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Tag as WorkTag, DictionaryItem } from '@/lib/types'
import { Button } from '@/components/common/action-button'
import { StepIndicator, StepNumber } from './steps/StepIndicator'
import { Step1BasicInfo, SubmissionFormValues } from './steps/Step1BasicInfo'
import { Step2VisualAssets } from './steps/Step2VisualAssets'
import { Step3Content } from './steps/Step3Content'
import { Step4Team } from './steps/Step4Team'

// ─── Zod schema ───────────────────────────────────────────────────────────────

function buildSchema(t: (k: string) => string) {
  return z.object({
    name: z.string().min(2, t('validationNameMin')).max(50, t('validationNameMax')),
    intro: z.string().min(10, t('validationIntroMin')).max(100, t('validationIntroMax')),
    country: z.string().min(1, t('validationCountry')),
    city: z.string().min(1, t('validationCity')),
    category: z.string().min(1, t('validationCategory')),
    devStatus: z.string().min(1, t('validationDevStatus')),
    tags: z.array(z.number()).min(1, t('validationTagsMin')).max(5, t('validationTagsMax')),
    team: z
      .array(z.object({ value: z.string().min(1, t('validationTeamMemberRequired')) }))
      .min(1, t('validationTeamMin')),
    teamIntro: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email(t('validationEmail')).optional().or(z.literal('')),
    coverUrl: z.string().min(1, t('validationCover')),
    story: z.string().min(10, t('validationStoryMin')),
    highlights: z
      .array(
        z.object({
          value: z
            .string()
            .min(1, t('validationHighlightRequired'))
            .max(10, t('validationHighlightMax')),
        })
      )
      .min(3, t('validationHighlightsMin'))
      .max(5, t('validationHighlightsMax')),
    scenarios: z
      .array(z.object({ value: z.string().min(1, t('validationScenarioRequired')) }))
      .min(1, t('validationScenariosMin')),
    screenshots: z
      .array(z.string())
      .min(1, t('validationScreenshotsMin'))
      .max(5, t('validationScreenshotsMax')),
    demoUrl: z.string().url(t('validationDemoUrl')),
    repoUrl: z.string().url(t('validationRepoUrl')).optional().or(z.literal('')),
  })
}

// ─── Step → field mapping for partial validation ──────────────────────────────

const STEP_FIELDS: Record<StepNumber, (keyof SubmissionFormValues)[]> = {
  1: ['name', 'intro', 'country', 'city', 'category', 'devStatus', 'tags'],
  2: ['coverUrl', 'screenshots'],
  3: ['story', 'highlights', 'scenarios', 'demoUrl', 'repoUrl'],
  4: ['team', 'teamIntro', 'contactPhone', 'contactEmail'],
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SubmissionForm() {
  const { user } = useUser()
  const t = useTranslations('Submit')
  const locale = useLocale()

  // ── Wizard state ──
  const [currentStep, setCurrentStep] = useState<StepNumber>(1)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // ── Upload / preview state (lives here, passed to Step2) ──
  const [previewCoverUrl, setPreviewCoverUrl] = useState('')
  const [previewScreenshots, setPreviewScreenshots] = useState<string[]>([])
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false)

  // ── Options State ──
  const [availableTags, setAvailableTags] = useState<WorkTag[]>([])
  const [availableCategories, setAvailableCategories] = useState<DictionaryItem[]>([])
  const [availableCountries, setAvailableCountries] = useState<DictionaryItem[]>([])
  const [availableCities, setAvailableCities] = useState<DictionaryItem[]>([])
  const [availableDevStatuses, setAvailableDevStatuses] = useState<DictionaryItem[]>([])

  // ── Form ──
  const submissionSchema = useMemo(() => buildSchema(t), [t])

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      name: '',
      intro: '',
      country: '',
      city: '',
      category: '',
      devStatus: '', 
      tags: [],
      team: [{ value: user?.username || '' }],
      teamIntro: '',
      contactPhone: '',
      contactEmail: '',
      coverUrl: '',
      story: '',
      highlights: [{ value: '' }, { value: '' }, { value: '' }],
      scenarios: [{ value: '' }],
      screenshots: [],
      demoUrl: '',
      repoUrl: '',
    },
  })

  const { handleSubmit, watch, setValue, trigger, formState: { isSubmitting } } = form

  const selectedCountry = watch('country')
  const screenshots = watch('screenshots') || []

  // ── Sync user ──
  useEffect(() => {
    if (user?.username) {
      setValue('team', [{ value: user.username }])
    }
  }, [user, setValue])

  // ── Reset city on country change ──
  useEffect(() => {
    // We intentionally don't clear the city here if the component is just mounting
    // Let the Step1BasicInfo handle city reset via its onChange handler if needed
  }, [selectedCountry]);

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

  // ── Upload helpers ──
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/file', { method: 'POST', body: formData })
    const result = await res.json()
    if (result.success) return result.url
    throw new Error(result.error || 'Upload failed')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert(t('uploadSizeError'))
      return
    }
    try {
      setUploadingCover(true)
      const url = await uploadFile(file)
      setPreviewCoverUrl(url)
      setValue('coverUrl', url, { shouldValidate: true })
    } catch (err) {
      console.error('Cover upload failed:', err)
      alert(t('uploadError') || 'Upload failed')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    if (files.length + screenshots.length > 5) {
      alert(t('uploadLimitError'))
      return
    }
    try {
      setUploadingScreenshots(true)
      const urls = await Promise.all(
        Array.from(files).map(async f => {
          if (f.size > 5 * 1024 * 1024) throw new Error(t('uploadSizeError'))
          return uploadFile(f)
        })
      )
      const next = [...screenshots, ...urls]
      setPreviewScreenshots(next)
      setValue('screenshots', next, { shouldValidate: true })
    } catch (err) {
      console.error('Screenshot upload failed:', err)
      alert(t('uploadError') || 'Upload failed')
    } finally {
      setUploadingScreenshots(false)
    }
  }

  const removeScreenshot = (index: number) => {
    const next = screenshots.filter((_, i) => i !== index)
    setPreviewScreenshots(next)
    setValue('screenshots', next)
  }

  // ── Navigation ──
  const handleNext = async () => {
    setIsNavigating(true)
    const valid = await trigger(STEP_FIELDS[currentStep] as Parameters<typeof trigger>[0])
    setIsNavigating(false)
    if (valid) setCurrentStep(s => Math.min(s + 1, 4) as StepNumber)
  }

  const handleBack = () => {
    setCurrentStep(s => Math.max(s - 1, 1) as StepNumber)
  }

  const handleStepClick = (n: StepNumber) => {
    setCurrentStep(n)
  }

  // ── Submit ──
  const onSubmit = async (data: SubmissionFormValues) => {
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
        setIsSubmitted(true)
      } else {
        console.error('Submission error:', result.error, result.details)
        alert(t('submitError') || result.error || 'Submission failed')
      }
    } catch (err) {
      console.error('Submission failed:', err)
      alert(t('submitError') || 'An unexpected error occurred')
    }
  }

  // ── Success screen ──
  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-card rounded-2xl shadow-sm border border-border px-8">
        <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">{t('successTitle')}</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">{t('successMessage')}</p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => window.location.reload()} variant="outline">
            {t('continueSubmit')}
          </Button>
          <Button onClick={() => setIsSubmitted(false)}>{t('viewSubmission')}</Button>
        </div>
      </div>
    )
  }

  // ── Wizard ──
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-card p-8 md:p-10 rounded-2xl shadow-lg border border-border"
      >
        {/* Step indicator */}
        <StepIndicator current={currentStep} onStepClick={handleStepClick} />

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
              setPreviewScreenshots={setPreviewScreenshots}
              uploadingCover={uploadingCover}
              uploadingScreenshots={uploadingScreenshots}
              handleImageUpload={handleImageUpload}
              handleScreenshotUpload={handleScreenshotUpload}
              removeScreenshot={removeScreenshot}
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
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting}
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

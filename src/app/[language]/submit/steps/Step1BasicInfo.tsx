'use client'

import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { AlertCircle, Globe, MapPin, LayoutGrid, CheckCircle, Tag } from 'lucide-react'
import { Select } from '@/components/common/form-select'
import { DictionaryItem, Tag as WorkTag } from '@/lib/types'

export type SubmissionFormValues = {
  name: string
  intro: string
  country: string
  city: string
  category: string
  devStatus: string
  tags: number[]
  team: { value: string }[]
  teamIntro?: string
  contactPhone?: string
  contactEmail?: string
  coverUrl: string
  story: string
  highlights: { value: string }[]
  scenarios: { value: string }[]
  screenshots: string[]
  demoUrl?: string
  repoUrl?: string
}

interface Step1Props {
  form: UseFormReturn<SubmissionFormValues>
  availableCountries: DictionaryItem[]
  availableCities: DictionaryItem[]
  availableCategories: DictionaryItem[]
  availableDevStatuses: DictionaryItem[]
  availableTags: WorkTag[]
  filteredCities: DictionaryItem[]
}

export function Step1BasicInfo({
  form,
  availableCountries,
  availableCities,
  availableCategories,
  availableDevStatuses,
  availableTags,
  filteredCities,
}: Step1Props) {
  const t = useTranslations('Submit')
  const { register, watch, setValue, formState: { errors } } = form

  const selectedCountry = watch('country')
  const selectedTags = watch('tags') || []

  const toggleTag = (tagId: number) => {
    const current = selectedTags
    const exists = current.includes(tagId)
    const next = exists ? current.filter(id => id !== tagId) : [...current, tagId]
    setValue('tags', next, { shouldValidate: true })
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600'

  return (
    <div className="space-y-6">
      {/* Project Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          {t('projectName')} <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name')}
          className={inputClass}
          placeholder={t('projectNamePlaceholder')}
        />
        {errors.name && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Intro */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          {t('intro')} <span className="text-red-500">*</span>
        </label>
        <input
          {...register('intro')}
          className={inputClass}
          placeholder={t('introPlaceholder')}
        />
        {errors.intro && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.intro.message}
          </p>
        )}
      </div>

      {/* Province + City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            {t('country')} <span className="text-red-500">*</span>
          </label>
          <Select
            options={availableCountries.map(c => ({ label: c.itemLabel, value: c.itemValue }))}
            value={selectedCountry}
            onChange={value => {
              setValue('country', value, { shouldValidate: true })
              setValue('city', '', { shouldValidate: false })
            }}
            placeholder={t('countryPlaceholder')}
            icon={<Globe className="w-4 h-4" />}
          />
          <input type="hidden" {...register('country')} />
          {errors.country && (
            <p className="text-red-500 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.country.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            {t('city')} <span className="text-red-500">*</span>
          </label>
          <Select
            options={filteredCities.map(c => ({ label: c.itemLabel, value: c.itemValue }))}
            value={watch('city')}
            onChange={value => setValue('city', value, { shouldValidate: true })}
            placeholder={t('cityPlaceholder')}
            disabled={!selectedCountry}
            icon={<MapPin className="w-4 h-4" />}
          />
          <input type="hidden" {...register('city')} />
          {errors.city && (
            <p className="text-red-500 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.city.message}
            </p>
          )}
        </div>
      </div>
      
      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          {t('category')} <span className="text-red-500">*</span>
        </label>
        <Select
          options={availableCategories.map(c => ({ label: c.itemLabel, value: c.itemValue }))}
          value={watch('category')}
          onChange={value => setValue('category', value, { shouldValidate: true })}
          placeholder={t('categoryPlaceholder')}
          icon={<LayoutGrid className="w-4 h-4" />}
        />
        <input type="hidden" {...register('category')} />
        {errors.category && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.category.message}
          </p>
        )}
      </div>

      {/* Dev Status */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          {t('devStatus')} <span className="text-red-500">*</span>
        </label>
        <Select
          options={availableDevStatuses.map(s => ({ label: s.itemLabel, value: s.itemValue }))}
          value={watch('devStatus')}
          onChange={value => setValue('devStatus', value, { shouldValidate: true })}
          placeholder={t('devStatusPlaceholder')}
          icon={<CheckCircle className="w-4 h-4" />}
        />
        <input type="hidden" {...register('devStatus')} />
        {errors.devStatus && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.devStatus.message}
          </p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-zinc-400" />
          作品来源 <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => {
            const isSelected = selectedTags.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  isSelected
                    ? 'bg-primary text-black border-primary'
                    : 'bg-zinc-900/50 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                }`}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
        <input type="hidden" {...register('tags')} />
        {errors.tags && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.tags.message}
          </p>
        )}
      </div>
    </div>
  )
}

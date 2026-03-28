'use client'

import { UseFormReturn, useFieldArray, Controller } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { AlertCircle, Plus, Trash2, Link as LinkIcon, FileText } from 'lucide-react'
import { Button } from '@/components/common/action-button'
import { RichTextEditor } from '@/app/[language]/submit/editor/RichTextEditor'
import { WorkFormValues } from '@/lib/work-form'

interface Step3Props {
  form: UseFormReturn<WorkFormValues>
}

export function Step3Content({ form }: Step3Props) {
  const t = useTranslations('Submit')
  const { register, control, formState: { errors } } = form

  const {
    fields: highlightFields,
    append: appendHighlight,
    remove: removeHighlight,
  } = useFieldArray({ control, name: 'highlights' })

  const {
    fields: scenarioFields,
    append: appendScenario,
    remove: removeScenario,
  } = useFieldArray({ control, name: 'scenarios' })

  const inputClass =
    'w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600'

  return (
    <div className="space-y-8">
      {/* Story */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-zinc-400" />
          {t('story')} <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-zinc-500">{t('storyDesc')}</p>
        <Controller
          name="story"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder={t('storyPlaceholder')}
              hasError={!!errors.story}
            />
          )}
        />
        {errors.story && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.story.message}
          </p>
        )}
      </div>

      {/* Highlights */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">
            {t('highlights')} <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-zinc-500">{t('highlightsDesc')}</span>
        </div>

        <div className="space-y-3">
          {highlightFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <input
                  {...register(`highlights.${index}.value` as const)}
                  className={inputClass}
                  placeholder={t('highlightPlaceholder', { index: index + 1 })}
                  maxLength={30}
                />
                {errors.highlights?.[index]?.value && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.highlights[index]?.value?.message}
                  </p>
                )}
              </div>
              {highlightFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHighlight(index)}
                  className="p-3 text-zinc-500 hover:text-red-500 transition-colors mt-0.5"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {highlightFields.length < 5 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendHighlight({ value: '' })}
            className="w-full border-dashed border-zinc-700 hover:border-primary hover:text-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('addHighlight')}
          </Button>
        )}

        {errors.highlights && !Array.isArray(errors.highlights) && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.highlights.message}
          </p>
        )}
      </div>

      {/* Scenarios */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300">
          {t('scenarios')} <span className="text-red-500">*</span>
        </label>

        <div className="space-y-3">
          {scenarioFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <input
                  {...register(`scenarios.${index}.value` as const)}
                  className={inputClass}
                  placeholder={t('scenarioPlaceholder', { index: index + 1 })}
                />
                {errors.scenarios?.[index]?.value && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.scenarios[index]?.value?.message}
                  </p>
                )}
              </div>
              {scenarioFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeScenario(index)}
                  className="p-3 text-zinc-500 hover:text-red-500 transition-colors mt-0.5"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendScenario({ value: '' })}
          className="w-full border-dashed border-zinc-700 hover:border-primary hover:text-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('addScenario')}
        </Button>

        {errors.scenarios && !Array.isArray(errors.scenarios) && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.scenarios.message}
          </p>
        )}
      </div>

      {/* Links */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
          <LinkIcon className="w-4 h-4 text-zinc-400" />
          {t('externalLinks')}
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              {t('demoUrl')}
            </label>
            <input
              {...register('demoUrl')}
              className={inputClass}
              placeholder="https://..."
              type="url"
            />
            {errors.demoUrl && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.demoUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{t('repoUrl')}</label>
            <input
              {...register('repoUrl')}
              className={inputClass}
              placeholder="https://github.com/..."
              type="url"
            />
            {errors.repoUrl && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.repoUrl.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

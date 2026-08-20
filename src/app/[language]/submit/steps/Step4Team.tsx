'use client'

import { UseFormReturn, useFieldArray } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { AlertCircle, Plus, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/common/action-button'
import { WorkFormValues } from '@/lib/work-form'

interface Step4Props {
  form: UseFormReturn<WorkFormValues>
}

export function Step4Team({ form }: Step4Props) {
  const t = useTranslations('Submit')
  const { register, control, formState: { errors } } = form

  const {
    fields: teamFields,
    append: appendTeam,
    remove: removeTeam,
  } = useFieldArray({ control, name: 'team' })

  const inputClass =
    'w-full px-4 py-3 rounded-lg border-b-2 border-input bg-muted text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground'

  return (
    <div className="space-y-8">
      {/* Team Members */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-zinc-400" />
          {t('team')} <span className="text-red-500">*</span>
        </label>

        <div className="space-y-3">
          {teamFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <input
                  {...register(`team.${index}.value` as const)}
                  className={inputClass}
                  placeholder={t('teamPlaceholder')}
                  maxLength={20}
                />
                <div className="flex justify-between items-center">
                  {errors.team?.[index]?.value ? (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.team[index]?.value?.message}
                    </p>
                  ) : <span />}
                  <span className="text-xs text-zinc-500">{form.watch(`team.${index}.value`)?.length || 0}/20</span>
                </div>
              </div>
              {teamFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTeam(index)}
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
          onClick={() => appendTeam({ value: '' })}
          className="w-full border-dashed border-zinc-700 hover:border-primary hover:text-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('addTeamMember')}
        </Button>

        {errors.team && !Array.isArray(errors.team) && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.team.message}
          </p>
        )}
      </div>

      {/* Team Intro */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          {t('teamIntro')} <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('teamIntro')}
          rows={4}
          className={inputClass}
          placeholder={t('teamIntroPlaceholder')}
          maxLength={500}
        />
        <div className="flex justify-between items-center">
          {errors.teamIntro ? (
            <p className="text-red-500 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.teamIntro.message}
            </p>
          ) : <span />}
          <span className="text-xs text-zinc-500">{form.watch('teamIntro')?.length || 0}/500</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">{t('contactPhone')}</label>
          <input
            {...register('contactPhone')}
            className={inputClass}
            placeholder={t('contactPhonePlaceholder')}
            type="tel"
            maxLength={20}
          />
          <span className="text-xs text-zinc-500 block text-right">{form.watch('contactPhone')?.length || 0}/20</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">{t('contactEmail')}</label>
          <input
            {...register('contactEmail')}
            className={inputClass}
            placeholder={t('contactEmailPlaceholder')}
            type="email"
            maxLength={100}
          />
          <div className="flex justify-between items-center">
            {errors.contactEmail ? (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.contactEmail.message}
              </p>
            ) : <span />}
            <span className="text-xs text-zinc-500">{form.watch('contactEmail')?.length || 0}/100</span>
          </div>
        </div>
      </div>
    </div>
  )
}

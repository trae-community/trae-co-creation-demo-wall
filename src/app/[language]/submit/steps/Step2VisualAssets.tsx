'use client'

import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { AlertCircle, UploadCloud, Plus, Trash2, Image as ImageIcon } from 'lucide-react'
import { SubmissionFormValues } from './Step1BasicInfo'

interface Step2Props {
  form: UseFormReturn<SubmissionFormValues>
  previewCoverUrl: string
  setPreviewCoverUrl: (url: string) => void
  previewScreenshots: string[]
  setPreviewScreenshots: (urls: string[]) => void
  uploadingCover: boolean
  uploadingScreenshots: boolean
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleScreenshotUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeScreenshot: (index: number) => void
}

export function Step2VisualAssets({
  form,
  previewCoverUrl,
  setPreviewCoverUrl,
  previewScreenshots,
  uploadingCover,
  uploadingScreenshots,
  handleImageUpload,
  handleScreenshotUpload,
  removeScreenshot,
}: Step2Props) {
  const t = useTranslations('Submit')
  const { register, setValue, formState: { errors } } = form

  return (
    <div className="space-y-8">
      {/* Cover Image */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-zinc-400" />
          {t('coverImageLabel')} <span className="text-red-500">*</span>
        </label>

        {!previewCoverUrl ? (
          <label
            htmlFor="cover-upload"
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer bg-zinc-900/50 transition-colors ${
              errors.coverUrl ? 'border-red-500/60' : 'border-zinc-700 hover:border-zinc-500'
            }`}
          >
            {uploadingCover ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-zinc-400">{t('uploading')}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                <UploadCloud className="w-10 h-10 text-zinc-500" />
                <p className="text-sm text-zinc-400">
                  <span className="font-semibold text-primary">{t('uploadClick')}</span>{' '}
                  {t('uploadDrag')}
                </p>
                <p className="text-xs text-zinc-500">{t('uploadFormat')}</p>
              </div>
            )}
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingCover}
            />
          </label>
        ) : (
          <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-700 group">
            <img
              src={previewCoverUrl}
              alt={t('coverPreviewAlt')}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setPreviewCoverUrl('')
                  setValue('coverUrl', '', { shouldValidate: true })
                }}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t('deleteImage')}
              </button>
            </div>
          </div>
        )}

        <input type="hidden" {...register('coverUrl')} />
        {errors.coverUrl && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.coverUrl.message}
          </p>
        )}
      </div>

      {/* Screenshots */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">
            {t('screenshotsLabel')} <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-zinc-500">
            {previewScreenshots.length}/5
          </span>
        </div>
        <p className="text-xs text-zinc-500">{t('screenshotsDesc')}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previewScreenshots.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-700"
            >
              <img
                src={url}
                alt={`Screenshot ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeScreenshot(index)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {previewScreenshots.length < 5 && (
            <label className="flex flex-col items-center justify-center aspect-video border-2 border-zinc-700 border-dashed rounded-xl cursor-pointer bg-zinc-900/50 hover:border-zinc-500 transition-colors">
              {uploadingScreenshots ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-7 h-7 text-zinc-500 mb-1" />
                  <span className="text-xs text-zinc-500">{t('addScreenshot')}</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleScreenshotUpload}
                disabled={uploadingScreenshots}
              />
            </label>
          )}
        </div>

        {errors.screenshots && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.screenshots.message}
          </p>
        )}
      </div>
    </div>
  )
}

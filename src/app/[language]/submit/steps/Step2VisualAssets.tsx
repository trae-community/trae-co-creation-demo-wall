'use client'

import { useCallback, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { AlertCircle, UploadCloud, Plus, Trash2, Image as ImageIcon, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkFormValues } from '@/lib/work-form'
import { cn } from '@/lib/utils'

const SUBMIT_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

function imageFilesFromDataTransfer(dataTransfer: DataTransfer): File[] {
  return Array.from(dataTransfer.files).filter(
    (f) => SUBMIT_IMAGE_TYPES.has(f.type) || f.type.startsWith('image/')
  )
}

function preventFileDragDefaults(e: React.DragEvent) {
  e.preventDefault()
  e.stopPropagation()
}

interface Step2Props {
  form: UseFormReturn<WorkFormValues>
  previewCoverUrl: string
  setPreviewCoverUrl: (url: string) => void
  previewScreenshots: string[]
  uploadingCover: boolean
  uploadingScreenshots: boolean
  uploadCoverFile: (file: File) => Promise<void>
  uploadScreenshotFiles: (files: File[]) => Promise<void>
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleScreenshotUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeScreenshot: (index: number) => void
  failedCoverFile?: File | null
  onRetryCover?: () => void
}

export function Step2VisualAssets({
  form,
  previewCoverUrl,
  setPreviewCoverUrl,
  previewScreenshots,
  uploadingCover,
  uploadingScreenshots,
  uploadCoverFile,
  uploadScreenshotFiles,
  handleImageUpload,
  handleScreenshotUpload,
  removeScreenshot,
  failedCoverFile,
  onRetryCover,
}: Step2Props) {
  const t = useTranslations('Submit')
  const { register, setValue, formState: { errors } } = form
  const [coverDragOver, setCoverDragOver] = useState(false)
  const [screenshotsDragOver, setScreenshotsDragOver] = useState(false)

  const onCoverDrop = useCallback(
    async (e: React.DragEvent) => {
      preventFileDragDefaults(e)
      setCoverDragOver(false)
      if (uploadingCover || previewCoverUrl) return
      const file = imageFilesFromDataTransfer(e.dataTransfer)[0]
      if (file) await uploadCoverFile(file)
    },
    [uploadCoverFile, uploadingCover, previewCoverUrl]
  )

  const onScreenshotsDrop = useCallback(
    async (e: React.DragEvent) => {
      preventFileDragDefaults(e)
      setScreenshotsDragOver(false)
      if (uploadingScreenshots || previewScreenshots.length >= 5) return
      const files = imageFilesFromDataTransfer(e.dataTransfer)
      const remaining = 5 - previewScreenshots.length
      if (files.length) await uploadScreenshotFiles(files.slice(0, remaining))
    },
    [uploadScreenshotFiles, uploadingScreenshots, previewScreenshots.length]
  )

  return (
    <div className="space-y-8">
      {/* Cover Image */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
          {t('coverImageLabel')} <span className="text-red-500">*</span>
        </label>

        {!previewCoverUrl ? (
          <label
            htmlFor="cover-upload"
            onDragEnter={(e) => {
              preventFileDragDefaults(e)
              if (!uploadingCover) setCoverDragOver(true)
            }}
            onDragOver={(e) => {
              preventFileDragDefaults(e)
              if (!uploadingCover) setCoverDragOver(true)
            }}
            onDragLeave={(e) => {
              preventFileDragDefaults(e)
              setCoverDragOver(false)
            }}
            onDrop={onCoverDrop}
            className={cn(
              'flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer bg-muted transition-colors',
              errors.coverUrl ? 'border-red-500/60' : 'border-border hover:border-muted-foreground/50',
              coverDragOver && 'border-primary bg-primary/5'
            )}
          >
            {uploadingCover ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">{t('uploading')}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-6 text-center pointer-events-none">
                <UploadCloud className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">{t('uploadClick')}</span>{' '}
                  {t('uploadDrag')}
                </p>
                <p className="text-xs text-muted-foreground">{t('uploadFormat')}</p>
              </div>
            )}
            <input
              id="cover-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingCover}
            />
          </label>
        ) : (
          <div className="relative w-full aspect-video bg-muted rounded-xl overflow-hidden border border-border group">
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
        {failedCoverFile && !uploadingCover && !previewCoverUrl && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm">
            <span className="text-muted-foreground truncate max-w-[200px]">{failedCoverFile.name}</span>
            <span className="text-red-400">{t('uploadError')}</span>
            {onRetryCover && (
              <Button type="button" variant="outline" size="sm" onClick={onRetryCover}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                {t('uploadRetry')}
              </Button>
            )}
          </div>
        )}
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
          <label className="text-sm font-medium text-foreground">
            {t('screenshotsLabel')} <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-muted-foreground">
            {previewScreenshots.length}/5
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{t('screenshotsDesc')}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previewScreenshots.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-video bg-muted rounded-xl overflow-hidden border border-border"
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
            <label
              onDragEnter={(e) => {
                preventFileDragDefaults(e)
                if (!uploadingScreenshots) setScreenshotsDragOver(true)
              }}
              onDragOver={(e) => {
                preventFileDragDefaults(e)
                if (!uploadingScreenshots) setScreenshotsDragOver(true)
              }}
              onDragLeave={(e) => {
                preventFileDragDefaults(e)
                setScreenshotsDragOver(false)
              }}
              onDrop={onScreenshotsDrop}
              className={cn(
                'flex flex-col items-center justify-center aspect-video border-2 border-border border-dashed rounded-xl cursor-pointer bg-muted hover:border-muted-foreground/50 transition-colors',
                screenshotsDragOver && 'border-primary bg-primary/5'
              )}
            >
              {uploadingScreenshots ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="flex flex-col items-center pointer-events-none">
                  <Plus className="w-7 h-7 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">{t('addScreenshot')}</span>
                  <span className="text-[10px] text-muted-foreground mt-1 px-2 text-center">
                    {t('uploadDrag')}
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
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

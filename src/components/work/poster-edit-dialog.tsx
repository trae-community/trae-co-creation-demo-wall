'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Upload, User, FileText, Link2, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PosterEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  poster: {
    id: string
    nickname: string
    description: string | null
    imageUrl: string
    demoUrl: string
  } | null
  onSuccess: () => void
}

export function PosterEditDialog({ open, onOpenChange, poster, onSuccess }: PosterEditDialogProps) {
  const t = useTranslations('PosterMaker')
  const tEdit = useTranslations('Posters')

  const [nickname, setNickname] = useState('')
  const [description, setDescription] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 回填数据
  useEffect(() => {
    if (poster) {
      setNickname(poster.nickname)
      setDescription(poster.description || '')
      setDemoUrl(poster.demoUrl)
      setImageUrl(poster.imageUrl)
      setError('')
    }
  }, [poster])

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError(t('fileTooLarge'))
      return
    }
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/file', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success && data.url) {
        setImageUrl(data.url)
      } else {
        setError(t('uploadFailed'))
      }
    } catch {
      setError(t('uploadFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (!poster || !nickname.trim() || !demoUrl.trim()) return
    setIsSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/posters/${poster.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          description: description.trim() || null,
          imageUrl,
          demoUrl: demoUrl.trim(),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        onOpenChange(false)
        onSuccess()
        // 如果审核被降级，提示用户（由父组件处理）
        if (data.downgraded) {
          // 降级提示通过 onSuccess 回调传递
        }
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || tEdit('editFailed'))
      }
    } catch {
      setError(tEdit('editFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border text-foreground p-4 sm:p-6 sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tEdit('editPoster')}</DialogTitle>
          <DialogDescription>{tEdit('editHint')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* 昵称 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
              <User className="w-4 h-4" />
              {t('nicknameLabel')} *
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-3 rounded-lg border-b-2 border-input bg-muted/60 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
              <FileText className="w-4 h-4" />
              {t('descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border-b-2 border-input bg-muted/60 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* 封面图片 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
              <ImageIcon className="w-4 h-4" />
              {t('imageLabel')}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all",
                imageUrl
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-input hover:border-green-500/30 hover:bg-accent"
              )}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                  <p className="text-xs text-muted-foreground">{t('uploading')}</p>
                </div>
              ) : imageUrl ? (
                <div className="relative">
                  <img src={imageUrl} alt="Preview" className="max-h-28 mx-auto rounded-lg" />
                  <p className="mt-1 text-xs text-muted-foreground">{tEdit('clickToReplace')}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 py-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{t('uploadClick')}</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                  e.target.value = ''
                }}
              />
            </div>
          </div>

          {/* Demo URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
              <Link2 className="w-4 h-4" />
              {t('demoUrlLabel')} *
            </label>
            <input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-b-2 border-input bg-muted/60 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {tEdit('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !nickname.trim() || !demoUrl.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {tEdit('saving')}
              </>
            ) : (
              tEdit('save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

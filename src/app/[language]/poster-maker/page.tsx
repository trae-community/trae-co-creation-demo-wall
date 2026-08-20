'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Upload, Download, Send, Loader2, Image as ImageIcon, Link2, User, FileText, Tag, Printer, ShieldCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/lib/language/navigation';
import { buildPosterDataUrl } from '@/lib/poster-svg';
import { Button } from '@/components/ui/button';

interface TagOption {
  id: number;
  name: string;
  isAutoAudit: boolean | null;
  auditStartTime: string | null;
  auditEndTime: string | null;
}

// 客户端预判标签当前是否处于有效自动过审期（与后端校验逻辑一致）
const isTagAutoAuditActive = (tag: TagOption): boolean => {
  if (!tag.isAutoAudit) return false;
  const now = Date.now();
  if (tag.auditStartTime && new Date(tag.auditStartTime).getTime() > now) return false;
  if (tag.auditEndTime && new Date(tag.auditEndTime).getTime() < now) return false;
  return true;
};

export default function PosterMakerPage() {
  const t = useTranslations('PosterMaker');
  const locale = useLocale();
  const router = useRouter();
  const { status } = useSession();

  // Form state
  const [nickname, setNickname] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poster preview state
  const [posterSvgUrl, setPosterSvgUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/sign-in`);
    }
  }, [status, router, locale]);

  // 加载可选标签
  useEffect(() => {
    fetch('/api/tags/all')
      .then(res => res.ok ? res.json() : [])
      .then((tags: TagOption[]) => setAvailableTags(Array.isArray(tags) ? tags : []))
      .catch(() => {});
  }, []);

  // 是否选中了有效自动过审标签（前端预判，用于提示文案）
  const hasAutoAuditTag = availableTags.some(
    tag => selectedTagIds.includes(tag.id) && isTagAutoAuditActive(tag)
  );

  // 生成海报 SVG 预览（复用共享合成库）
  const generatePosterPreview = useCallback(async () => {
    setIsGenerating(true);
    try {
      const url = await buildPosterDataUrl(imageUrl, {
        nickname,
        description,
        demoUrl,
        fallbackTitle: t('defaultTitle'),
        anonymousLabel: t('anonymous'),
        qrText: t('qrText'),
      });
      setPosterSvgUrl(url);
    } catch (err) {
      console.error('Poster preview generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [nickname, description, imageUrl, demoUrl, t]);

  // 表单变化时自动重新生成预览（防抖）
  useEffect(() => {
    if (!imageUrl && !nickname) return;
    const timer = setTimeout(() => {
      generatePosterPreview();
    }, 500);
    return () => clearTimeout(timer);
  }, [generatePosterPreview, imageUrl, nickname, description, demoUrl]);

  // 图片上传
  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: t('fileTooLarge') }));
      return;
    }

    setIsUploading(true);
    setErrors(prev => ({ ...prev, image: '' }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/file', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success && data.url) {
        setImageUrl(data.url);
      } else {
        setErrors(prev => ({ ...prev, image: t('uploadFailed') }));
      }
    } catch {
      setErrors(prev => ({ ...prev, image: t('uploadFailed') }));
    } finally {
      setIsUploading(false);
    }
  };

  // 表单验证
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!nickname.trim()) newErrors.nickname = t('nicknameRequired');
    if (!imageUrl) newErrors.image = t('imageRequired');
    if (!demoUrl.trim()) newErrors.demoUrl = t('urlRequired');
    if (selectedTagIds.length === 0) newErrors.tags = t('tagsRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交海报到橱窗
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSaving(true);
    setSubmitMessage('');
    try {
      const res = await fetch('/api/posters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          description: description.trim() || undefined,
          imageUrl,
          demoUrl: demoUrl.trim(),
          tagIds: selectedTagIds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaved(true);
        setSubmitMessage(data.autoApproved ? t('submitSuccessAuto') : t('submitSuccess'));
        setTimeout(() => setSaved(false), 3000);
      } else {
        setErrors(prev => ({ ...prev, save: t('submitFailed') }));
      }
    } catch {
      setErrors(prev => ({ ...prev, save: t('submitFailed') }));
    } finally {
      setIsSaving(false);
    }
  };

  // 打印海报（与分享卡片一致：A3 竖版新窗口打印）
  const handlePrint = () => {
    if (!posterSvgUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const title = nickname || t('defaultTitle');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - TRAE</title>
          <style>
            @page {
              size: A3 portrait;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f3f4f6;
            }
            img {
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
            }
            @media print {
              body {
                background: white;
              }
              img {
                max-width: none;
                max-height: none;
              }
            }
          </style>
        </head>
        <body>
          <img src="${posterSvgUrl}" alt="${title}" />
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 下载海报
  const handleDownload = async () => {
    if (!posterSvgUrl) return;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = posterSvgUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 1134;
      canvas.height = 1701;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, 1134, 1701);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `poster-${nickname || 'demo'}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      setErrors(prev => ({ ...prev, download: t('downloadFailed') }));
    }
  };

  if (status !== 'authenticated') return null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="text-center mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('title')}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ─── 左侧表单（提交页同款卡片容器） ─── */}
        <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-lg border border-border space-y-6">
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
              placeholder={t('nicknamePlaceholder')}
              maxLength={50}
              className="w-full px-4 py-3 rounded-lg border-b-2 border-input bg-muted text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground"
            />
            {errors.nickname && <p className="mt-1 text-xs text-red-400">{errors.nickname}</p>}
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
              placeholder={t('descriptionPlaceholder')}
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border-b-2 border-input bg-muted text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* 图片上传 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
              <ImageIcon className="w-4 h-4" />
              {t('imageLabel')} *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) handleImageUpload(file);
              }}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                imageUrl
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-input hover:border-green-500/30 hover:bg-accent"
              )}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                  <p className="text-sm text-muted-foreground">{t('uploading')}</p>
                </div>
              ) : imageUrl ? (
                <div className="relative">
                  <img src={imageUrl} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                  <p className="mt-2 text-xs text-green-400">已上传 ✓</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('uploadClick')}</p>
                  <p className="text-xs text-muted-foreground">{t('uploadHint')}</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = '';
                }}
              />
            </div>
            {errors.image && <p className="mt-1 text-xs text-red-400">{errors.image}</p>}
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
              placeholder={t('demoUrlPlaceholder')}
              className="w-full px-4 py-3 rounded-lg border-b-2 border-input bg-muted text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('demoUrlHint')}</p>
            {errors.demoUrl && <p className="mt-1 text-xs text-red-400">{errors.demoUrl}</p>}
          </div>

          {/* 标签选择 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
              <Tag className="w-4 h-4" />
              {t('tagsLabel')} *
            </label>
            {availableTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  const isAutoActive = isTagAutoAuditActive(tag);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setSelectedTagIds(prev =>
                        isSelected ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                      )}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        isSelected
                          ? "bg-green-500/20 border-green-500/50 text-green-400"
                          : "bg-input border-input text-muted-foreground hover:border-ring hover:text-foreground"
                      )}
                    >
                      {tag.name}
                      {isAutoActive && (
                        <span className="ml-1 inline-flex items-center gap-0.5 text-green-400">
                          <ShieldCheck className="w-3 h-3" />
                          {t('autoAuditBadge')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t('noTags')}</p>
            )}
            {hasAutoAuditTag ? (
              <p className="mt-1.5 text-xs text-green-400">{t('autoApprovedHint')}</p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">{t('submitHint')}</p>
            )}
            {errors.tags && <p className="mt-1 text-xs text-red-400">{errors.tags}</p>}
          </div>

          {/* 提交成功提示 */}
          {submitMessage && (
            <div className={cn(
              "p-3 rounded-xl text-sm border",
              hasAutoAuditTag
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-muted border-border text-foreground"
            )}>
              <p>{submitMessage}</p>
              <Link href="/posters" className="mt-2 inline-flex items-center gap-1 text-green-400 hover:text-green-300 font-medium transition-colors">
                {t('viewGallery')}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* 操作按钮（统一使用 Button 组件） */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className={cn("flex-1 h-11 rounded-md", saved && "bg-green-500 text-black hover:bg-green-500")}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('submitting')}
                </>
              ) : saved ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {t('submitted')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('submit')}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={!posterSvgUrl}
              className="h-11 rounded-md"
            >
              <Printer className="w-4 h-4" />
              {t('print')}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!posterSvgUrl}
              className="h-11 rounded-md"
            >
              <Download className="w-4 h-4" />
              {t('download')}
            </Button>
          </div>
          {errors.save && <p className="text-xs text-red-400">{errors.save}</p>}
        </div>

        {/* ─── 右侧预览（同款卡片容器） ─── */}
        <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-lg border border-border flex flex-col items-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 self-start">{t('previewTitle')}</h3>
          <div
            className="relative w-full max-w-[340px] rounded-2xl overflow-hidden border border-border"
            style={{ aspectRatio: '283.46 / 425.2' }}
          >
            {isGenerating ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
              </div>
            ) : null}

            {posterSvgUrl ? (
              <img
                src={posterSvgUrl}
                alt="Poster Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card">
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground px-4 text-center">{t('uploadToPreview')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

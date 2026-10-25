'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/language/navigation'
import { Button } from '@/components/ui/button'

export default function LanguageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('ErrorPage')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-foreground mb-2">{t('title')}</h1>
      <p className="text-muted-foreground text-sm max-w-md mb-2">{t('description')}</p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/80 font-mono mb-8 max-w-md break-all">
          {error.digest}
        </p>
      )}
      {!error.digest && <div className="mb-8" />}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button type="button" onClick={() => reset()}>
          {t('retry')}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">{t('home')}</Link>
        </Button>
      </div>
    </div>
  )
}

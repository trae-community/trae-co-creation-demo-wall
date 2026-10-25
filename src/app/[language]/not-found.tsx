'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/language/navigation'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  const t = useTranslations('NotFound')

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6 border border-border">
        <FileQuestion className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-mono text-muted-foreground mb-2">404</p>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t('title')}</h1>
      <p className="text-muted-foreground text-sm max-w-md mb-8">{t('description')}</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button variant="outline" asChild>
          <Link href="/">{t('home')}</Link>
        </Button>
        <Button asChild>
          <Link href="/rankings">{t('browse')}</Link>
        </Button>
      </div>
    </div>
  )
}

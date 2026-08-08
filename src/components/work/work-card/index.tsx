'use client'

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/language/navigation';
import { WorkCover } from './work-cover';
import { WorkMeta } from './work-meta';
import { WorkFooter } from './work-footer';
import type { Work } from '@/lib/types';

interface WorkCardProps {
  work: Work;
}

export function WorkCard({ work }: WorkCardProps) {
  const t = useTranslations('Card');
  
  const currentListHref = (() => {
    // Preserve URL params (searchQuery, date, filters) when navigating to detail
    const urlParams = new URLSearchParams(window.location.search);
    const params = urlParams.toString();
    return params ? `/works/${work.id}?${params}` : `/works/${work.id}`;
  })();

  return (
    <Link
      href={currentListHref}
      className="group flex h-full flex-col rounded-2xl overflow-hidden border border-white/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_32px_rgba(50,240,140,0.2)] hover:border-green-500/35"
      style={{ background: '#111318' }}
    >
      {/* Cover */}
      <WorkCover
        coverUrl={work.coverUrl}
        honors={work.honors || null}
        category={work.category}
        href={currentListHref}
      />

      {/* Hover overlay with CTA */}
      <div 
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      >
        <span className="text-white text-sm font-medium flex items-center gap-1.5">
          {t('viewDetails')}
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>

      {/* Content */}
      <WorkMeta
        title={work.name}
        intro={work.intro}
        tags={work.tags || []}
      />

      {/* Footer: author + time/city + stats */}
      <WorkFooter
        author={{ 
          id: work.author?.id || '',
          name: work.author?.name,
          avatar: work.author?.avatar
        }}
        team={work.team}
        city={work.city}
        createdAt={work.createdAt}
        views={work.views}
        likes={work.likes}
      />
    </Link>
  );
}

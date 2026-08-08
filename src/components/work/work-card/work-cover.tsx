'use client'

import { Award } from 'lucide-react';
import { Link } from '@/lib/language/navigation';

interface WorkCoverProps {
  coverUrl?: string | null;
  title?: string;
  honors?: string[] | null;
  category?: string | null;
  href: string;
  aspectRatio?: '4/3' | '16/9' | 'square';
}

export function WorkCover({ 
  coverUrl, 
  honors, 
  category, 
  href,
  aspectRatio = '4/3'
}: WorkCoverProps) {
  const hasHonors = (honors || []).length > 0;
  
  const aspectClass = {
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
    'square': 'aspect-square',
  }[aspectRatio];

  return (
    <div className={`relative overflow-hidden ${aspectClass}`}>
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.dataset.fallback) return;
            img.dataset.fallback = '1';
            img.src = '/images/work-placeholder.svg';
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
          <span className="text-zinc-600 text-sm">No cover</span>
        </div>
      )}

      {/* Honor badges — top left */}
      {hasHonors && (
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {(honors || []).map((honor) => (
            <span
              key={honor}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-amber-950 border border-amber-300/60 shadow-[0_0_10px_rgba(245,158,11,0.35)]"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              <Award className="w-3 h-3" />
              {honor}
            </span>
          ))}
        </div>
      )}

      {/* Category pill — bottom right */}
      {category && (
        <div className="absolute bottom-3 right-3">
          <span 
            className="px-2 py-0.5 rounded-md text-xs text-zinc-300 border border-white/10 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            {category}
          </span>
        </div>
      )}
    </div>
  );
}

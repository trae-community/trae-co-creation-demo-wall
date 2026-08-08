'use client'

interface WorkMetaProps {
  title: string;
  intro?: string | null;
  tags?: string[];
}

export function WorkMeta({ 
  title, 
  intro,
  tags = []
}: WorkMetaProps) {
  // Show at most 3 tags, prioritise "special" ones (已上线, 开源, 持续更新)
  const specialTags = tags.filter(tag => ["已上线", "开源", "持续更新"].includes(tag));
  const otherTags = tags.filter(tag => !["已上线", "开源", "持续更新"].includes(tag));
  const displayTags = [...specialTags, ...otherTags].slice(0, 3);

  return (
    <div className="flex min-w-0 flex-1 flex-col p-5">
      <div className="min-w-0">
        <h3 className="font-bold text-white text-base mb-1.5 line-clamp-1 group-hover:text-green-400 transition-colors [overflow-wrap:anywhere]">
          {title}
        </h3>
        {intro && (
          <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 mb-4 [overflow-wrap:anywhere]">
            {intro}
          </p>
        )}
      </div>

      {/* Tags */}
      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {displayTags.map((tag) => {
            const isSpecial = ["已上线", "开源", "持续更新"].includes(tag);
            return (
              <span
                key={tag}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  isSpecial
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : "bg-white/5 text-zinc-600 border-white/10"
                }`}
              >
                {tag}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client'

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";

export interface FilterState {
  cities: string[];
  categories: string[];
  tags: string[];
  countries: string[];
  honors: string[];
  auditStatuses: string[];
}

interface CityFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  auditStatusOptions?: FilterOption[];
  /** 是否显示重置按钮（统一筛选交互） */
  showReset?: boolean;
  /** 搜索词（用于判断重置按钮是否显示，可选） */
  searchTerm?: string;
  /** 重置回调：清空搜索词等外部状态 */
  onReset?: () => void;
}

type FilterOption = {
  label: string;
  value: string;
  parentValue?: string;
};

const Pill = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap border transition-all duration-200 shrink-0 active:scale-95",
      active
        ? "bg-gradient-to-r from-[#32F08C] to-[#17D479] text-black font-bold border-transparent shadow-[0_0_12px_rgba(50,240,140,0.25)]"
        : "bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground"
    )}
  >
    {children}
  </button>
);

export function CityFilter({ filters, onFilterChange, auditStatusOptions, showReset, searchTerm, onReset }: CityFilterProps) {
  const t = useTranslations('Filter');
  const locale = useLocale();
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [countries, setCountries] = useState<FilterOption[]>([]);
  const [cities, setCities] = useState<FilterOption[]>([]);
  const [honors, setHonors] = useState<FilterOption[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadFilterOptions = async () => {
      const apiLang = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : locale;
      try {
        // 使用新 API 获取有作品的筛选选项
        const res = await fetch(`/api/works/filter-options?lang=${apiLang}`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
          setCountries(data.countries || []);
          setCities(data.cities || []);
          setHonors(data.honors || []);
        } else {
          console.error('Failed to load filter options');
        }
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadFilterOptions();
  }, [locale]);

  const toggleFilter = (type: keyof FilterState, value: string) => {
    const currentValues = filters[type];
    const newValues = currentValues.includes(value) ? [] : [value];
    const newFilters = { ...filters, [type]: newValues };
    if (type === 'countries') newFilters.cities = [];
    onFilterChange(newFilters);
  };

  const handleClear = (type: keyof FilterState) => {
    const newFilters = { ...filters, [type]: [] };
    if (type === 'countries') newFilters.cities = [];
    onFilterChange(newFilters);
  };

  const availableCities = useMemo(() => {
    if (filters.countries.length === 0) return [];
    return cities.filter(city => city.parentValue && filters.countries.includes(city.parentValue));
  }, [filters.countries, cities]);

  const FilterRow = ({
    label,
    items,
    type,
    selected,
  }: {
    label: string;
    items: FilterOption[];
    type: keyof FilterState;
    selected: string[];
  }) => (
    <div className="flex items-start gap-3 pb-0.5">
      <span className="text-xs text-muted-foreground font-medium w-10 shrink-0 select-none mt-2">{label}</span>
      <div className="flex flex-wrap gap-2">
        <Pill active={selected.length === 0} onClick={() => handleClear(type)}>
          {t('all')}
        </Pill>
        {items.map((item) => (
          <Pill
            key={item.value}
            active={selected.includes(item.value)}
            onClick={() => toggleFilter(type, item.value)}
          >
            {item.label}
          </Pill>
        ))}
      </div>
    </div>
  );

  const activeFilterCount = filters.categories.length + filters.countries.length + filters.cities.length + filters.honors.length + filters.auditStatuses.length;
  const hasActiveFilters = activeFilterCount > 0 || !!(searchTerm && searchTerm.length > 0);

  const handleReset = () => {
    onFilterChange({ cities: [], categories: [], tags: [], countries: [], honors: [], auditStatuses: [] });
    if (onReset) onReset();
  };

  return (
    <div className="space-y-2.5">
      {/* Mobile: Collapsible Filter Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="lg:hidden flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-border bg-muted hover:bg-muted/80 transition-all"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter className="w-4 h-4" />
          {t('filters') || '筛选'}
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
              {activeFilterCount}
            </span>
          )}
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {/* Desktop: Always visible / Mobile: Collapsible */}
      <div className={cn("space-y-2.5", !isExpanded && "hidden lg:block")}>
        {auditStatusOptions && auditStatusOptions.length > 0 && (
          <FilterRow label={t('auditStatus')} items={auditStatusOptions} type="auditStatuses" selected={filters.auditStatuses} />
        )}
        <FilterRow label={t('type')} items={categories} type="categories" selected={filters.categories} />
        {honors.length > 0 && (
          <FilterRow label={t('honor')} items={honors} type="honors" selected={filters.honors} />
        )}
        <FilterRow label={t('country')} items={countries} type="countries" selected={filters.countries} />
        {filters.countries.length > 0 && (
          <FilterRow label={t('city')} items={availableCities} type="cities" selected={filters.cities} />
        )}
        {/* 重置行：作为筛选区的最后一行，与 FilterRow 布局一致，保证一体性 */}
        {showReset && hasActiveFilters && (
          <div className="flex items-center gap-3 pt-1">
            <span className="w-10 shrink-0 select-none" />
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap border transition-all duration-200 bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
              {t('reset') || '重置筛选'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

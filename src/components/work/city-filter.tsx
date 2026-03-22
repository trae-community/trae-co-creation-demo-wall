'use client'

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from 'next-intl';
import { DictionaryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface FilterState {
  cities: string[];
  categories: string[];
  tags: string[];
  countries: string[];
}

interface CityFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

type FilterOption = {
  label: string;
  value: string;
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
      "px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap border transition-all duration-200 shrink-0",
      active
        ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-black font-bold border-transparent shadow-[0_0_12px_rgba(34,197,94,0.25)]"
        : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white"
    )}
  >
    {children}
  </button>
);

export function CityFilter({ filters, onFilterChange }: CityFilterProps) {
  const t = useTranslations('Filter');
  const locale = useLocale();
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [countries, setCountries] = useState<FilterOption[]>([]);
  const [cities, setCities] = useState<FilterOption[]>([]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      const apiLang = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : locale;
      try {
        const [categoryRes, countryRes, cityRes] = await Promise.all([
          fetch(`/api/dictionaries?code=category_code&lang=${apiLang}`),
          fetch(`/api/dictionaries?code=country&lang=${apiLang}`),
          fetch(`/api/dictionaries?code=city&lang=${apiLang}`)
        ]);
        const [categoryData, countryData, cityData] = await Promise.all([
          categoryRes.ok ? categoryRes.json() : null,
          countryRes.ok ? countryRes.json() : null,
          cityRes.ok ? cityRes.json() : null
        ]);
        setCategories(((categoryData?.items as DictionaryItem[] | undefined) || []).map(item => ({ label: item.itemLabel, value: item.itemValue })));
        setCountries(((countryData?.items as DictionaryItem[] | undefined) || []).map(item => ({ label: item.itemLabel, value: item.itemValue })));
        setCities(((cityData?.items as DictionaryItem[] | undefined) || []).map(item => ({ label: item.itemLabel, value: item.itemValue })));
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

  const availableCities = useMemo(
    () => (filters.countries.length > 0 ? cities : []),
    [filters.countries.length, cities]
  );

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
    <div className="flex items-center gap-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
      <span className="text-xs text-zinc-500 font-medium w-10 shrink-0 select-none">{label}</span>
      <div className="flex gap-1.5 flex-nowrap">
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

  return (
    <div className="space-y-2.5">
      <FilterRow label={t('type')} items={categories} type="categories" selected={filters.categories} />
      <FilterRow label={t('country')} items={countries} type="countries" selected={filters.countries} />
      {filters.countries.length > 0 && (
        <FilterRow label={t('city')} items={availableCities} type="cities" selected={filters.cities} />
      )}
    </div>
  );
}

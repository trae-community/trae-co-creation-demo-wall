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
    
    // Single select logic
    const newValues = currentValues.includes(value) ? [] : [value];

    const newFilters = {
      ...filters,
      [type]: newValues,
    };

    if (type === 'countries') {
      newFilters.cities = [];
    }

    onFilterChange(newFilters);
  };

  const handleClear = (type: keyof FilterState) => {
    const newFilters = { ...filters, [type]: [] };
    if (type === 'countries') {
      newFilters.cities = [];
    }
    onFilterChange(newFilters);
  };

  const renderFilterSection = (
    title: string,
    items: FilterOption[],
    type: keyof FilterState,
    selectedItems: string[]
  ) => (
    <div className="flex flex-col gap-3">
      <h3 className="text-white font-medium text-sm">{title}</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleClear(type)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
            selectedItems.length === 0
              ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-black shadow-[0_0_15px_rgba(34,197,94,0.3)] border border-transparent font-bold"
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10 backdrop-blur-sm"
          )}
        >
          {t('all')}
        </button>
        {items.map((item) => (
          <button
            key={item.value}
            onClick={() => toggleFilter(type, item.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
              selectedItems.includes(item.value)
                ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-black shadow-[0_0_15px_rgba(34,197,94,0.3)] border border-transparent font-bold"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10 backdrop-blur-sm"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  const availableCities = useMemo(
    () => (filters.countries.length > 0 ? cities : []),
    [filters.countries.length, cities]
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {renderFilterSection(t('type'), categories, "categories", filters.categories)}
      {renderFilterSection(t('country'), countries, "countries", filters.countries)}
      {filters.countries.length > 0 && renderFilterSection(t('city'), availableCities, "cities", filters.cities)}
    </div>
  );
}

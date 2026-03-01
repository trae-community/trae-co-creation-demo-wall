'use client'

import { CATEGORIES, COUNTRIES, COUNTRY_CITY_MAP } from "../types";
import { cn } from "../lib/utils";
import { useTranslations } from 'next-intl';

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

export function CityFilter({ filters, onFilterChange }: CityFilterProps) {
  const t = useTranslations('Filter');

  const toggleFilter = (type: keyof FilterState, value: string) => {
    const currentValues = filters[type];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    const newFilters = {
      ...filters,
      [type]: newValues,
    };

    if (type === 'countries') {
      if (newValues.length === 0) {
        newFilters.cities = [];
      } else {
        const validCities = newValues.flatMap((c) => COUNTRY_CITY_MAP[c] || []);
        newFilters.cities = filters.cities.filter((city) => validCities.includes(city));
      }
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
    items: string[],
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
            key={item}
            onClick={() => toggleFilter(type, item)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
              selectedItems.includes(item)
                ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-black shadow-[0_0_15px_rgba(34,197,94,0.3)] border border-transparent font-bold"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10 backdrop-blur-sm"
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  const availableCities = filters.countries.length > 0
    ? filters.countries.flatMap((country) => COUNTRY_CITY_MAP[country] || [])
    : [];

  return (
    <div className="flex flex-col gap-6 w-full">
      {renderFilterSection(t('type'), CATEGORIES, "categories", filters.categories)}
      {renderFilterSection(t('country'), COUNTRIES, "countries", filters.countries)}
      {filters.countries.length > 0 && renderFilterSection(t('city'), availableCities, "cities", filters.cities)}
    </div>
  );
}

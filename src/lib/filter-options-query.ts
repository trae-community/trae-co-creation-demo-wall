import { prisma } from '@/lib/prisma';
import { getCachedRawDictionaries } from '@/lib/dict-cache';
import { sortFilterOptions } from '@/lib/sort-filter-options';

interface DictItem {
  id: string;
  dictCode: string;
  itemLabel: string;
  itemValue: string;
  labelI18n: Record<string, string> | null;
  parentValue: string | null;
  sortOrder: number;
  status: boolean;
}

const visibleWorksWhere = {
  statistic: {
    auditStatus: 1,
    displayStatus: 1,
  },
};

export type WorkFilterOptionsResponse = {
  countries: Array<{ label: string; value: string }>;
  cities: Array<{ label: string; value: string; parentValue: string | null }>;
  categories: Array<{ label: string; value: string }>;
  honors: Array<{ label: string; value: string }>;
};

export async function buildWorkFilterOptions(
  lang: string
): Promise<WorkFilterOptionsResponse> {
  const [cityRows, countryRows, { countryDict, cityDict, categoryDict, honorDict }] =
    await Promise.all([
      prisma.workBase.findMany({
        where: { ...visibleWorksWhere, cityCode: { not: null } },
        select: { cityCode: true },
        distinct: ['cityCode'],
      }),
      prisma.workBase.findMany({
        where: { ...visibleWorksWhere, countryCode: { not: null } },
        select: { countryCode: true },
        distinct: ['countryCode'],
      }),
      getCachedRawDictionaries(),
    ]);

  const citiesWithWorks = new Set(
    cityRows.map((row) => row.cityCode).filter(Boolean) as string[]
  );
  const countriesWithWorks = new Set(
    countryRows.map((row) => row.countryCode).filter(Boolean) as string[]
  );

  const resolveLabel = (item: DictItem) => {
    let label = item.itemLabel;
    if (item.labelI18n && typeof item.labelI18n === 'object') {
      const i18n = item.labelI18n as Record<string, string>;
      if (i18n[lang]) {
        label = i18n[lang];
      }
    }
    return label;
  };

  const honorItemIds = await prisma.workHonor.findMany({
    where: { work: { statistic: { auditStatus: 1, displayStatus: 1 } } },
    select: { honorItemId: true },
    distinct: ['honorItemId'],
  });
  const honorsWithWorks = new Set(honorItemIds.map((h) => h.honorItemId.toString()));

  const countries = (countryDict?.items || [])
    .filter((item: DictItem) => countriesWithWorks.has(item.itemValue))
    .map((item: DictItem) => ({
      label: resolveLabel(item),
      value: item.itemValue,
      sortOrder: item.sortOrder,
    }));

  const cities = (cityDict?.items || [])
    .filter((item: DictItem) => citiesWithWorks.has(item.itemValue))
    .map((item: DictItem) => ({
      label: resolveLabel(item),
      value: item.itemValue,
      parentValue: item.parentValue,
      sortOrder: item.sortOrder,
    }));

  const categories = (categoryDict?.items || []).map((item: DictItem) => ({
    label: resolveLabel(item),
    value: item.itemValue,
    sortOrder: item.sortOrder,
  }));

  const honors = (honorDict?.items || [])
    .filter((item: DictItem) => honorsWithWorks.has(item.id))
    .map((item: DictItem) => ({
      label: resolveLabel(item),
      value: item.itemValue,
      sortOrder: item.sortOrder,
    }));

  return {
    countries: sortFilterOptions(countries, lang).map(
      ({ sortOrder: _sortOrder, ...item }) => item
    ),
    cities: sortFilterOptions(cities, lang).map(
      ({ sortOrder: _sortOrder, ...item }) => item
    ),
    categories: sortFilterOptions(categories, lang).map(
      ({ sortOrder: _sortOrder, ...item }) => item
    ),
    honors: sortFilterOptions(honors, lang).map(
      ({ sortOrder: _sortOrder, ...item }) => item
    ),
  };
}

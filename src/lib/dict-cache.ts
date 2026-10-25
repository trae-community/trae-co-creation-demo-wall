import { prisma } from '@/lib/prisma';

export type SerializedDict = {
  id: string;
  dictCode: string;
  items: Array<{
    id: string;
    itemValue: string;
    itemLabel: string;
    labelI18n: unknown;
    parentValue: string | null;
    sortOrder: number;
    status: boolean;
  }>;
} | null;

export type RawDictionaries = {
  countryDict: SerializedDict;
  cityDict: SerializedDict;
  categoryDict: SerializedDict;
  honorDict: SerializedDict;
};

const TTL_MS = Number(process.env.DICT_CACHE_TTL_MS || 60_000);

let cache: { expiresAt: number; data: RawDictionaries } | null = null;

const serialize = (obj: unknown) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

async function loadRawDictionaries(): Promise<RawDictionaries> {
  const [countryDict, cityDict, categoryDict, honorDict] = await Promise.all([
    prisma.sysDict.findUnique({ where: { dictCode: 'country' }, include: { items: true } }),
    prisma.sysDict.findUnique({ where: { dictCode: 'city' }, include: { items: true } }),
    prisma.sysDict.findUnique({ where: { dictCode: 'category_code' }, include: { items: true } }),
    prisma.sysDict.findUnique({ where: { dictCode: 'honor_type' }, include: { items: true } }),
  ]);

  return {
    countryDict: serialize(countryDict),
    cityDict: serialize(cityDict),
    categoryDict: serialize(categoryDict),
    honorDict: serialize(honorDict),
  };
}

/** 字典读多写少，短 TTL 内存缓存，减少列表/筛选项重复查库 */
export async function getCachedRawDictionaries(): Promise<RawDictionaries> {
  const now = Date.now();
  if (cache && now < cache.expiresAt) {
    return cache.data;
  }
  const data = await loadRawDictionaries();
  cache = { data, expiresAt: now + TTL_MS };
  return data;
}

export function invalidateDictCache() {
  cache = null;
}

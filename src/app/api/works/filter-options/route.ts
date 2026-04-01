import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDictionaries } from '@/lib/edge-config';

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

async function getRawDictionaries() {
  const cached = await getDictionaries();
  if (cached) return cached as any;

  const [countryDict, cityDict, categoryDict] = await Promise.all([
    prisma.sysDict.findUnique({ where: { dictCode: 'country' }, include: { items: true } }),
    prisma.sysDict.findUnique({ where: { dictCode: 'city' }, include: { items: true } }),
    prisma.sysDict.findUnique({ where: { dictCode: 'category_code' }, include: { items: true } }),
  ]);

  const serialize = (obj: unknown) =>
    JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

  return {
    countryDict: serialize(countryDict),
    cityDict: serialize(cityDict),
    categoryDict: serialize(categoryDict),
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'zh-CN';

    // 获取所有已审核且可见的作品的城市和国家代码
    const worksWithLocation = await prisma.workBase.findMany({
      where: {
        statistic: {
          auditStatus: 1,
          displayStatus: 1
        }
      },
      select: {
        cityCode: true,
        countryCode: true,
      }
    });

    // 提取有作品的城市和国家代码集合
    const citiesWithWorks = new Set<string>();
    const countriesWithWorks = new Set<string>();

    worksWithLocation.forEach(work => {
      if (work.cityCode) citiesWithWorks.add(work.cityCode);
      if (work.countryCode) countriesWithWorks.add(work.countryCode);
    });

    // 获取字典数据
    const { countryDict, cityDict, categoryDict } = await getRawDictionaries();

    // 解析标签
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

    // 过滤出有作品的省份
    const countries = (countryDict?.items || [])
      .filter((item: DictItem) => countriesWithWorks.has(item.itemValue))
      .map((item: DictItem) => ({
        label: resolveLabel(item),
        value: item.itemValue,
      }))
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label, lang));

    // 过滤出有作品的城市
    const cities = (cityDict?.items || [])
      .filter((item: DictItem) => citiesWithWorks.has(item.itemValue))
      .map((item: DictItem) => ({
        label: resolveLabel(item),
        value: item.itemValue,
        parentValue: item.parentValue,
      }))
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label, lang));

    // 分类不需要过滤
    const categories = (categoryDict?.items || [])
      .map((item: DictItem) => ({
        label: resolveLabel(item),
        value: item.itemValue,
      }))
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label, lang));

    return NextResponse.json({
      countries,
      cities,
      categories,
    });

  } catch (error) {
    console.error('Failed to fetch filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}

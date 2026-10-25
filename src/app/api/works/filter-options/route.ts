import { NextResponse } from 'next/server';
import { getCachedWorkFilterOptions } from '@/lib/filter-options-cache';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'zh-CN';

    const body = await getCachedWorkFilterOptions(lang);

    return NextResponse.json(body);
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}

import { TimedMemoryCache } from '@/lib/timed-memory-cache';
import {
  buildWorkFilterOptions,
  type WorkFilterOptionsResponse,
} from '@/lib/filter-options-query';

const TTL_MS = Number(process.env.FILTER_OPTIONS_CACHE_TTL_MS || 60_000);

const responseCache = new TimedMemoryCache<WorkFilterOptionsResponse>(TTL_MS);

export async function getCachedWorkFilterOptions(
  lang: string
): Promise<WorkFilterOptionsResponse> {
  const key = lang || 'zh-CN';
  const hit = responseCache.get(key);
  if (hit) return hit;

  const data = await buildWorkFilterOptions(key);
  responseCache.set(key, data);
  return data;
}

export function invalidateWorkFilterOptionsCache(lang?: string) {
  if (lang) {
    responseCache.delete(lang);
  } else {
    responseCache.clear();
  }
}

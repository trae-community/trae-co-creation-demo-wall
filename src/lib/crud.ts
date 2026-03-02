export const CRUD_QUERY_PARAMS = {
  page: 'page',
  pageSize: 'pageSize',
  query: 'query',
  filter: 'filter',
} as const

export const DICT_FILTERS = ['all', 'system', 'custom'] as const
export type DictFilter = (typeof DICT_FILTERS)[number]

export const TAG_FILTERS = ['all', 'auto', 'manual'] as const
export type TagFilter = (typeof TAG_FILTERS)[number]

export const normalizeFilter = <T extends readonly string[]>(
  value: string | null,
  options: T,
  fallback: T[number]
) => {
  if (!value) return fallback
  return (options as readonly string[]).includes(value) ? (value as T[number]) : fallback
}

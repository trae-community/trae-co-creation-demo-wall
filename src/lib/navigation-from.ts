/** 深链回跳：为站内路径附加 `from` 查询参数 */
export function hrefWithFrom(path: string, from?: string | null): string {
  if (!from || !from.startsWith('/')) return path
  const [base, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  params.set('from', from)
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

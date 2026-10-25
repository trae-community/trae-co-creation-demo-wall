/** YYYY-MM-DD calendar day bounds (UTC+8), aligned with DatePicker local calendar in CN. */
export function createdAtDayRange(date: string): { start: Date; end: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const start = new Date(`${date}T00:00:00+08:00`)
  const end = new Date(`${date}T23:59:59.999+08:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  return { start, end }
}

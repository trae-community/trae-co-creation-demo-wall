/** 控制台横向列表卡片（作品/海报管理等）防低分辨率横向溢出 */
export const consoleListCardOuterRowClass = 'flex min-w-0 max-w-full'
export const consoleListCardMediaRowClass = 'flex flex-1 flex-col sm:flex-row min-w-0 max-w-full'
export const consoleListCardBodyClass =
  'flex-1 p-4 flex flex-col justify-between gap-4 min-w-0 max-w-full overflow-hidden'
export const consoleListCardMetaRowClass =
  'flex flex-wrap items-center gap-2 pt-3 border-t border-border/50 min-w-0 max-w-full'
/** 长标签/荣誉名在窄屏下换行，避免撑破卡片宽度 */
export const consoleMetaBadgeClass =
  'max-w-full min-w-0 whitespace-normal break-words text-left shrink [&_svg]:shrink-0'

/** 操作日志 module / action 展示（与 writeOperationLog 的 module 字段一致） */

const MODULE_ZH: Record<string, string> = {
  work: '作品互动',
  works: '作品管理',
  users: '用户管理',
  dictionary: '字典管理',
  tags: '标签管理',
  submit: '作品提交',
  poster: '海报管理',
  profile: '个人中心',
  code_blind_box: '盲盒管理',
}

const MODULE_EN: Record<string, string> = {
  work: 'Work engagement',
  works: 'Works admin',
  users: 'Users',
  dictionary: 'Dictionaries',
  tags: 'Tags',
  submit: 'Submission',
  poster: 'Posters',
  profile: 'Profile',
  code_blind_box: 'Blind box',
}

const MODULE_JA: Record<string, string> = {
  work: '作品インタラクション',
  works: '作品管理',
  users: 'ユーザー管理',
  dictionary: '辞書',
  tags: 'タグ',
  submit: '作品投稿',
  poster: 'ポスター',
  profile: 'プロフィール',
  code_blind_box: 'ブラインドボックス',
}

const ACTION_ZH: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  like: '点赞',
  unlike: '取消点赞',
  view: '浏览',
  audit: '审核',
  ban: '封禁',
  unban: '解封',
  create_work: '提交作品',
  auto_audit: '自动审核',
  update_avatar: '更新头像',
  reset_draw: '重置抽卡',
  purge_banned_likes: '剔除封禁用户赞',
}

const ACTION_EN: Record<string, string> = {
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  like: 'Like',
  unlike: 'Unlike',
  view: 'View',
  audit: 'Audit',
  ban: 'Ban',
  unban: 'Unban',
  create_work: 'Submit work',
  auto_audit: 'Auto audit',
  update_avatar: 'Update avatar',
  reset_draw: 'Reset draw',
  purge_banned_likes: 'Purge likes from banned users',
}

const ACTION_JA: Record<string, string> = {
  create: '作成',
  update: '更新',
  delete: '削除',
  like: 'いいね',
  unlike: 'いいね取消',
  view: '閲覧',
  audit: '審査',
  ban: 'BAN',
  unban: 'BAN解除',
  create_work: '作品投稿',
  auto_audit: '自動審査',
  update_avatar: 'アバター更新',
  reset_draw: '抽選リセット',
  purge_banned_likes: 'BANユーザーのいいねを削除',
}

const MODULE_BY_LOCALE: Record<string, Record<string, string>> = {
  'zh-CN': MODULE_ZH,
  'zh': MODULE_ZH,
  'en-US': MODULE_EN,
  en: MODULE_EN,
  'ja-JP': MODULE_JA,
  ja: MODULE_JA,
}

const ACTION_BY_LOCALE: Record<string, Record<string, string>> = {
  'zh-CN': ACTION_ZH,
  zh: ACTION_ZH,
  'en-US': ACTION_EN,
  en: ACTION_EN,
  'ja-JP': ACTION_JA,
  ja: ACTION_JA,
}

const FALLBACK_MODULE: Record<string, string> = {
  'zh-CN': '其他模块',
  'en-US': 'Other module',
  'ja-JP': 'その他',
}

const FALLBACK_ACTION: Record<string, string> = {
  'zh-CN': '其他操作',
  'en-US': 'Other action',
  'ja-JP': 'その他',
}

function normalizeLocale(locale?: string): string {
  if (!locale) return 'zh-CN'
  if (locale in MODULE_BY_LOCALE) return locale
  if (locale.startsWith('en')) return 'en-US'
  if (locale.startsWith('ja')) return 'ja-JP'
  if (locale.startsWith('zh')) return 'zh-CN'
  return 'zh-CN'
}

export const OPERATION_MODULE_LABELS = MODULE_ZH
export const OPERATION_ACTION_LABELS = ACTION_ZH

export function getOperationModuleLabel(module: string, locale?: string): string {
  const loc = normalizeLocale(locale)
  const map = MODULE_BY_LOCALE[loc] ?? MODULE_ZH
  const fallback = FALLBACK_MODULE[loc] ?? FALLBACK_MODULE['zh-CN']
  return map[module] ?? fallback
}

export function getOperationActionLabel(action: string, locale?: string): string {
  const loc = normalizeLocale(locale)
  const map = ACTION_BY_LOCALE[loc] ?? ACTION_ZH
  const fallback = FALLBACK_ACTION[loc] ?? FALLBACK_ACTION['zh-CN']
  return map[action] ?? fallback
}

export function sortOperationModules(modules: string[], locale?: string): string[] {
  const loc = normalizeLocale(locale)
  return [...modules].sort((a, b) =>
    getOperationModuleLabel(a, loc).localeCompare(getOperationModuleLabel(b, loc), loc)
  )
}

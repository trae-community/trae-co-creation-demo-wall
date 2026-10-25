/** 操作日志 module / action 的中文展示（与 writeOperationLog 的 module 字段一致） */
export const OPERATION_MODULE_LABELS: Record<string, string> = {
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

export const OPERATION_ACTION_LABELS: Record<string, string> = {
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
}

export function getOperationModuleLabel(module: string): string {
  return OPERATION_MODULE_LABELS[module] ?? '其他模块'
}

export function getOperationActionLabel(action: string): string {
  return OPERATION_ACTION_LABELS[action] ?? '其他操作'
}

/** 下拉排序：按中文名 */
export function sortOperationModules(modules: string[]): string[] {
  return [...modules].sort((a, b) =>
    getOperationModuleLabel(a).localeCompare(getOperationModuleLabel(b), 'zh-CN')
  )
}

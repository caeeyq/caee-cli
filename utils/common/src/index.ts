import path from 'path'
/**
 * 兼容 mac 和 window 系统内的路径
 */
export function formatPath(p: string) {
  if (path.sep === '\\') {
    return p.replace(/\\/g, '/')
  }
  return p
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

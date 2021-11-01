const path = require('path')
/**
 * 兼容 mac 和 window 系统内的路径
 */
function formatPath(p) {
  if (path.sep === '\\') {
    return p.replace(/\\/g, '/')
  }
  return p
}

function isString(value) {
  return typeof value === 'string'
}

module.exports = {
  formatPath,
  isString,
}

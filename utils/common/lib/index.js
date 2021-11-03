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

/**
 * 控制台展示 loading 动画
 * @param message
 * @param spinnerString
 * @returns {Spinner}
 */
function startLoading(message = 'processing...', spinnerString = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏') {
  const Spinner = require('cli-spinner').Spinner;
  const spinner = new Spinner(`%s ${message}`);
  spinner.setSpinnerString(spinnerString);
  spinner.start();
  return spinner
}

function sleep(time = 1000) {
  return new Promise(resolve => setTimeout(resolve, time))
}

module.exports = {
  formatPath,
  isString,
  startLoading,
  sleep,
}

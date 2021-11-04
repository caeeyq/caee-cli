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

function spawn(command, args, options) {
  const win32 = process.platform === 'win32'

  const cmd = win32 ? 'cmd' : command
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args

  return require('child_process').spawn(cmd, cmdArgs, options || {})
}

/**
 * 子线程异步执行命令
 * @param command {string}
 * @param args {string[]}
 * @param options {object}
 * @returns {Promise<unknown>}
 */
async function execAsync(command, args, options) {
  return new Promise(((resolve, reject) => {
    const child = spawn(command, args, options)
    child.on('error', reject)
    child.on('exit', resolve)
  }))
}

function globAsync(pattern, options) {
  return new Promise(((resolve, reject) => {
    require('glob')(pattern, options, (er, files) => {
      if (er) reject(er)
      resolve(files)
    })
  }))
}

module.exports = {
  formatPath,
  isString,
  startLoading,
  sleep,
  execAsync,
  globAsync
}

const semver = require('semver')
const colors = require('colors/safe')

const { log } = require('@caee/cli-utils-log')
const { isString } = require('@caee/cli-utils-common')

const LOWEST_NODE_VERSION = '12.0.0'
class Command {
  /** 传入的所有参数 */
  argv
  /** commander 库的 Command 对象 */
  cmd
  /** 命令参数的值 */
  values
  /** 命令选项 */
  opts
  constructor(argv_) {
    if (isString(argv_)) {
      this.argv = JSON.parse(argv_)
    } else if (Object.toString.call(argv_) === '[object Array]') {
      this.argv = argv_
    } else {
      throw new Error('只接受数组和 JSON.stringify(数组)')
    }
    new Promise(() => {
      const chain = Promise.resolve()
      chain
        .then(() => this.checkNodeVersion())
        .then(() => this.initArgs())
        .then(() => this.init())
        .then(() => this.exec())
        .catch(error => log.error('command', error.message))
    })
  }

  init() {
    throw new Error('必须实现init方法')
  }

  exec() {
    throw new Error('必须实现exec方法')
  }

  /**
   * 检查本地 node 版本是否符合要求
   */
  checkNodeVersion() {
    const currentNodeVersion = process.version
    if (semver.gt(LOWEST_NODE_VERSION, currentNodeVersion)) {
      throw new Error(colors.red(`caee-cli 需要安装 v${LOWEST_NODE_VERSION} 以上版本的 Node.js`))
    }
  }

  initArgs() {
    const argvLength = this.argv.length
    this.cmd = this.argv[argvLength - 1]
    this.values = this.argv.slice(0, argvLength - 2)
    this.opts = this.argv[argvLength - 2]
  }
}

module.exports = {
  LOWEST_NODE_VERSION,
  Command,
}

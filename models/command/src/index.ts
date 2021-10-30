import semver from 'semver'
import colors from 'colors/safe'
import { Command as Commander } from 'commander'
import { log } from '@caee/cli-utils-log'
import { isString } from '@caee/cli-utils-common'

export const LOWEST_NODE_VERSION = '12.0.0'
export abstract class Command<T extends Array<unknown> | string, O extends object> {
  /** 传入的所有参数 */
  protected argv: T
  /** commander 库的 Command 对象 */
  protected cmd!: Commander
  /** 命令参数的值 */
  protected values!: string[]
  /** 命令选项 */
  protected opts!: O
  constructor(argv_: T) {
    if (isString(argv_)) {
      this.argv = JSON.parse(argv_)
    } else {
      this.argv = argv_
    }
    const runner = new Promise((resolve, reject) => {
      const chain = Promise.resolve()
      chain
        .then(() => this.checkNodeVersion())
        .then(() => this.initArgs())
        .then(() => this.init())
        .then(() => this.exec())
        .catch(error => log.error('command', error.message))
    })
  }

  abstract init(): void

  abstract exec(): void

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
    this.cmd = this.argv[argvLength - 1] as Commander
    this.values = this.argv.slice(0, argvLength - 2) as string[]
    this.opts = this.argv[argvLength - 2] as O
  }
}

import fs from 'fs'
import { Command as Commander } from 'commander'

import { Command } from '@caee/cli-models-command'
import { log } from '@caee/cli-utils-log'

interface InitOpts {
  force?: boolean
}

type InitArgv = [projectName: string, opts: InitOpts, cmd: Commander]

export class InitCommand extends Command<InitArgv, InitOpts> {
  private projectName!: string
  private force!: boolean

  constructor(argv: InitArgv) {
    super(argv)
  }

  init() {
    this.projectName = this.values[0]
    this.force = !!this.opts.force
    log.verbose('InitCommand init', 'projectName', this.projectName)
    log.verbose('InitCommand init', 'force', this.force)
  }

  exec() {
    this.prepare()
  }

  prepare() {
    // 1. 判断当前目录是否为空
    if (!this.isCwdEmpty()) {
      // 1.1 询问是否继续创建
      log.verbose('InitCommand', 'prepare', '当前目录不为空,询问是否继续创建')
    } else {
    }
  }

  isCwdEmpty() {
    const cwdPath = process.cwd()
    const fileList = fs.readdirSync(cwdPath).filter(fileName => {
      const whiteList = ['node_modules']
      return !fileName.startsWith('.') && !whiteList.includes(fileName)
    })
    return fileList.length <= 0
  }
}

export default function init(argv: InitArgv) {
  return new InitCommand(argv)
}

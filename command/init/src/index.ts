import { Command } from '@caee/cli-models-command'
import { log } from '@caee/cli-utils-log'
import { Command as Commander } from 'commander'

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
    log.verbose('InitCommand exec', 'run exec')
  }
}

export default function init(argv: InitArgv) {
  return new InitCommand(argv)
}

import { Command } from '@caee/cli-models-command'

interface InitOpts {
  force?: boolean
}

type InitArgv = [projectName: string, opts: InitOpts]

export class InitCommand extends Command<InitArgv> {
  constructor(...argv: InitArgv) {
    super(...argv)
  }
  init() {
    throw new Error('Method not implemented.')
  }
  exec() {
    throw new Error('Method not implemented.')
  }
}

export default function init(...argv: InitArgv) {
  const [projectName, opts] = argv
  console.log('进入init命令aa', projectName)
  console.log('init command opts', opts)
  console.log('init command targetPath', process.env.CAEE_CLI_TARGET_PATH)
  return new InitCommand(...argv)
}

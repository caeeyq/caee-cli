import { Package } from '@caee/cli-models-package'
import { Command } from 'commander'

const SETTING_MAP: Record<string, string> = {
  init: '@caee/cli-commands-init',
}

export async function exec(...args: unknown[]) {
  const targetPath = process.env.CAEE_CLI_TARGET_PATH || ''
  const homePath = process.env.CAEE_CLI_HOME_PATH
  const cmdName = SETTING_MAP[(args[args.length - 1] as Command).name()]

  const pkg = new Package(targetPath, cmdName, 'latest')
  console.log('exec', pkg.getRootFilePath())
  console.log('exec CAEE_CLI_HOME_PATH', process.env.CAEE_CLI_HOME_PATH)
  console.log('exec CAEE_CLI_TARGET_PATH', process.env.CAEE_CLI_TARGET_PATH)
}

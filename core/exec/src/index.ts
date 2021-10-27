import { Package } from '@caee/cli-models-package'
import { Command } from 'commander'

const SETTING_MAP: Record<string, string> = {
  init: '@caee/cli-commands-init',
}

export async function exec(...args: unknown[]) {
  const targetPath = process.env.CAEE_CLI_TARGET_PATH || ''
  const cmdName = SETTING_MAP[(args[args.length - 1] as Command).name()]

  const pkg = new Package(cmdName, 'latest', targetPath)
  console.log('pkg', pkg)
  console.log('入口文件地址', pkg.getRootFilePath())
  console.log('目标目录', process.env.CAEE_CLI_TARGET_PATH)
}

import { Package } from '@caee/cli-models-package'
import { log } from '@caee/cli-utils-log'
import { Command } from 'commander'
import path from 'path'

const SETTING_MAP: Record<string, string> = {
  init: '@caee/cli-commands-init',
}
const CACHE_DIR = 'dependencies'

export async function exec(...args: unknown[]) {
  const targetPath =
    process.env.CAEE_CLI_TARGET_PATH || path.resolve(process.env.CAEE_CLI_HOME_PATH, CACHE_DIR)
  const pkgName = SETTING_MAP[(args[args.length - 1] as Command).name()]
  const pkgVersion = 'latest'
  log.verbose('exec', '目标包名', pkgName)
  log.verbose('exec', '目标包版本', pkgVersion)
  log.verbose('exec', '目标目录', targetPath)
  const pkg = new Package(pkgName, pkgVersion, targetPath)
  if (pkg.exists()) {
    // 更新pkg
  } else {
    // 安装pkg
    await pkg.install()
  }
  const rootFilePath = pkg.getRootFilePath()
  log.verbose('exec', '入口文件地址', rootFilePath)
  if (rootFilePath) require(rootFilePath).default(...args)
}

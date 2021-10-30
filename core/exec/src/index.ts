import { Package } from '@caee/cli-models-package'
import { log } from '@caee/cli-utils-log'
import { Command } from 'commander'
import path from 'path'
import cp from 'child_process'

const SETTING_MAP: Record<string, string> = {
  init: '@caee/cli-command-init',
}
const CACHE_DIR = 'dependencies'

export async function exec(...args: unknown[]) {
  let pkg: Package
  let targetPath = process.env.CAEE_CLI_TARGET_PATH
  const cmdName = (args[args.length - 1] as Command).name()
  const pkgName = SETTING_MAP[cmdName]
  const pkgVersion = 'latest'

  if (targetPath) {
    // 如果用户输入了targetPath  lla
    pkg = new Package(pkgName, pkgVersion, targetPath)
  } else {
    targetPath = path.resolve(process.env.CAEE_CLI_HOME_PATH, CACHE_DIR)
    const storePath = path.resolve(targetPath, 'node_modules')
    pkg = new Package(pkgName, pkgVersion, targetPath, storePath)
    if (await pkg.exists()) {
      // 更新pkg
      log.verbose('exec', `本地存在 ${pkgName} ，检查版本是否为最新...`)
      await pkg.update()
    } else {
      // 安装pkg
      log.verbose('exec', `本地不存在 ${pkgName} ，进入安装流程...`)
      await pkg.install()
    }
  }

  // 执行相应命令逻辑
  const rootFilePath = pkg.getRootFilePath()
  if (rootFilePath) {
    const command = args[args.length - 1] as any
    const lessCommand = {} as any
    Object.keys(command).forEach(key => {
      if (!key.startsWith('_') && key !== 'parent') {
        lessCommand[key] = command[key]
      }
    })
    args[args.length - 1] = lessCommand
    const code = `require('${rootFilePath}').default('${JSON.stringify(args)}')`
    const child = cp.spawn('node', ['-e', code], { stdio: 'inherit' })
    child.on('error', e => log.error('exec', e.message))
    child.on('exit', e => log.verbose('exec', `${cmdName} 命令执行成功`, e))
  }
}

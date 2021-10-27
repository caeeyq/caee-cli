import pkg from './package.json'
import colors from 'colors/safe'

import { Command } from 'commander'
import { log } from '@caee/cli-utils-log'
import { init } from '@caee/cli-command-init'
import { exec } from '@caee/cli-core-exec'

import { prepare } from './prepare'

export async function core() {
  try {
    await prepare()
    registCommander()
  } catch (error) {
    log.error('cli', (error as Error).message)
  }
}

/**
 * 注册脚手架命令
 */
function registCommander() {
  const program = new Command()

  program
    .version(pkg.version)
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否执行指定目录的命令', '')

  program
    .command('init [projectName] [arojectName]')
    .option('-f, --force', '是否覆盖当前目录，强a制初始化项目')
    .action(exec)

  program.on('option:debug', () => {
    const { debug } = program.opts()
    if (debug) {
      log.level = 'verbose'
      process.env.CAEE_CLI_LOG_LEVEL = 'verbose'
    } else {
      log.level = 'info'
      process.env.CAEE_CLI_LOG_LEVEL = 'info'
    }
  })

  program.on('option:targetPath', () => {
    const { targetPath } = program.opts()
    process.env.CAEE_CLI_TARGET_PATH = targetPath
  })

  program.on('command:*', opts => {
    const avaiableCommand = program.commands.map(com => com.name)
    log.error('cli', colors.red(`未知命令 ${opts[0]}`))
    if (avaiableCommand.length > 0) {
      log.error('cli', colors.red(`当前可用命令 ${avaiableCommand.join(', ')}`))
    }
  })

  program.parse(process.argv)

  if (program.args.length < 1) {
    program.outputHelp()
    console.log()
  }
}

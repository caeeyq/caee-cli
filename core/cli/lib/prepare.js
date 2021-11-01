const colors = require('colors/safe')
const rootCheck = require('root-check')
const useHome = require('user-home')
const pathExists = require('path-exists')
const minimist = require('minimist')
const dotenv = require('dotenv')
const path = require('path')

const { log } = require('@caee/cli-utils-log')
const { getLastVersion } = require('@caee/cli-utils-get-npm-info')

const pkg = require('../package.json')

const DEFAULT_CLI_HOME = '.caee-cli'

async function prepare() {
  checkPkgVersion()
  checkRoot()
  checkUserHome()
  checkInputArgs()
  checkEnv()
  await checkGlobalUpdate()
}

/**
 * 检查本地版本是否需要升级
 */
async function checkGlobalUpdate() {
  const { version: currentVersion, name: pkgName } = pkg
  const lastVersion = await getLastVersion(currentVersion, pkgName)
  if (lastVersion) {
    log.warn(
      'cli',
      colors.yellow(`请手动更新 ${pkgName}, 当前版本 ${currentVersion}, 最新版本 ${lastVersion}
更新命令: npm install -g ${pkgName}`),
    )
  }
}

/**
 * 检查环境变量
 */
function checkEnv() {
  const envPath = path.resolve(useHome, '.caee-cli.env')
  dotenv.config({
    path: envPath,
  })
  createDefaultEnv()
}

/**
 * 生成默认环境变量
 */
function createDefaultEnv() {
  const cliConfig = {
    cliHomePath: '',
  }
  if (process.env.CAEE_CLI_HOME) {
    cliConfig.cliHomePath = path.join(useHome, process.env.CAEE_CLI_HOME)
  } else {
    cliConfig.cliHomePath = path.join(useHome, DEFAULT_CLI_HOME)
  }
  process.env.CAEE_CLI_HOME_PATH = cliConfig.cliHomePath
}

/**
 * 检查命令入参
 */
function checkInputArgs() {
  const args = minimist(process.argv.slice(2))
  checkArgs(args)
}

/**
 * 检查入参
 * @param args 入参
 */
function checkArgs(args) {
  if (args.debug) {
    log.level = 'verbose'
    process.env.CAEE_CLI_LOG_LEVEL = 'verbose'
  } else {
    log.level = 'info'
    process.env.CAEE_CLI_LOG_LEVEL = 'info'
  }
}

/**
 * 检查 caee-cli 版本
 */
function checkPkgVersion() {
  log.notice('cli', `v${pkg.version}`)
}

/**
 * 降级用户权限
 */
function checkRoot() {
  rootCheck()
}

/**
 * 检查用户主目录
 */
function checkUserHome() {
  if (!useHome || !pathExists.sync(useHome)) {
    throw new Error(colors.red('当前系统用户主目录不存在！'))
  }
}

module.exports = {
  prepare,
}

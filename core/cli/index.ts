import semver from 'semver'
import colors from 'colors/safe'
import rootCheck from 'root-check'
import useHome from 'user-home'
import pathExists from 'path-exists'

import { log } from '@caee/cli-utils-log'
import pkg from './package.json'
import { LOWEST_NODE_VERSION } from './const'

export function core() {
  try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
  } catch (error) {
    log.error('cli', (error as Error).message)
  }
}

/**
 * 检查 caee-cli 版本
 */
function checkPkgVersion() {
  log.notice('cli', `v${pkg.version}`)
}

/**
 * 检查本地 node 版本是否符合要求
 */
function checkNodeVersion() {
  const currentNodeVersion = process.version
  if (semver.gt(LOWEST_NODE_VERSION, currentNodeVersion)) {
    throw new Error(colors.red(`caee-cli 需要安装 v${LOWEST_NODE_VERSION} 以上版本的 Node.js`))
  }
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

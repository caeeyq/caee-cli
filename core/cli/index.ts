import semver from 'semver'
import colors from 'colors/safe'
import { log } from '@caee/cli-utils-log'
import pkg from './package.json'
import { LOWEST_NODE_VERSION } from './const'

export function core() {
  try {
    checkPkgVersion()
    checkNodeVersion()
  } catch (error) {
    log.error('cli', (error as Error).message)
  }
}

function checkPkgVersion() {
  log.notice('cli', `v${pkg.version}`)
}

function checkNodeVersion() {
  const currentNodeVersion = process.version
  if (semver.gt(LOWEST_NODE_VERSION, currentNodeVersion)) {
    throw new Error(colors.red(`caee-cli 需要安装 v${LOWEST_NODE_VERSION} 以上版本的 Node.js`))
  }
}

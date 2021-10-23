import pkg from './package.json'
import { log } from '@caee/cli-utils-log'

export function core() {
  checkPkgVersion()
}

function checkPkgVersion() {
  log.notice('cli', `v${pkg.version}`)
}

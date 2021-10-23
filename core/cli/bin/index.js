#! /usr/bin/env node
const importLocal = require('import-local')

if (importLocal(__dirname)) {
  require('@caee/cli-utils-log').log.notice('cli', '正在使用caee-cli本地版本')
} else {
  require('../lib').core(process.argv.slice(2))
}

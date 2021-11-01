const npmlog = require('npmlog')

npmlog.level = process.env.CAEE_CLI_LOG_LEVEL ? process.env.CAEE_CLI_LOG_LEVEL : 'info'
npmlog.heading = 'caee'

module.exports = {
  log: npmlog,
}

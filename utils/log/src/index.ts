import npmlog from 'npmlog'

npmlog.level = process.env.CAEE_CLI_LOG_LEVEL ? process.env.CAEE_CLI_LOG_LEVEL : 'info'
npmlog.heading = 'caee'

export const log = npmlog

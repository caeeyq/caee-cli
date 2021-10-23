import npmlog from 'npmlog'

npmlog.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'
npmlog.heading = 'caee'

export const log = npmlog

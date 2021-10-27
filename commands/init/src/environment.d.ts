declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CAEE_CLI_HOME?: string
      CAEE_CLI_HOME_PATH: string
      CAEE_CLI_TARGET_PATH?: string
      CAEE_CLI_LOG_LEVEL:
        | 'silly'
        | 'verbose'
        | 'info'
        | 'timing'
        | 'http'
        | 'notice'
        | 'warn'
        | 'error'
        | 'silent'
    }
  }
}

export {}

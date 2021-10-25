declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CLI_HOME?: string
      CLI_HOME_PATH: string
      LOG_LEVEL:
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

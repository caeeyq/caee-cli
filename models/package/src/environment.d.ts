import { ProcessEnv as _ProcessEnv } from '../../../types'

declare global {
  namespace NodeJS {
    interface ProcessEnv extends _ProcessEnv {}
  }
}

export {}

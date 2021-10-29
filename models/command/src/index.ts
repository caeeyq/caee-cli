'use strict'

export abstract class Command<T extends Array<any>> {
  protected argv: T
  constructor(...argv_: T) {
    this.argv = argv_
    console.log('command', 'constructor', argv_)
  }

  abstract init(): void

  abstract exec(): void
}

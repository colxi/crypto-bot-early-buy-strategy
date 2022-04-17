import { config } from '@/config'
import { getDateAsDDMMYYYY, getTimeAsHHMMSS } from '@/lib/date'
import { createPath, getProjectRootDir } from '@/lib/file'
import { Console } from '@/service/console'
import fs from 'fs'
import { isPlainObject } from 'lodash'


export class Logger {
  constructor(filename: string) {
    this.filename = filename
    this.filepath = createPath(getProjectRootDir(), config.logsPath, `${this.filename}.txt`)
    this.sharedLogFilepath = createPath(getProjectRootDir(), config.logsPath, `_last.txt`)

    try { fs.truncateSync(this.sharedLogFilepath, 0) }
    catch (e) { Console.log('Failed clearing GENERAL log file') }

    this.isEnabled = true
    this.lineBreakChar = '\n'
  }

  private readonly filename: string
  private readonly filepath: string
  private readonly sharedLogFilepath: string
  private readonly lineBreakChar: string
  private isEnabled: boolean

  private save(...data: unknown[]) {
    if (!this.isEnabled) return
    const time = `${getDateAsDDMMYYYY()} ${getTimeAsHHMMSS()}`
    const formatted = data
      .map(i => isPlainObject(i) ? JSON.stringify(i, null, 2) : Array.isArray(i) ? JSON.stringify(i) : String(i))
      .join(' ')

    try {
      fs.appendFileSync(this.filepath, `${time} : ${formatted}${this.lineBreakChar}`)
      fs.appendFileSync(this.sharedLogFilepath, `${time} : ${formatted}${this.lineBreakChar}`)
    }
    catch (e) {
      Console.log('Err writing logs. LOGGER WILL BE DISABLED! ')
      Console.log((e as any)?.message)
    }
  }

  public lineBreak() {
    if (!this.isEnabled) return
    try {
      fs.appendFileSync(this.filepath, this.lineBreakChar)
      fs.appendFileSync(this.sharedLogFilepath, this.lineBreakChar)
    }
    catch (e) {
      Console.log('Err writing logs (line break). LOGGER WILL BE DISABLED!')
      Console.log((e as any)?.message)
    }
  }

  public log(...data: unknown[]) {
    this.save('⚪', ...data)
  }

  public success(...data: unknown[]) {
    this.save('✅', ...data)
  }

  public info(...data: unknown[]) {
    this.save('🔵', ...data)
  }

  public warning(...data: unknown[]) {
    this.save('🟠', ...data)
  }

  public error(...data: unknown[]) {
    this.save('🔴', ...data)
  }

}
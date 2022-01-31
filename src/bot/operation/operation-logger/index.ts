import { config } from '@/config'
import { getDateAsDDMMYYYY, getTimeAsHHMMSS } from '@/lib/date'
import { createPath, getProjectRootDir } from '@/lib/file'
import fs from 'fs'
import { isPlainObject } from 'lodash'


export class OperationLogger {
  constructor(filename: string) {
    this.filename = filename
    this.filepath = createPath(getProjectRootDir(), config.logsPath, `${this.filename}.txt`)
    this.lineBreakChar = '\n'
  }

  private readonly filename: string
  private readonly filepath: string
  private readonly lineBreakChar: string

  private save(...data: unknown[]) {
    const time = `${getDateAsDDMMYYYY()} ${getTimeAsHHMMSS()}`
    const formatted = data
      .map(i => isPlainObject(i) ? JSON.stringify(i, null, 2) : Array.isArray(i) ? JSON.stringify(i) : String(i))
      .join(' ')

    try { fs.appendFileSync(this.filepath, `${time} : ${formatted}${this.lineBreakChar}`) }
    catch (e) { console.log('Err writing log', e) }
  }

  public lineBreak() {
    try { fs.appendFileSync(this.filepath, this.lineBreakChar) }
    catch (e) { console.log('Error writing log', e) }
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
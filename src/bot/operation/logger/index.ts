import { config } from '@/config'
import { getDateAsDDMMYYYY, getTimeAsHHMMSS } from '@/lib/date'
import fs from 'fs'
import { isPlainObject } from 'lodash'
import path from 'path/posix'


export class Logger {
  constructor(filename: string) {
    this.filename = filename
    const isWindows = process.platform === "win32"
    if (isWindows) {
      this.filepath = `${process.cwd()}\\${config.logsPath}\\${this.filename}.txt`
    } else {
      this.filepath = path.join(process.cwd(), config.logsPath, `${this.filename}.txt`)
    }
  }

  private readonly filename: string
  private readonly filepath: string
  private readonly lineBreak = '\n'

  private save(...data: unknown[]) {
    const time = `${getDateAsDDMMYYYY()} ${getTimeAsHHMMSS()}`
    const formatted = data
      .map(i => isPlainObject(i) ? JSON.stringify(i, null, 2) : Array.isArray(i) ? JSON.stringify(i) : String(i))
      .join(' ')

    try {
      fs.appendFileSync(this.filepath, `${time} : ${formatted}${this.lineBreak}`)
    } catch (e) {
      console.log('err writing', e)
    }
  }

  public log(...data: unknown[]) {
    this.save('⚪️', ...data)
  }

  public success(...data: unknown[]) {
    this.save('🟢', ...data)
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
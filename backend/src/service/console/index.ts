import { getTimeAsHHMMSS } from '@/lib/date'
import { ui } from './../../ui/index'
import { ServerActivity } from './../activity-server/index'

export class Console {
  static async start() {
    //
  }

  public static log(...args: (number | string | boolean | object | null)[]) {
    if (!args.length) return
    ui.console.print(...args)
    const time = getTimeAsHHMMSS()
    ServerActivity.send(JSON.stringify([time, ...args]))
  }

  public static clear() {
    ui.console.clear()
  }
}

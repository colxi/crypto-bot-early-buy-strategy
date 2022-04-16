import { ui } from './../../ui/index'

export class Console {
  static async start() {
    //
  }

  public static log(...args: (number | string | boolean | object | null)[]) {
    ui.console.print(...args)
  }

  public static clear() {
    ui.console.clear()
  }
}

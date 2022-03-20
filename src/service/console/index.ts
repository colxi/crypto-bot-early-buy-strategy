import { ConsoleUI } from '@/ui/console'

export class Console {
  private static consoleUI: ConsoleUI

  static async start(consoleUI: ConsoleUI) {
    this.consoleUI = consoleUI
  }

  public static log(...args: (number | string | boolean | object | null)[]) {
    this.consoleUI.print(...args)
  }

  public static clear() {
    this.consoleUI.clear()
  }
}

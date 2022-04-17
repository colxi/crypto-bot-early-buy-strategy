import { Console } from '@/service/console'
import blessed from 'blessed'
import { UI } from './'

export class InputBox {
  constructor(ui: UI) {
    this.ui = ui

    this.element = blessed.textbox({
      left: '0',
      bottom: '0',
      height: 1,
      width: '100%',
      scrollable: false,
      style: {
        bg: 'white',
        fg: 'black',
        bold: true,
      },
      cursor: {
        blink: true,
      }
    })


    this.element.key(['down'], (ch, key) => {
      // Console.log('DOWN!')
      // this.ui.console.element.scroll(-10)
      // this.ui.screen.render()
      // return process.exit(0)
    })

  }

  private readonly ui: UI
  public element: blessed.Widgets.TextboxElement
  public inputHistory: string[] = []
  public inputHistoryIndex: number = 0

  public prompt(): Promise<string> {
    return new Promise(resolve => {
      this.element.focus()
      this.element.input((e: any, value?: string): void => {
        if (value === 'q') process.exit()
        this.element.clearValue()
        this.ui.screen.render()
        resolve(value || '')
        if (e) throw e
      })
    })
  }
}

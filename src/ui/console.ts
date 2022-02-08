import { Console } from '@/service/console'
import blessed from 'blessed'
import { UI } from './'

const CONSOLE_MAX_LINES = 200

export class ConsoleUI {
  constructor(ui: UI) {
    this.ui = ui

    this.element = blessed.box({
      left: 0,
      width: '100%',
      height: '100%-1',
      border: 'line',
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      padding: {
        left: 1,
        right: 1,
      },
      scrollbar: {
        style: {
          bg: 'yellow'
        },
        track: {
          bg: 'grey'
        },
      },
    })

    this.ui.screen.on('keypress', (ch, key) => {
      switch (key.name) {
        case 'up': {
          if (key.shift) this.element.scroll(-5)
          else this.element.scroll(-1)
          this.ui.screen.render()
          break
        }
        case 'down': {
          if (key.shift) this.element.scroll(5)
          else this.element.scroll(1)
          this.ui.screen.render()
          break
        }
      }
    })
  }

  private readonly ui: UI
  public element: blessed.Widgets.BoxElement

  public print(...data: (string | boolean | number | object)[]) {
    if (!data.length) return
    const formatted = data.map(i => {
      if (typeof i === 'number') return `{green-fg}${i}{/}`
      else return i
    })

    const content = formatted.join(' ')
    if (this.element.getLines().length > CONSOLE_MAX_LINES) this.element.shiftLine(0)
    this.element.pushLine(content)
    this.element.setScrollPerc(100)
    this.ui.screen.render()
  }


  public clear() {
    this.element.setText('')
    this.element.setContent('')
    this.ui.screen.render()
  }
}

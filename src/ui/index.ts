import blessed from 'blessed'
import { Balance } from './balance'
import { ConsoleUI } from './console'
import { InputBox } from './inpputBox'
import { Operations } from './operation'

export class UI {
  constructor() {
    this.screen = blessed.screen({
      // autoPadding: false,
      // warnings: true,
      // fastCSR: true,
      // useBCE: true,
      //  fullUnicode: true,
      smartCSR: true,
      // resizeTimeout: 500,
      // dockBorders: true,

    })

    this.layout = blessed.layout({
      layout: 'grid',
      top: 'top',
      left: 'left',
      width: '100%',
      height: '100%',
    })

    const leftColumn = blessed.box({
      width: '60%',
      height: '100%',
      left: '0%',
      scrollable: false,
    })

    const rightColumn = blessed.box({
      layout: 'inline',
      width: '40%',
      height: '100%',
      left: '60%',
      scrollable: false,
    })

    // LAYOUT
    this.screen.append(this.layout)
    this.layout.append(leftColumn)
    this.layout.append(rightColumn)

    // LEFT 
    this.inputBox = new InputBox(this)
    this.console = new ConsoleUI(this)
    leftColumn.append(this.inputBox.element)
    leftColumn.append(this.console.element)

    // RIGHT
    this.balance = new Balance(this)
    this.operation = new Operations(this)
    rightColumn.append(this.balance.element)
    rightColumn.append(this.operation.element)

    this.screen.render()

  }

  public inputBox: InputBox
  public console: ConsoleUI
  public balance: Balance
  public operation: Operations

  public screen: blessed.Widgets.Screen
  public layout: blessed.Widgets.LayoutElement
}

export const ui = new UI()
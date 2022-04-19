import { toFixed } from '@/lib/math'
import blessed from 'blessed'
import { UI } from './'

export class Balance {
  constructor(ui: UI) {
    this.ui = ui

    this.element = blessed.box({
      width: '100%',
      height: 4,
      border: 'line',
      align: 'center',
      scrollable: false,
      padding: {
        left: 1,
        right: 1,
      },
    })
  }

  private readonly ui: UI
  public element: blessed.Widgets.BoxElement

  public update(balanceInUSDT: string, latency: number) {
    this.element.setLine(0, `Available Balance : ${toFixed(Number(balanceInUSDT), 4)} USDT`)
    this.element.setLine(1, `Gate API Latency: ${latency} ms`)
    // this.element.setContent(`Available Balance : ${balanceInUSDT} USDT\n Latency: 13`)
    // this.ui.screen.render()
    //
  }
}

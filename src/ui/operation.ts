import { toFixed } from '@/lib/math'
import { Operation } from '@/service/bot/operation'
import blessed from 'blessed'
import { UI } from '.'

export class Operations {
  constructor(ui: UI) {
    this.ui = ui

    this.element = blessed.box({
      content: "ACTIVE OPERATIONS\n\n(none)",
      width: '100%',
      height: '100%-4',
      top: 4,
      border: 'line',
      align: 'left',
      scrollable: false,
      padding: {
        left: 1,
        right: 1,
      },
    })
  }

  private readonly ui: UI
  public element: blessed.Widgets.BoxElement

  public update(operations: Operation[]) {
    this.element.setContent('')
    this.element.pushLine('ACTIVE OPERATIONS')
    this.element.pushLine('')
    if (!operations.length) this.element.pushLine('(none)')
    else {
      operations.forEach(o => {
        // { id: 1, assetPair: 'BTC_USDT', amount: 11, entryPrice: '123.34', elapsedTime: 12, ROE: 12.2 }
        const elapsedTime = toFixed((Date.now() - o.startTime) / 1000, 2)
        this.element.pushLine(`ID #${o.id}`)
        this.element.pushLine(`Elapsed time ${elapsedTime} seconds`)
        // this.element.pushLine(`  TotalUnits   : ${o.amount} ${o.symbol}`)
        // this.element.pushLine(`  TotalSpent   : ${o.operationCost} USDT`)
        // this.element.pushLine(`  BuyPrice     : 234.23432 USDT`)
        // this.element.pushLine(`  TakeProfit   : 136.54252 USDT (+3)`)
        // this.element.pushLine(`  StopLoss     : 132.54252 USDT (-3)`)
        // this.element.pushLine(`  ----------------------------------`)
        // this.element.pushLine(`  CurrentPrice : 234.23432 USDT (+2%)`)
        // this.element.pushLine(`  Elapsed      : 88 sec`)
        // this.element.pushLine(`  Emergency    : false`)
      })
    }
    this.ui.screen.render()
    //
  }
}

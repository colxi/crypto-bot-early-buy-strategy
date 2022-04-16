import { getPercentageDiff, toFixed } from '@/lib/math'
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
        const elapsedTime = Math.ceil((Date.now() - o.startTime) / 1000)
        const PNL = getPercentageDiff(Number(o.buyOrderDetails.buyPrice), o.lastAssetPairPrice)
        this.element.pushLine(`ID #${o.id}`)
        this.element.pushLine(`Elapsed time : ${elapsedTime} seconds`)
        this.element.pushLine(`Operation cost : ${o.buyOrderDetails.operationCost} USDT`)
        this.element.pushLine(`Original price : ${o.buyOrderDetails.originalAssetPrice} USDT`)
        this.element.pushLine(`Entry amount : ${o.buyOrderDetails.amount} ${o.symbol}`)
        this.element.pushLine(`Entry price : ${o.buyOrderDetails.buyPrice} USDT`)
        this.element.pushLine(`Current price : ${o.lastAssetPairPrice} USDT`)
        this.element.pushLine(`PNL : ${PNL}%`)
      })
    }
    this.ui.screen.render()
    //
  }
}

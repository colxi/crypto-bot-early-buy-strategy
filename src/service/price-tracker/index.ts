import { AssetPair, SymbolName } from '@/service/gate-client/types'
import { Console } from '@/service/console'
import WebsocketConnection from '@/lib/websocket'


export class PriceTrackerService {
  constructor() {
    this.ws = new WebsocketConnection({
      host: 'wss://ws.gate.io/v3/',
      reconnectOnDisconnection: true,
      reconnectOnDisconnectionDelay: 1000,
      logger: (...a: any) => Console.log(...a)
    })
  }

  requestId = 1
  ws: WebsocketConnection

  symbols: Record<SymbolName, number> = {}

  async start(): Promise<void> {
    return new Promise(resolve => {
      this.ws.subscribe('message', (e) => {
        if (typeof e.detail.message !== 'object') {
          Console.log('Invalid ticker message', e.detail.message)
          return
        }
        const update = e.detail.message as { method: string, params: any[] }
        if (update.method !== 'ticker.update') {
          Console.log('Invalid ticker method:', update.method)
          return
        }
        const symbolName = update.params[0].split('_')[0]
        const price = update.params[1].last
        this.symbols[symbolName] = price
        Console.log(typeof price)
      })
      this.ws.subscribe('connect', () => resolve())
      this.ws.connect()
    })
  }

  subscribe(symbolName: SymbolName) {
    if (!this.ws) {
      Console.log('PriceTracker WS not available')
      return
    }
    if (this.symbols[symbolName]) {
      Console.log('PriceTracker: Already subscribed to ', symbolName)
      return
    }
    const request = {
      "id": this.requestId++,
      "method": "ticker.subscribe",
      "params": [`${symbolName}_USDT`],
    }
    this.ws?.send(request)
  }
}


export const PriceTracker = new PriceTrackerService()
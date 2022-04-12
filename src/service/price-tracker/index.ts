import { Gate } from './../gate-client/index'
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

  private requestId = 1
  private ws: WebsocketConnection

  symbols: Record<SymbolName, number> = {}

  async start(): Promise<void> {
    return new Promise(resolve => {
      this.ws.subscribe('message', (e) => {
        if (typeof e.detail.message !== 'object') {
          Console.log('Invalid ticker message', e.detail.message)
          return
        }
        const update = e.detail.message as { method: string, params: any[], result?: any }
        if (update.method !== 'ticker.update') {
          // print unexpected message if not a success message (from a previous request)
          if (update.result?.status !== 'success') Console.log('Invalid ticker method:', update)
          return
        }
        const symbolName = update.params[0].split('_')[0]
        const price = update.params[1].last
        // prevent saving values for symbols that are not tracked anymore
        const isTrackingSymbol = symbolName in this.symbols
        if (isTrackingSymbol) this.symbols[symbolName] = price
      })
      this.ws.subscribe('connect', () => resolve())
      this.ws.connect()
    })
  }

  async subscribe(symbolName: SymbolName): Promise<void> {
    if (symbolName in this.symbols) {
      Console.log('PriceTracker: Already subscribed to ', symbolName)
      return
    }
    const assetPair: AssetPair = `${symbolName.toUpperCase()}_USDT`
    Console.log('Subscribing to Asset price...', symbolName)

    // perform an initial fetch , to ensure value is available just after the call
    try {
      this.symbols[symbolName] = await Gate.getAssetPairPrice(assetPair)
    } catch (e) {
      throw new Error(`[PriceTracker] Asset does not exit in Gate (${symbolName})`)
    }
    const request = {
      "id": this.requestId++,
      "method": "ticker.subscribe",
      "params": [assetPair],
    }
    this.ws.send(request)
  }

  async unsubscribe(symbolName: SymbolName) {
    if (!(symbolName in this.symbols)) return
    else delete this.symbols[symbolName]

    const assetPair = `${symbolName.toUpperCase()}_USDT`
    Console.log('Unsubscribing from Asset price...', symbolName)
    const request = {
      "id": this.requestId++,
      "method": "ticker.unsubscribe",
      "params": [assetPair],
    }
    this.ws.send(request)
  }
}


export const PriceTracker = new PriceTrackerService()
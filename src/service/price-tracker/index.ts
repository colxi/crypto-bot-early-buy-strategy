import { toFixed } from '@/lib/math'
import { Gate } from './../gate-client/index'
import { AssetPair, SymbolName } from '@/service/gate-client/types'
import { Console } from '@/service/console'
import WebsocketConnection, { WebsocketMessageEvent } from '@/lib/websocket'


export class PriceTrackerService {
  constructor() {
    this.ws = new WebsocketConnection({
      host: 'wss://api.gateio.ws/ws/v4/',
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
      this.ws.subscribe('message', this.onMessage.bind(this))
      this.ws.subscribe('connect', () => resolve())
      this.ws.connect()
    })
  }

  async onMessage(event: WebsocketMessageEvent): Promise<void> {
    if (typeof event.detail.message !== 'object') {
      Console.log('[PriceTracker] Invalid socket message', event.detail.message)
      return
    }
    const message = event.detail.message as { channel: string, event: string, result: { currency_pair: string, last: string, status?: string } }
    if (message.event === 'update') {
      if (message.channel === 'spot.tickers') await this.onTickerUpdate(message.result.currency_pair, message.result.last)
      else if (message.channel === 'spot.book_ticker') await this.onOrderBookTickerUpdate(message)
    }
    else if (message.result.status === 'success') {
      Console.log(`[PriceTracker] ${message.event} (${message.channel}) = ${message.result.status}`)
    }
    else {
      Console.log('[PriceTracker] Unknown message')
      Console.log(event.detail.message)
    }
  }

  async onOrderBookTickerUpdate(msg: any): Promise<void> {
    const symbolName = msg.result.s.split('_')[0]
    const price = Number(msg.result.b)
    const volume = Number(msg.result.B)
    Console.log(`${price} USD (vol=${volume} ${symbolName} / ${toFixed(volume * price, 2)} USD)`)
  }

  async onTickerUpdate(assetPair: string, last: string): Promise<void> {
    const symbolName = assetPair.split('_')[0]
    const price = Number(last)
    // prevent saving values for symbols that are not tracked anymore
    const isTrackingSymbol = symbolName in this.symbols
    if (isTrackingSymbol) this.symbols[symbolName] = price
  }

  async subscribe(symbolName: SymbolName): Promise<void> {
    if (symbolName in this.symbols) {
      Console.log('[PriceTracker] Already subscribed to ', symbolName)
      return
    }
    const assetPair: AssetPair = `${symbolName.toUpperCase()}_USDT`
    Console.log('[PriceTracker] Subscribing to Asset price...', symbolName)

    // perform an initial fetch , to ensure value is available just after the call
    try {
      this.symbols[symbolName] = await Gate.getAssetPairPrice(assetPair)
    } catch (e) {
      throw new Error(`[PriceTracker] Asset does not exit in Gate (${symbolName})`)
    }
    const request = {
      "time": Date.now(),
      "channel": "spot.tickers",
      "event": "subscribe",
      "payload": [assetPair]
    }
    this.ws.send(request)

    const request2 = {
      "time": Date.now(),
      "channel": "spot.book_ticker",
      "event": "subscribe",
      "payload": [assetPair]
    }
    this.ws.send(request2)
  }

  async unsubscribe(symbolName: SymbolName) {
    if (!(symbolName in this.symbols)) return
    else delete this.symbols[symbolName]

    const assetPair = `${symbolName.toUpperCase()}_USDT`
    Console.log('[PriceTracker] Unsubscribing from Asset price...', symbolName)
    const request = {
      "time": Date.now(),
      "channel": "spot.tickers",
      "event": "unsubscribe",
      "payload": [assetPair]
    }
    this.ws.send(request)
  }
}


export const PriceTracker = new PriceTrackerService()
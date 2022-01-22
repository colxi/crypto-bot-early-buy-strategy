import { GateClient } from '../lib/gate-client'
import { AssetPair, SymbolName } from '../lib/gate-client/types'
import WebsocketConnection from '../lib/websocket'
import { Operation } from './operation'


function getErrorMessage(e: unknown) {
  if (e instanceof Error) { return e.message }
  else return String(e)
}

export class EarlyBuyBot {
  constructor(gate: GateClient, socket: WebsocketConnection) {
    this.gate = gate
    this.socket = socket
    console.log('Listening for new assets announcements...')
    console.log
    console.log('')
  }

  gate: GateClient
  socket: WebsocketConnection

  static async create(socket: WebsocketConnection, gate: GateClient): Promise<EarlyBuyBot> {
    console.log('🟢 Initializing Bot')
    return new EarlyBuyBot(gate, socket)
  }

  async onNewAssetSignal(symbol: SymbolName): Promise<void> {
    console.log(`⚡️ New asset announced: ${symbol}`)

    const assetPair: AssetPair = `${symbol}_USDT`

    // Block if asset is not available or is not tradeable
    if (!this.gate.assetPairs[assetPair]) {
      console.log(`Asset ${assetPair} not available. Ignoring signal!`)
      return
    }

    if (!this.gate.assetPairs[assetPair].tradeStatus) {
      console.log(`Asset ${assetPair} not tradeable. Ignoring signal!`)
      return
    }

    try {
      const trade = await Operation.create(this.gate, symbol)
      trade.subscribe('unexpectedError', () => {
        console.log('🚨', 'Unexpected Error in trade', symbol)
      })
    } catch (e) {
      console.log('🚨 ERROR :', getErrorMessage(e))
      console.log('🚨 Signal ignored')
    }
  }
}


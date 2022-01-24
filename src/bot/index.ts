import { config } from '@/config'
import { GateClient } from '../lib/gate-client'
import { AssetPair, SymbolName } from '../lib/gate-client/types'
import WebsocketConnection from '../lib/websocket'
import { getSymbolsFromMessage } from './message-process'
import { Operation } from './operation'


export class EarlyBuyBot {
  constructor(gate: GateClient, socket: WebsocketConnection) {
    this.gate = gate
    this.socket = socket
    console.log('Listening for new assets announcements...')
    console.log
    console.log('')

    this.socket.subscribe('message', (event) => {
      const { message } = event.detail
      if (typeof message === 'string') {
        const announcement = getSymbolsFromMessage(message)
        if (!announcement) return
        console.log('MESSAGE :', message)
        console.log('SYMBOLS :', announcement.symbols)
        for (const symbol of announcement.symbols) {
          const assetPair: AssetPair = `${symbol}_USDT`
          // Block if asset is not available or is not tradeable
          if (!this.gate.assetPairs[assetPair]) continue
          if (!this.gate.assetPairs[assetPair].tradeStatus) continue
          else {
            this.createOperation(symbol).catch(e => { throw e })
            break
          }
        }
      } else console.log('Unknown message from WS', message)
    })
  }

  gate: GateClient
  socket: WebsocketConnection
  operations: Record<string, Operation> = {}
  isBusy: boolean = false

  static async create(socket: WebsocketConnection, gate: GateClient): Promise<EarlyBuyBot> {
    console.log('🟢 Initializing Bot')
    return new EarlyBuyBot(gate, socket)
  }


  private async createOperation(symbol: SymbolName): Promise<void> {
    if (this.isBusy) {
      console.log('System busy. Ignoring signal')
    }

    this.isBusy = true
    console.log(`⚡️ New asset announced: ${symbol}`)

    /**
     * 
     * BLOCK if limit of simultaneous operations is reached
     * 
     */
    if (Object.keys(this.operations).length === config.operation.maxSimultaneousOperations) {
      console.log('Max simultaneous operations limit reached. Ignoring signal')
      return
    }


    /**
     * 
     * Create OPERATION
     * 
     */
    let operation: Operation
    try {
      operation = await Operation.create(this.gate, symbol)
    } catch (e) {
      console.log('🚨 ERROR CREATING OPERATION :', this.gate.getGateResponseError(e))
      console.log('🚨 Signal ignored')
      return
    }
    this.operations[operation.id] = operation

    /**
     * 
     * Handle OPERATION end
     */
    operation.subscribe('operationEnd', (event) => {
      delete this.operations[event.detail.operation.id]
    })

    /**
     * 
     * Ready!
     * 
     */
    this.isBusy = false
  }
}


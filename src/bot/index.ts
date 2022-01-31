import { config } from '@/config'
import { GateClient } from '../lib/gate-client'
import { AssetPair, SymbolName } from '../lib/gate-client/types'
import WebsocketConnection from '../lib/websocket'
import { getSymbolsFromMessage } from './message-process'
import { Operation } from './operation'
import { CLI } from './cli'


const AllowedSignals = [
  "Binance Will List",
  "자산 추가",
  "Coinbase Pro available",
  "Launching on Coinbase Pro"
]

export class EarlyBuyBot {
  constructor(gate: GateClient, socket: WebsocketConnection) {
    this.gate = gate
    this.socket = socket
    console.log('Listening for new assets announcements...')
    console.log
    console.log('')

    const cli = new CLI(this)

    this.socket.subscribe('message', (event) => {
      const { message } = event.detail
      if (typeof message === 'string') {
        let isSupportedSignal: boolean = AllowedSignals.some(i => message.toLowerCase().includes(i.toLowerCase()))
        if (!isSupportedSignal) return
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


  public async createOperation(symbol: SymbolName): Promise<void> {
    console.log(`New asset announced: ${symbol}`)

    if (this.isBusy) console.log('Busy creating another operation. Ignoring announcement...')
    else this.isBusy = true


    /**
     * 
     * BLOCK if there is another ongoing Operation with the same AssetPair
     * 
     */
    const assetPair: AssetPair = `${symbol}_USDT`
    if (this.operations[assetPair]) {
      console.log(`There is another ongoing Operation for ${assetPair}. Ignoring announcement...`)
      return
    }

    /**
     * 
     * BLOCK if limit of simultaneous operations is reached
     * 
     */
    if (Object.keys(this.operations).length === config.operation.maxSimultaneousOperations) {
      console.log('Max simultaneous operations limit reached. Ignoring announcement...')
      return
    }

    /**
     * 
     * Create OPERATION
     * 
     */
    let operation: Operation
    try {
      console.log(`Creating operation for ${assetPair}...`)
      operation = await Operation.create(this.gate, symbol)
    } catch (e) {
      console.log(`ERROR creating operation ${assetPair} :`, this.gate.getGateResponseError(e))
      return
    }
    this.operations[operation.id] = operation

    /**
     * 
     * Handle OPERATION events
     */
    operation.subscribe('operationStarted', (event) => {
      console.log(`Operation ${operation.id} started! (${assetPair}`)
    })

    operation.subscribe('operationFinished', (event) => {
      console.log(`Operation ${operation.id} ended! (${assetPair}`)
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


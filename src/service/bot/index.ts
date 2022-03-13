import { config } from '@/config'
import { AssetPair, SymbolName } from '../gate-client/types'
import { Operation } from './operation'
import { clearDir, createPath, getProjectRootDir } from '@/lib/file'
import fs from 'fs'
import { Console } from '@/service/console'
import { Gate } from '@/service/gate-client'
import { SignalsHub } from '../signals-hub'


function initializeLogsDirectory() {
  const logsAbsPath = createPath(getProjectRootDir(), config.logsPath)
  Console.log('Initializing LOGS directory...')

  // create directory if doe snot exist
  if (!fs.existsSync(logsAbsPath)) {
    try { fs.mkdirSync(logsAbsPath) }
    catch (e) { /** DO NOTHING */ }
  }
  if (!fs.existsSync(logsAbsPath)) {
    throw new Error(`Cannot create LOGS directory`)
  }

  // empty directory 
  if (config.cleanLogsPathOnStart) {
    Console.log('Cleaning LOGS directory...')
    clearDir(logsAbsPath)
  }
}


class TradingBotService {
  async start() {
    Console.log('Initializing Bot')
    initializeLogsDirectory()

    SignalsHub.subscribe('connection', async (event) => {
      const address = event.detail.address
      Console.log('[SIGNALS_HUB] : New connection', address)
    })

    SignalsHub.subscribe('message', async (event) => {
      const data = event.detail

      Console.log('--------------')
      Console.log('[SIGNALS_HUB] Message type:', data.type)
      Console.log('[SIGNALS_HUB] Message from:', data.serverName)
      Console.log('[SIGNALS_HUB] Message asset:', data.assetName)
      Console.log('[SIGNALS_HUB] Detection LAG:', Date.now() - data.messageTime)
      Console.log('[SIGNALS_HUB] Sending LAG:', Date.now() - data.sendTime)
      Console.log('--------------')
      const symbol = data.assetName
      const assetPair: AssetPair = `${symbol}_USDT`

      // Block if asset is not available or is not tradeable
      if (!Gate.assetPairs[assetPair]) {
        Console.log(`[SIGNALS_HUB] Symbol ${data.assetName} not found on Gate.io.Ignoring signal`)
        return
      }
      if (!Gate.assetPairs[assetPair].tradeStatus) {
        Console.log(`[SIGNALS_HUB] Symbol ${data.assetName} found on Gate.io but is not tradeable. Ignoring signal`)
        return
      }

      if (data.type === 'TEST') {
        Console.log(`[SIGNALS_HUB] Testing message detected. Ignoring`)
        return
      }

      await this.createOperation(symbol)
    })

    Console.log('Listening for new assets announcements...')

  }

  operations: Record<string, Operation> = {}
  isCreatingAnotherOperation: boolean = false


  public async createOperation(symbol: SymbolName): Promise<void> {
    Console.log(`New asset announced: ${symbol}`)

    if (this.isCreatingAnotherOperation) {
      Console.log('Busy creating another operation. Ignoring announcement...')
      return
    }

    this.isCreatingAnotherOperation = true


    /**
     * 
     * BLOCK if there is another ongoing Operation with the same AssetPair
     * 
     */
    const assetPair: AssetPair = `${symbol}_USDT`
    if (this.operations[assetPair]) {
      Console.log(`There is another ongoing Operation for ${assetPair}. Ignoring announcement...`)
      this.isCreatingAnotherOperation = false
      return
    }

    /**
     * 
     * BLOCK if limit of simultaneous operations is reached
     * 
     */
    if (Object.keys(this.operations).length === config.operation.maxSimultaneousOperations) {
      Console.log('Max simultaneous operations limit reached. Ignoring announcement...')
      this.isCreatingAnotherOperation = false
      return
    }

    /**
     * 
     * Create OPERATION
     * 
     */
    let operation: Operation
    try {
      Console.log(`Creating operation for ${assetPair}...`)
      operation = await Operation.create(symbol)
      Console.log(`Operation ${operation.id} started! (${assetPair}`)
    } catch (e) {
      Console.log(`ERROR creating operation ${assetPair} :`, Gate.getGateResponseError(e))
      this.isCreatingAnotherOperation = false
      return
    }
    this.operations[operation.id] = operation

    /**
     * 
     * Handle OPERATION events
     */
    operation.subscribe('operationFinished', (event) => {
      Console.log('Finish reason : ', event.detail.reason)
      Console.log(`Operation ${operation.id} ended! (${assetPair}`)
      delete this.operations[event.detail.operation.id]
    })

    /**
     * 
     * Ready!
     * 
     */
    this.isCreatingAnotherOperation = false
  }

}


export const TradingBot = new TradingBotService()

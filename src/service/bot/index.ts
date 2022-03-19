import { getPercentage, toFixed } from '@/lib/math'
import { config } from '@/config'
import { AssetPair, SymbolName } from '../gate-client/types'
import { Operation } from './operation'
import { clearDir, createPath, getProjectRootDir } from '@/lib/file'
import fs from 'fs'
import { Console } from '@/service/console'
import { Gate } from '@/service/gate-client'
import { SignalsHub } from '../signals-hub'

export type CreateOperationBudget = { amount: number, unit: 'percentage' | 'absolute' }

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

  public readonly operations: Record<string, Operation> = {}

  private isCreatingAnotherOperation: boolean = false

  async start() {
    Console.log('Initializing Bot')
    initializeLogsDirectory()

    SignalsHub.subscribe('connection', async (event) => {
      const address = event.detail.address
      Console.log('[SIGNALS_HUB] New connection', address)
    })

    SignalsHub.subscribe('message', async (event) => {
      const data = event.detail
      const timeSinceEmissionInMillis = Date.now() - data.messageTime
      Console.log('--------------')
      Console.log('[SIGNALS_HUB] Message type:', data.type)
      Console.log('[SIGNALS_HUB] Message from:', data.serverName)
      Console.log('[SIGNALS_HUB] Message asset:', data.assetName)
      Console.log('[SIGNALS_HUB] Announcement LAG:', timeSinceEmissionInMillis)
      Console.log('[SIGNALS_HUB] Sending LAG:', Date.now() - data.sendTime)
      Console.log('--------------')
      const symbol = data.assetName
      const assetPair: AssetPair = `${symbol}_USDT`

      // Block if signal is too old
      if (timeSinceEmissionInMillis > config.signalHub.maxSignalAgeInMillis) {
        Console.log(`[SIGNALS_HUB] Signal for ${data.assetName} is too old ${Math.ceil(timeSinceEmissionInMillis / 1000)} seconds. Ignoring`)
        return
      }
      // Block if asset is not available or is not tradeable
      if (!Gate.assetPairs[assetPair]) {
        Console.log(`[SIGNALS_HUB] Symbol ${data.assetName} not found on Gate.io.Ignoring signal`)
        return
      }
      if (!Gate.assetPairs[assetPair].tradeStatus) {
        Console.log(`[SIGNALS_HUB] Symbol ${data.assetName} found on Gate.io but is not tradeable.Ignoring signal`)
        return
      }

      if (data.type === 'TEST') {
        Console.log(`[SIGNALS_HUB] Testing message detected.Ignoring`)
        return
      }
      await this.createOperation(
        symbol,
        { amount: config.operation.operationUseBalancePercent, unit: 'percentage' }
      )
    })

    Console.log('Listening for new assets announcements...')

  }


  public async createOperation(
    symbol: SymbolName,
    budget: CreateOperationBudget
  ): Promise<void> {
    Console.log(`New asset announced: ${symbol} `)

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
    const assetPair: AssetPair = `${symbol} _USDT`
    if (this.operations[assetPair]) {
      Console.log(`There is another ongoing Operation for ${assetPair}.Ignoring announcement...`)
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
     * Get available USDT BALANCE
     * 
     */
    let availableUSDTBalance: number
    try {
      availableUSDTBalance = await Gate.geAvailableBalanceUSDT()
    } catch (e) {
      Console.log('Error ocurred retrieving available USDT balance Gate.io!')
      this.isCreatingAnotherOperation = false
      return
    }

    const usdtPrecision = Gate.assetPairs[assetPair].precision!
    const operationBudget: number = (budget.unit === 'absolute')
      ? Number(toFixed(budget.amount, usdtPrecision))
      : Number(toFixed(getPercentage(availableUSDTBalance, budget.amount), usdtPrecision))


    /**
      * 
      * Block if USDT amount is not available
      * 
      */
    if (operationBudget > availableUSDTBalance) {
      Console.log(`Requested amount is greater than available amount in USDT(${availableUSDTBalance})`)
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
      Console.log(`Creating operation for ${assetPair}(${operationBudget}USDT)`)
      operation = await Operation.create(symbol, operationBudget)
      this.operations[operation.id] = operation
      Console.log(`Operation #${operation.id} started!(${assetPair})`)
    } catch (e) {
      Console.log(`ERROR creating operation ${assetPair} : `, Gate.getGateResponseError(e))
      this.isCreatingAnotherOperation = false
      return
    }

    /**
     * 
     * Handle OPERATION events
     */
    operation.subscribe('operationFinished', (event) => {
      Console.log('Finish reason : ', event.detail.reason)
      Console.log(`Operation #${operation.id} ended!(${assetPair})`)
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

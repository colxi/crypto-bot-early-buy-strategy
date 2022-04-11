import { config } from '@/config'
import { Order } from 'gate-api'
import { getDateAsDDMMYYYY, getTimeAsHHMMSS } from '../../../lib/date'
import EventedService from '../../../lib/evented-service'
import {
  AssetPair,
  GateOrderDetails,
  SymbolName,
  Timestamp,
} from '@/service/gate-client/types'
import {
  OperationBuyOrderDetails,
  OperationEndReason,
  OperationTriggeredOrderDetails,
  OperationTriggeredOrderType,
  ServiceEvents
} from './types'
import { OperationError } from './operation-error'
import { Logger as Logger } from '../../../lib/logger'
import { createBuyOrder } from './create-buy-order'
import { createTakeProfitTriggeredOrder } from './create-take-profit-triggered-order'
import { createStopLossTriggeredOrder } from './create-stop-loss-triggered-order.ts'
import { createEmergencySellOrder } from './create-emergency-sell-order'
import { hasFulfilledTriggeredOrder } from './has-fulfilled-triggered-order'
import { sendEmail } from '../send-email'
import { Gate } from '@/service/gate-client'
import { Console } from '@/service/console'
import { toFixed } from '@/lib/math'

let lastOperationId: number = 0

enum OperationStatus {
  ACTIVE,
  FINISHED
}
export class Operation extends EventedService<ServiceEvents> {
  private constructor(
    symbol: SymbolName,
    buyOrderDetails: OperationBuyOrderDetails,
    startTime: number,
    logger: Logger
  ) {
    super()

    this.id = lastOperationId++
    this.symbol = symbol
    this.assetPair = `${symbol}_USDT`
    this.lastAssetPairPrice = Number(buyOrderDetails.originalAssetPrice)
    this.assetAllTimeLow = Number(buyOrderDetails.originalAssetPrice)
    this.assetAllTimeHigh = Number(buyOrderDetails.originalAssetPrice)
    this.amountPendingToSell = Number(buyOrderDetails.amount)
    this.startTime = startTime
    this.logger = logger
    this.buyOrderDetails = buyOrderDetails
    this.emergencySellOrders = []
    this.takeProfitTriggeredOrderDetails = null
    this.stopLossTriggeredOrderDetails = null
    this.operationStatus = OperationStatus.ACTIVE

    this.createTriggeredOrders().catch((e) => { throw e })
    this.startContextTracking()
    this.dispatchEvent('operationStarted', { operation: this })
  }

  // INTERNALS
  private operationStatus: OperationStatus
  private readonly logger: Logger

  // OPERATION META
  public readonly id: number
  public readonly startTime: Timestamp
  public readonly assetPair: AssetPair
  public readonly symbol: SymbolName
  public lastAssetPairPrice: number
  public assetAllTimeLow: number
  public assetAllTimeHigh: number
  public amountPendingToSell: number

  // TIMERS
  private priceTrackingTimer: NodeJS.Timeout | undefined
  private operationTrackingTimer: NodeJS.Timeout | undefined

  // ORDERS
  public emergencySellOrders: GateOrderDetails[]
  public takeProfitTriggeredOrderDetails: OperationTriggeredOrderDetails | null
  public stopLossTriggeredOrderDetails: OperationTriggeredOrderDetails | null
  public buyOrderDetails: OperationBuyOrderDetails


  /*------------------------------------------------------------------------------------------------
   * 
   * 
   * OPERATION CREATION AND FINISHING METHODS
   * 
   * 
   * ----------------------------------------------------------------------------------------------*/


  public static async create(symbol: SymbolName, budget: number): Promise<Operation> {
    const startTime = Date.now()
    const assetPair: AssetPair = `${symbol}_USDT`
    const logFilename = `${getDateAsDDMMYYYY(startTime)}_${getTimeAsHHMMSS(startTime, '.')}_${symbol}`
    const logger = new Logger(logFilename)

    logger.log(`New operation : ${assetPair}`)
    logger.log(`Operation start time: ${getDateAsDDMMYYYY(startTime)} ${getTimeAsHHMMSS(startTime)}`)

    let buyAttempt = 0
    while (true) {
      try {
        const orderType = buyAttempt < config.buy.fallbackToPartialAfterAttempts
          ? 'fok'
          : 'ioc'
        const buyOrderDetails = await createBuyOrder(
          symbol,
          assetPair,
          budget,
          orderType,
          startTime,
          logger
        )
        return new Operation(symbol, buyOrderDetails, startTime, logger)
      }
      catch (e) {
        const elapsed = Date.now() - startTime
        if (elapsed > config.buy.retryLimitInMillis) throw e
        buyAttempt++
      }
    }
  }


  public async finish<END_REASON extends OperationEndReason>(
    ...[endingReason, error]: END_REASON extends OperationEndReason.ERROR
      ? [END_REASON, Error]
      : [END_REASON]
  ): Promise<void> {

    if (this.operationStatus === OperationStatus.FINISHED) {
      this.logger.error('OPERATION ALREADY FINISHED, CANNOT FINISH AN OPERATION TWICE')
      return
    } else this.operationStatus = OperationStatus.FINISHED

    Console.log(`Finishing Operation due to ${endingReason}...`)

    this.logger.lineBreak()
    this.logger.log(`Finishing Operation due to ${endingReason}...`)

    this.logger.warning('Stopping Operation tracking')
    clearInterval(this.operationTrackingTimer!)

    if (endingReason === OperationEndReason.ERROR) await this.handleOperationError(error)
    await this.cancelRemainingOperationOrders()

    this.logger.warning('Stopping price tracking')
    clearTimeout(this.priceTrackingTimer!)

    this.logger.lineBreak()
    this.logger.log('- Operation finished')

    this.dispatchEvent('operationFinished', { operation: this, reason: endingReason })
  }


  async handleOperationError(e: unknown) {
    const error: Error = e instanceof Error ? e : new Error(String(e))
    const isKnownError = OperationError.isOperationError(error)

    this.logger.lineBreak()
    this.logger.error(`Handling Operation error...`)
    this.logger.error(` - Operation ERROR : ${error?.message}`)
    if (isKnownError) this.logger.error(` - Operation ERROR Data:`, JSON.stringify(error.data))

    // TODO:  check if has negative impact on time
    // sendEmail('EMERGENCY SELL order required.').catch((e) => { this.logger.error('Error sending EMERGENCY SELL email', e) })

    let attemptCounter = 0
    let currentPricePercentModifier = 0
    const amountPrecision = Gate.assetPairs[this.assetPair].amountPrecision!
    while (true) {
      this.logger.error(` - Creating EMERGENCY SELL order (Attempt ${attemptCounter})...`)
      try {
        const order = await this.createEmergencySellOrder(this.amountPendingToSell, currentPricePercentModifier)
        // Order Error handling
        const fillPrice = Number(order.fill_price)
        const isCancelled = order.status === Order.Status.Cancelled
        Console.log(`EmergencySell status : ${order.status}`)
        Console.log(`EmergencySell fillPrice : ${fillPrice}`)
        Console.log(`EmergencySell left : ${order.left}`)
        Console.log(`EmergencySell sold amount : ${order.amount}`)
        Console.log(`EmergencySell fee : ${order.fee}`)
        if (isCancelled && !fillPrice) throw new Error(`EMERGENCY SELL status = ${order.status}`)
        this.emergencySellOrders.push(order)
        // order succeeded! calculate sold amount
        const effectiveAmount = toFixed(Number(order.amount) - Number(order.left), amountPrecision)
        Console.log(`EmergencySell, sold ${effectiveAmount}${this.symbol} of ${this.amountPendingToSell} ${this.symbol}`)
        this.logger.info(`EmergencySell, sold ${effectiveAmount} of ${this.amountPendingToSell} ${this.symbol}`)

        this.amountPendingToSell -= Number(effectiveAmount)
        const pendingAmountInUSD = this.lastAssetPairPrice * this.amountPendingToSell
        this.logger.error(`Pending to sell : ${this.amountPendingToSell} (${pendingAmountInUSD} USD)`)
        Console.log(`Pending to sell : ${this.amountPendingToSell} (${pendingAmountInUSD} USD)`)
        // if pending amount in USD is lowe than value set in config, end!
        if (pendingAmountInUSD < config.emergencySell.stopOnPendingAmountUSD) break
      } catch (e) {
        this.logger.error(' - EMERGENCY SELL order creation failed!')
        this.logger.error(` - ERROR DETAILS : ${Gate.getGateResponseError(e)}`)
        currentPricePercentModifier += config.emergencySell.retryPercentModifier
        if (currentPricePercentModifier < config.emergencySell.retryPercentModifierLimit) {
          currentPricePercentModifier = config.emergencySell.retryPercentModifierLimit
        }
      }
      if (attemptCounter > config.emergencySell.maxAttempts) {
        this.logger.error('Maximum Emergency sell attempts!')
        Console.log('Maximum Emergency sell attempts!')
        break
      }
      attemptCounter++
    }

    this.logger.success(' - EMERGENCY SELL order executed...')
  }

  /*------------------------------------------------------------------------------------------------
   * 
   * 
   * ORDERS CREATION METHODS
   * 
   * 
   * ----------------------------------------------------------------------------------------------*/


  private async createTriggeredOrders(): Promise<void> {
    try {
      await this.createTakeProfitTriggeredOrder()
      await this.createStopLossTriggeredOrder()
    } catch (e) {
      await this.finish(OperationEndReason.ERROR, e as Error)
    }
  }


  private async createTakeProfitTriggeredOrder(): Promise<void> {
    this.takeProfitTriggeredOrderDetails = await createTakeProfitTriggeredOrder(
      this.symbol,
      this.assetPair,
      this.startTime,
      this.buyOrderDetails.buyPrice,
      this.buyOrderDetails.amount,
      this.logger
    )
  }


  private async createStopLossTriggeredOrder(): Promise<void> {
    this.stopLossTriggeredOrderDetails = await createStopLossTriggeredOrder(
      this.symbol,
      this.assetPair,
      this.startTime,
      this.buyOrderDetails.buyPrice,
      this.buyOrderDetails.amount,
      this.logger
    )
  }


  private async createEmergencySellOrder(amount: number, modifier: number): Promise<GateOrderDetails> {
    return await createEmergencySellOrder(
      this.symbol,
      this.assetPair,
      this.startTime,
      this.buyOrderDetails.buyPrice,
      String(amount),
      this.logger,
      modifier
    )
  }

  private async cancelRemainingOperationOrders(): Promise<void> {
    //  Purge TAKE PROFIT order
    try {
      await Gate.purgeTriggeredOrder(this.takeProfitTriggeredOrderDetails!.id, this.assetPair)
    } catch (e) {
      const status = (e as any)?.response?.status
      if (status !== 400) this.logger.error('Error purging TAKE PROFIT TRIGGERED order')
    }

    //  Purge STOP LOSS order
    try {
      await Gate.purgeTriggeredOrder(this.stopLossTriggeredOrderDetails!.id, this.assetPair)
    } catch (e) {
      const status = (e as any)?.response?.status
      if (status !== 400) this.logger.error('Error purging STOP LOSS TRIGGERED order')
    }
  }


  /*------------------------------------------------------------------------------------------------
  * 
  * 
  * OPERATION TRACKING METHODS
  * 
  * 
  * ----------------------------------------------------------------------------------------------*/

  private startContextTracking() {
    this.operationTrackingTimer = setInterval(
      () => { this.trackOperationOrders().catch(() => Console.log('Failure on "trackOperationOrders"')) },
      config.operation.orderTrackingIntervalInMillis
    )
    this.priceTrackingTimer = setInterval(
      () => { this.trackAssetPairPrice().catch(() => Console.log('Failure on "trackAssetPairPrice"')) },
      config.operation.priceTrackingIntervalInMillis
    )
  }


  private async trackAssetPairPrice(): Promise<void> {
    // Track only when all orders have been placed (operation is ongoing)
    if (!this.takeProfitTriggeredOrderDetails || !this.stopLossTriggeredOrderDetails) return
    try {
      const assetPairPrice = await Gate.getAssetPairPrice(this.assetPair)
      // if operation is marked as  finished store price but don't pollute the 
      // log file with price data
      this.storeAssetPrice(assetPairPrice)
      if (this.operationStatus !== OperationStatus.FINISHED) {
        this.logger.info(this.assetPair, 'AssetPair Price : ', assetPairPrice)
      }
    } catch (e) {
      this.logger.error('Error tracking assetPairPrice', this.buyOrderDetails.id, Gate.getGateResponseError(e))
    }
  }

  private storeAssetPrice(assetPairPrice: number) {
    this.lastAssetPairPrice = assetPairPrice
    if (assetPairPrice < this.assetAllTimeLow) this.assetAllTimeLow = assetPairPrice
    if (assetPairPrice > this.assetAllTimeHigh) this.assetAllTimeHigh = assetPairPrice
  }

  private async trackOperationOrders(): Promise<void> {
    if (this.operationStatus === OperationStatus.FINISHED) return

    // Track only when all orders have been placed
    if (!this.takeProfitTriggeredOrderDetails || !this.stopLossTriggeredOrderDetails) return

    try {
      const isTakeProfitOrderFulfilled = await hasFulfilledTriggeredOrder(
        OperationTriggeredOrderType.TAKE_PROFIT,
        this.takeProfitTriggeredOrderDetails.id,
        this.assetPair,
        this.logger
      )
      if (isTakeProfitOrderFulfilled) {
        await this.finish(OperationEndReason.TAKE_PROFIT_FULFILLED)
        return
      }
    } catch (e) {
      await this.finish(OperationEndReason.ERROR, e as Error)
      return
    }

    try {
      const isStopLossOrderFulfilled = await hasFulfilledTriggeredOrder(
        OperationTriggeredOrderType.STOP_LOSS,
        this.stopLossTriggeredOrderDetails.id,
        this.assetPair,
        this.logger
      )
      if (isStopLossOrderFulfilled) {
        await this.finish(OperationEndReason.STOP_LOSS_FULFILLED)
        return
      }
    } catch (e) {
      await this.finish(OperationEndReason.ERROR, e as Error)
      return
    }
  }
}

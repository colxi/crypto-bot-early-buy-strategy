import { config } from '@/config'
import { Order } from 'gate-api'
import { GateClient } from '../../lib/gate-client'
import { getDateAsDDMMYYYY, getTimeAsHHMMSS } from '../../lib/date'
import EventedService from '../../lib/evented-service'
import {
  AssetPair,
  GateNewTriggeredOrderDetails,
  GateOrderDetails,
  SymbolName,
  Timestamp,
} from '@/lib/gate-client/types'
import { OperationEndReason, OperationTriggeredOrderType, ServiceEvents } from './types'
import { OperationError } from './operation-error'
import { OperationLogger as OperationLogger } from './operation-logger'
import { createBuyOrder } from './create-buy-order'
import { createTakeProfitTriggeredOrder } from './create-take-profit-triggered-order'
import { createStopLossTriggeredOrder } from './create-stop-loss-triggered-order.ts'
import { createEmergencySellOrder } from './create-emergency-sell-order'
import { hasFulfilledTriggeredOrder } from './has-fulfilled-triggered-order'
import { sendEmail } from '../send-email'

let lastOperationId: number = 0

enum OperationStatus {
  ACTIVE,
  FINISHED
}
export class Operation extends EventedService<ServiceEvents> {
  private constructor(
    gate: GateClient,
    symbol: SymbolName,
    buyOrder: GateOrderDetails,
    amount: string,
    startTime: number,
    logger: OperationLogger
  ) {
    super(['operationStarted', 'operationFinished'])

    this.id = lastOperationId++
    this.gate = gate
    this.symbol = symbol
    this.assetPair = `${symbol}_USDT`
    this.startTime = startTime
    this.logger = logger
    this.amount = amount
    this.buyOrder = buyOrder
    this.emergencySellOrder = null
    this.takeProfitTriggeredOrder = null
    this.stopLossTriggeredOrder = null
    this.operationStatus = OperationStatus.ACTIVE

    this.createTriggeredOrders().catch((e) => { throw e })
    this.startContextTracking()
    this.dispatchEvent('operationStarted', { operation: this })
  }


  public readonly id: number
  public readonly assetPair: AssetPair
  public readonly symbol: SymbolName
  public readonly amount: string
  public readonly startTime: Timestamp
  private readonly logger: OperationLogger
  private readonly gate: GateClient
  private priceTrackingTimer: NodeJS.Timeout | undefined
  private operationTrackingTimer: NodeJS.Timeout | undefined
  private buyOrder: GateOrderDetails
  private takeProfitTriggeredOrder: GateNewTriggeredOrderDetails | null
  private stopLossTriggeredOrder: GateNewTriggeredOrderDetails | null
  private emergencySellOrder: GateOrderDetails | null
  private operationStatus: OperationStatus


  /*------------------------------------------------------------------------------------------------
   * 
   * 
   * OPERATION CREATION AND FINISHING METHODS
   * 
   * 
   * ----------------------------------------------------------------------------------------------*/


  public static async create(gate: GateClient, symbol: SymbolName): Promise<Operation> {
    const startTime = Date.now()
    const assetPair: AssetPair = `${symbol}_USDT`
    const logFilename = `${getDateAsDDMMYYYY(startTime)}_${getTimeAsHHMMSS(startTime, '.')}_${symbol}`
    const logger = new OperationLogger(logFilename)

    logger.log(`New operation : ${assetPair}`)
    logger.log(`Operation start time: ${getDateAsDDMMYYYY(startTime)} ${getTimeAsHHMMSS(startTime)}`)

    while (true) {
      try {
        const { order, amount } = await createBuyOrder(gate, symbol, assetPair, startTime, logger)
        return new Operation(gate, symbol, order, amount, startTime, logger)
      }
      catch (e) {
        const elapsed = Date.now() - startTime
        if (elapsed > config.buy.retryLimitInMillis) throw e
      }
    }
  }


  public async finish<END_REASON extends OperationEndReason>(
    ...[endingReason, error]: END_REASON extends OperationEndReason.ERROR
      ? [END_REASON, Error]
      : [END_REASON]
  ): Promise<void> {
    this.operationStatus = OperationStatus.FINISHED

    this.logger.lineBreak()
    this.logger.log(`Finishing Operation due to ${endingReason}...`)

    await this.stopOperationTracking()
    await this.cancelRemainingOperationOrders()

    if (endingReason === OperationEndReason.ERROR) await this.handleOperationError(error)

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

    try {
      await sendEmail('EMERGENCY SELL order required.')
    } catch (e) { this.logger.error('Error sending EMERGENCY SELL email', e) }

    let attemptCounter = 0
    let currentPercentModifier = 0
    while (true) {
      this.logger.error(` - Creating EMERGENCY SELL order (Attempt ${attemptCounter})...`)
      try {
        await this.createEmergencySellOrder(currentPercentModifier)
        if (this.emergencySellOrder?.status === Order.Status.Closed) break
        else {
          throw new Error(`EMERGENCY SELL status = ${this.emergencySellOrder?.status}`)
        }
      } catch (e) {
        this.logger.error(' - EMERGENCY SELL order creation failed!')
        this.logger.error(` - ERROR DETAILS : ${this.gate.getGateResponseError(e)}`)
      }
      attemptCounter++
      currentPercentModifier += config.emergencySell.retryPercentModifier
      if (currentPercentModifier > config.emergencySell.retryPercentModifierLimit) {
        currentPercentModifier = config.emergencySell.retryPercentModifierLimit
      }
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
    this.takeProfitTriggeredOrder = await createTakeProfitTriggeredOrder(
      this.gate,
      this.symbol,
      this.assetPair,
      this.startTime,
      this.buyOrder.price,
      this.amount,
      this.logger
    )
  }


  private async createStopLossTriggeredOrder(): Promise<void> {
    this.stopLossTriggeredOrder = await createStopLossTriggeredOrder(
      this.gate,
      this.symbol,
      this.assetPair,
      this.startTime,
      this.buyOrder.price,
      this.amount,
      this.logger
    )
  }


  private async createEmergencySellOrder(modifier: number = 0): Promise<void> {
    this.emergencySellOrder = await createEmergencySellOrder(
      this.gate,
      this.symbol,
      this.assetPair,
      this.startTime,
      this.buyOrder.price,
      this.amount,
      this.logger,
      modifier
    )
  }

  private async cancelRemainingOperationOrders(): Promise<void> {
    //  Purge TAKE PROFIT order
    try {
      await this.gate.purgeTriggeredOrder(this.takeProfitTriggeredOrder!.id, this.assetPair)
    } catch (e) {
      const status = (e as any)?.response?.status
      if (status !== 400) this.logger.error('Error purging TAKE PROFIT TRIGGERED order')
    }

    //  Purge STOP LOSS order
    try {
      await this.gate.purgeTriggeredOrder(this.stopLossTriggeredOrder!.id, this.assetPair)
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
      () => { this.trackOperationOrders().catch(() => console.log('Failure on "trackOperationOrders"')) },
      config.operation.orderTrackingIntervalInMillis
    )
    this.priceTrackingTimer = setInterval(
      () => { this.trackAssetPairPrice().catch(() => console.log('Failure on "trackAssetPairPrice"')) },
      config.operation.priceTrackingIntervalInMillis
    )
  }


  private async stopOperationTracking() {
    this.logger.warning('Stopping Operation tracking')
    clearInterval(this.priceTrackingTimer!)
    clearInterval(this.operationTrackingTimer!)
  }


  private async trackAssetPairPrice(): Promise<void> {
    if (this.operationStatus === OperationStatus.FINISHED) return

    // Track only when all orders have been placed
    if (!this.takeProfitTriggeredOrder || !this.stopLossTriggeredOrder) return
    try {
      const assetPairPrice = await this.gate.getAssetPairPrice(this.assetPair)
      this.logger.info(this.assetPair, 'AssetPair Price : ', assetPairPrice)
    } catch (e) {
      this.logger.error('Error tracking assetPairPrice', this.buyOrder.id, this.gate.getGateResponseError(e))
    }
  }


  private async trackOperationOrders(): Promise<void> {
    if (this.operationStatus === OperationStatus.FINISHED) return

    // Track only when all orders have been placed
    if (!this.takeProfitTriggeredOrder || !this.stopLossTriggeredOrder) return

    try {
      const isTakeProfitOrderFulfilled = await hasFulfilledTriggeredOrder(
        OperationTriggeredOrderType.TAKE_PROFIT,
        this.takeProfitTriggeredOrder.id,
        this.gate,
        this.assetPair,
        this.logger
      )
      if (isTakeProfitOrderFulfilled) {
        await this.finish(OperationEndReason.TAKE_PROFIT_FULFILLED)
        return
      }
    } catch (e) {
      await this.finish(OperationEndReason.ERROR, e as Error)
    }

    try {
      const isStopLossOrderFulfilled = await hasFulfilledTriggeredOrder(
        OperationTriggeredOrderType.STOP_LOSS,
        this.stopLossTriggeredOrder.id,
        this.gate,
        this.assetPair,
        this.logger
      )
      if (isStopLossOrderFulfilled) {
        await this.finish(OperationEndReason.STOP_LOSS_FULFILLED)
        return
      }
    } catch (e) {
      await this.finish(OperationEndReason.ERROR, e as Error)
    }
  }
}

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

let lastOperationId: number = 0

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

    this.createTriggeredOrders()
    this.startOperationTracking()
    this.dispatchEvent('operationStarted', { operation: this })
  }


  public readonly id: number
  private readonly logger: OperationLogger
  private readonly gate: GateClient
  private readonly symbol: SymbolName
  private readonly assetPair: AssetPair
  private readonly startTime: Timestamp
  private readonly amount: string
  private priceTrackingTimer: NodeJS.Timeout | undefined
  private operationTrackingTimer: NodeJS.Timeout | undefined
  private buyOrder: GateOrderDetails
  private emergencySellOrder: GateOrderDetails | null
  private takeProfitTriggeredOrder: GateNewTriggeredOrderDetails | null
  private stopLossTriggeredOrder: GateNewTriggeredOrderDetails | null


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

    let count = 0
    while (true) {
      try {
        const { order, amount } = await createBuyOrder(gate, symbol, assetPair, startTime, logger)
        return new Operation(gate, symbol, order, amount, startTime, logger)
      }
      catch (e) {
        count++
        if (count > 20) throw e
      }
    }
  }


  public async finish<END_REASON>(
    ...[endingReason, error]: END_REASON extends OperationEndReason.ERROR
      ? [END_REASON, Error]
      : [END_REASON]
  ): Promise<void> {
    this.logger.info()
    this.logger.info(`Finishing Operation due to ${endingReason}...`)

    this.stopOperationTracking()

    // TODO: Close sell and stop loss orders

    if (endingReason === OperationEndReason.ERROR) {
      this.logger.error(` - Operation ERROR : ${error?.message}`)
      if (OperationError.isOperationError(error)) this.logger.error(` - Operation ERROR Data:`, error.data)
      this.logger.info(' - Creating EMERGENCY SELL order...')
      try {
        await this.createEmergencySellOrder()
        const isEmergencySellOrderComplete = this.emergencySellOrder?.status === Order.Status.Closed
        if (isEmergencySellOrderComplete) this.logger.success(' - EMERGENCY SELL order executed...')
        else throw new Error()
      } catch (e) {
        this.logger.error(' - Failed creating EMERGENCY SELL order! Manual handling required!')
        // TODO: Send notification to user
      }

      this.logger.info()
      this.logger.info('- Operation finished')
      this.dispatchEvent('operationFinished', { operation: this, reason: endingReason })
    }
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


  private async createEmergencySellOrder(): Promise<void> {
    this.emergencySellOrder = await createEmergencySellOrder(
      this.gate,
      this.symbol,
      this.assetPair,
      this.startTime,
      this.buyOrder.price,
      this.amount,
      this.logger
    )
  }


  /*------------------------------------------------------------------------------------------------
  * 
  * 
  * OPERATION TRACKING METHODS
  * 
  * 
  * ----------------------------------------------------------------------------------------------*/


  private startOperationTracking() {
    this.operationTrackingTimer = setInterval(
      () => this.trackOperationOrders(),
      config.operation.orderTrackingIntervalInMillis
    )
    this.priceTrackingTimer = setInterval(
      () => this.trackAssetPairPrice(),
      config.operation.priceTrackingIntervalInMillis
    )
  }


  private stopOperationTracking() {
    clearInterval(this.priceTrackingTimer!)
    clearInterval(this.operationTrackingTimer!)
  }


  private async trackAssetPairPrice(): Promise<void> {
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
      if (isTakeProfitOrderFulfilled) await this.finish(OperationEndReason.TAKE_PROFIT_FULFILLED)
      return
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
      if (isStopLossOrderFulfilled) await this.finish(OperationEndReason.STOP_LOSS_FULFILLED)
      return
    } catch (e) {
      await this.finish(OperationEndReason.ERROR, e as Error)
    }
  }
}

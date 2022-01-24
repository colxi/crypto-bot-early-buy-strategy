import { config } from '@/config'
import { Order, SpotPricePutOrder, SpotPriceTrigger } from 'gate-api'
import { GateClient } from '../../lib/gate-client'
import { getDateAsDDMMYYYY, getTimeAsHHMMSS, TimeInSeconds } from '../../lib/date'
import EventedService from '../../lib/evented-service'
import { applyPercentage, getPercentage, toFixed } from '../../lib/math'
import {
  AssetPair,
  GateOrderDetails,
  SymbolName,
  Timestamp
} from '@/lib/gate-client/types'
import { OperationEndReason, ServiceEvents } from './types'
import { OperationError } from './error'
import { OperationErrorCode } from './error/types'

let tradeCount: number = 0

export class Operation extends EventedService<ServiceEvents> {
  private constructor(gate: GateClient, symbol: SymbolName, buyOrder: GateOrderDetails, startTime: number) {
    super(['operationStart', 'operationEnd'])

    this.id = tradeCount++
    this.gate = gate
    this.symbol = symbol
    this.assetPair = `${symbol}_USDT`
    this.startTime = startTime
    this.buyOrder = buyOrder
    this.sellOrder = null
    this.stopLossOrder = null

    this.createSellOrder()
      .then(async () => await this.createStopLossOrder())
      .catch(async (e) => await this.endOperation(OperationEndReason.ERROR, e))

    this.operationTrackingTimer = setInterval(() => this.trackOperation(), config.operation.orderTrackingIntervalInMillis)
    this.priceTrackingTimer = setInterval(() => this.trackAssetPairPrice(), config.operation.priceTrackingIntervalInMillis)

    this.dispatchEvent('operationStart', { operation: this })
  }


  public readonly id: number
  private readonly gate: GateClient
  private readonly symbol: SymbolName
  private readonly assetPair: AssetPair
  private readonly startTime: Timestamp
  private readonly priceTrackingTimer: NodeJS.Timeout
  private readonly operationTrackingTimer: NodeJS.Timeout
  private buyOrder: GateOrderDetails
  private sellOrder: GateOrderDetails | null
  private stopLossOrder: GateOrderDetails | null


  /**
   * 
   * 
   * 
   */
  public static async create(gate: GateClient, symbol: SymbolName): Promise<Operation> {
    const startTime = Date.now()
    const assetPair: AssetPair = `${symbol}_USDT`

    console.log(`Operation start time: ${getDateAsDDMMYYYY(startTime)} ${getTimeAsHHMMSS(startTime)}`)

    /**
     * 
     * Get assetPair price data
     * 
     */
    let assetPairPrice: number
    try {
      assetPairPrice = await gate.getAssetPairPrice(assetPair)
    } catch (e) {
      throw new OperationError(
        `Error ocurred retrieving "${assetPair}" price in Gate.io!`,
        { code: OperationErrorCode.ERROR_GETTING_ASSET_PRICE, }
      )
    }

    /**
     * 
     * Get available USDT BALANCE
     * 
     */
    let availableUSDTBalance: number
    try {
      availableUSDTBalance = await gate.geAvailableBalanceUSDT()
    } catch (e) {
      throw new OperationError(
        `Error ocurred retrieving "${assetPair}" price in Gate.io!`,
        { code: OperationErrorCode.ERROR_GETTING_AVAILABLE_BALANCE, }
      )
    }

    /**
     * 
     * Calculate operation amounts and sizes
     * 
     */
    const operationBudget = getPercentage(availableUSDTBalance, config.operation.operationUseBalancePercent)
    const currencyPrecision = gate.assetPairs[assetPair].amountPrecision!
    const buyPrice = toFixed(applyPercentage(assetPairPrice, config.buy.buyDistancePercent), 2)
    const buyAmount = toFixed(operationBudget / Number(buyPrice), currencyPrecision)
    const operationCost = Number(toFixed(Number(buyAmount) * Number(buyPrice), 2))

    console.log(`Current ${symbol} price:`, assetPairPrice, 'USDT')
    console.log()
    console.log('Creating BUY order...')
    console.log(' - Buy amount :', Number(buyAmount), symbol)
    console.log(' - Buy price :', Number(buyPrice), `USDT (currentPrice + ${config.buy.buyDistancePercent}%)`)
    console.log(' - Operation cost :', operationCost, `USDT (budget: ${operationBudget} USDT )`)

    /**
     * 
     * BLOCK if operation cost is lower than allowed minimum block
     * 
     */
    if (operationCost < config.operation.minimumOperationCostUSD) {
      throw new OperationError(
        `Not enough balance to execute the minimum order : ${config.operation.minimumOperationCostUSD} USDT`,
        { code: OperationErrorCode.MINIMUM_OPERATION_COST_LIMIT }
      )
    }

    /**
     * 
     * Create BUY order
     * 
     */
    let order: GateOrderDetails
    try {
      const { response } = await gate.spot.createOrder({
        currencyPair: assetPair,
        side: Order.Side.Buy,
        amount: buyAmount,
        price: buyPrice,
        // use immediate or cancel (IoC) as we are already targeting a price higher than
        // current. If price is already higher than the targeted, order will be CANCELLED
        // and trade will be aborted
        timeInForce: Order.TimeInForce.Ioc
      })
      order = response.data
    } catch (e) {
      throw new OperationError(
        `Error when trying to execute BUY order "${assetPair}"`,
        { code: OperationErrorCode.ERROR_CREATING_BUY_ORDER, details: gate.getGateResponseError(e) }
      )
    }

    /**
     * 
     * BLOCK if order has not been fulfilled 
     * 
     */
    if (order.status !== Order.Status.Closed) {
      throw new OperationError(
        `BUY order not executed "${assetPair}"`,
        { code: OperationErrorCode.BUY_ORDER_NOT_EXECUTED, status: order.status }
      )
    }

    /**
     * 
     * Ready!
     * 
     */
    console.log(' - Ready!')
    console.log(' - Buy order ID :', order.id)
    console.log(' - Time since trade start :', Date.now() - startTime, 'ms')
    return new Operation(gate, symbol, order, startTime)
  }


  /**
   * 
   * 
   * 
   */
  private async createStopLossOrder(): Promise<void> {
    /**
     * 
     * Calculate amounts and sizes
     * 
     */
    const buyPrice = this.buyOrder.price
    const triggerPrice = toFixed(applyPercentage(Number(buyPrice), config.stopLoss.triggerDistancePercent), 2)
    const sellPrice = toFixed(applyPercentage(Number(buyPrice), config.stopLoss.sellDistancePercent), 2)
    const sellAmount = this.buyOrder.amount

    console.log('Creating STOP-LOSS order...')
    console.log(' - Sell amount :', Number(sellAmount), this.symbol)
    console.log(' - Trigger price :', Number(triggerPrice), `USDT (buyPrice + ${config.stopLoss.triggerDistancePercent}%)`)
    console.log(' - Sell price :', Number(sellPrice), `USDT (buyPrice+ ${config.stopLoss.sellDistancePercent}%)`)


    /**
     * 
     * Create the Stop Loss Order
     * 
     */
    let order: GateOrderDetails
    try {
      const { response } = await this.gate.spot.createSpotPriceTriggeredOrder({
        market: this.assetPair,
        trigger: {
          price: triggerPrice,
          rule: SpotPriceTrigger.Rule.LessThanOrEqualTo,
          expiration: TimeInSeconds.ONE_HOUR
        },
        put: {
          type: "limit",
          side: SpotPricePutOrder.Side.Sell,
          price: sellPrice,
          amount: sellAmount,
          account: SpotPricePutOrder.Account.Normal,
          // We trigger the order as Gtc as we want it to persist until it's fulfilled
          timeInForce: SpotPricePutOrder.TimeInForce.Gtc
        },
      })
      order = response.data
    } catch (e) {
      throw new OperationError(
        `Error when trying to execute STOP LOSS order "${this.assetPair}"`,
        { code: OperationErrorCode.ERROR_CREATING_STOP_LOSS_ORDER, details: this.gate.getGateResponseError(e) }
      )
    }

    /**
     * 
     * Ready!
     * 
     */
    this.stopLossOrder = order
    console.log(' - Ready!')
    console.log(' - Stop-loss order ID :', order.id)
    console.log(' - Time since trade start :', Date.now() - this.startTime, 'ms')
  }


  /**
   * 
   * 
   * 
   * 
   */
  private async createSellOrder(): Promise<void> {
    /**
     * 
     * Calculate amounts and sizes
     * 
     */
    const buyPrice = this.buyOrder.price
    const sellPrice = toFixed(applyPercentage(Number(buyPrice), config.sell.sellDistancePercent), 2)
    const sellAmount = this.buyOrder.amount

    console.log('Creating SELL order...')
    console.log(' - Sell amount :', Number(sellAmount), this.symbol)
    console.log(' - Sell price :', Number(sellPrice), `USDT (buyPrice + ${config.sell.sellDistancePercent}%)`)

    /**
     * 
     * Create SELL order
     * 
     */
    let order: GateOrderDetails
    try {
      const { response } = await this.gate.spot.createOrder({
        currencyPair: this.assetPair,
        side: Order.Side.Sell,
        amount: sellAmount,
        price: sellPrice,
        // we use Good till cancel (GTC), as we want the order to persist until its fulfilled.
        timeInForce: Order.TimeInForce.Gtc
      })
      order = response.data
    } catch (e) {
      throw new OperationError(
        `Error when trying to execute SELL order "${this.assetPair}"`,
        { code: OperationErrorCode.ERROR_CREATING_SELL_ORDER, details: this.gate.getGateResponseError(e) }
      )
    }

    /**
     * 
     * Ready!
     * 
     */
    this.sellOrder = order
    console.log(' - Ready!')
    console.log(' - Sell order ID :', order.id)
    console.log(' - Time since trade start :', Date.now() - this.startTime, 'ms')
  }


  /**
   * 
   * 
   * 
   * 
   */
  private async createEmergencySellOrder(): Promise<void> {
    /**
     * 
     * Get assetPair price data
     * 
     */
    let assetPairPrice: number
    try {
      assetPairPrice = await this.gate.getAssetPairPrice(this.assetPair)
    } catch (e) {
      throw new OperationError(
        `Error ocurred retrieving "${this.assetPair}" price in Gate.io!`,
        { code: OperationErrorCode.ERROR_GETTING_ASSET_PRICE, }
      )
    }

    /**
     * 
     * Calculate amounts and sizes
     * 
     */
    const sellPrice = toFixed(applyPercentage(assetPairPrice, config.operation.emergencySellOrderDistancePercent), 2)
    const sellAmount = this.buyOrder.amount

    console.log('Creating EMERGENCY SELL order...')
    console.log(' - Sell amount :', Number(sellAmount), this.symbol)
    console.log(' - Sell price :', Number(sellPrice), `USDT (assetPrice + ${config.sell.sellDistancePercent}%)`)

    /**
     * 
     * Create EMERGENCY SELL order
     * 
     */
    let order: GateOrderDetails
    try {
      const { response } = await this.gate.spot.createOrder({
        currencyPair: this.assetPair,
        side: Order.Side.Sell,
        amount: sellAmount,
        price: sellPrice,
        // TODO : check if IoC would work here
        timeInForce: Order.TimeInForce.Ioc
      })
      order = response.data
    } catch (e) {
      throw new OperationError(
        `Error when trying to execute EMERGENCY SELL order "${this.assetPair}"`,
        { code: OperationErrorCode.ERROR_CREATING_EMERGENCY_SELL_ORDER, details: this.gate.getGateResponseError(e) }
      )
    }

    /**
     * 
     * BLOCK if order has not been fulfilled 
     * 
     */
    if (order.status !== Order.Status.Closed) {
      throw new OperationError(
        `EMERGENCY SELL order not executed "${this.assetPair}"`,
        { code: OperationErrorCode.EMERGENCY_SEL_ORDER_NOT_EXECUTED, status: order.status }
      )
    }

    /**
     * 
     * Ready!
     * 
     */
    console.log(' - Emergency Sell Executed!')
    console.log(' - Emergency Sell order ID :', order.id)
  }


  /**
   * 
   * 
   * 
   * 
   */
  private async trackOperation() {
    /**
     * 
     * Track SELL ORDER
     * 
     */
    if (this.sellOrder) {
      const orderId = this.sellOrder.id
      try {
        const status = await this.gate.getOrderStatus(orderId, this.assetPair)
        if (status === Order.Status.Closed) await this.endOperation(OperationEndReason.SELL)
        if (status === Order.Status.Cancelled) {
          await this.endOperation(
            OperationEndReason.ERROR,
            new OperationError('Sell order Cancelled', { code: OperationErrorCode.SELL_ORDER_CANCELLED })
          )
        }
      } catch (e) {
        console.log('Error tracking SELL order', orderId, this.gate.getGateResponseError(e))
      }
    }

    /**
     * 
     * Track STOP LOSS order
     * 
     */
    if (this.stopLossOrder) {
      const orderId = this.stopLossOrder.id
      try {
        const status = await this.gate.getOrderStatus(orderId, this.assetPair)
        if (status === Order.Status.Closed) await this.endOperation(OperationEndReason.STOP_LOSS)
        if (status === Order.Status.Cancelled) {
          await this.endOperation(
            OperationEndReason.ERROR,
            new OperationError('Stop Loss order Cancelled', { code: OperationErrorCode.STOP_LOSS_ORDER_CANCELLED })
          )
        }
      } catch (e) {
        console.log('Error tracking STOP LOSS order', orderId, this.gate.getGateResponseError(e))
      }
    }
  }


  /**
   * 
   * 
   */
  private async trackAssetPairPrice() {
    try {
      const assetPairPrice = await this.gate.getAssetPairPrice(this.assetPair)
      console.log(this.assetPair, 'AssetPair Price : ', assetPairPrice)
    } catch (e) {
      console.log('Error tracking assetPairPrice', this.buyOrder.id, this.gate.getGateResponseError(e))
    }
  }


  /**
   * 
   * 
   */
  private async endOperation<END_REASON>(
    ...[reason, error]: END_REASON extends OperationEndReason.ERROR
      ? [END_REASON, Error]
      : [END_REASON]
  ): Promise<void> {
    console.log('OPERATION ENDED DUE: ', reason)
    /**
     * 
     * STOP Price Tracking & Operation Tracking
     * 
     */
    clearInterval(this.priceTrackingTimer)
    clearInterval(this.operationTrackingTimer)

    /**
     * 
     * Close ACTIVE ORDERS
     * 
     */
    // TODO : Close sell and stop loss orders

    if (reason === OperationEndReason.ERROR) {
      if (!OperationError.isOperationError(error)) console.log('🚨 UNEXPECTED OPERATION ERROR!', error?.message)
      console.log('🚨 Operation Error, Emergency sell order will now be created.')
      try {
        await this.createEmergencySellOrder()
      } catch (e) {
        console.log('🚨 Emergency SELL failed!!!! Manual handling required!')
        // TODO: Send notification to user
      }

      this.dispatchEvent('operationEnd', { operation: this, reason })
    }
  }
}

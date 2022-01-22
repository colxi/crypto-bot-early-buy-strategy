import { config } from '@/config'
import { Order, SpotPricePutOrder, SpotPriceTrigger } from 'gate-api'
import { GateClient } from '../../lib/gate-client'
import { getDateAsDDMMYYYY, getTimeAsHHMMSS, TimeInSeconds } from '../../lib/date'
import EventedService from '../../lib/evented-service'
import { applyPercentage, toFixed } from '../../lib/math'
import {
  AssetPair,
  GateOrderDetails,
  GateOrderId,
  SymbolName,
  Timestamp
} from '@/lib/gate-client/types'

type ServiceEvents = {
  buyOrderCreated: (orderId: GateOrderId) => void
  buyOrderCancelled: (orderId: GateOrderId) => void
  unexpectedError: () => void
}

enum OperationErrorCode {
  UNKNOWN = 'UNKNOWN',
  ERROR_GETTING_ASSET_PRICE = 'ERROR_GETTING_ASSET_PRICE',
  OPERATION_COST_SMALLER_ALLOWED_MINIMUM = 'OPERATION_COST_SMALLER_ALLOWED_MINIMUM',
  ERROR_ON_BUY_ORDER = 'ERROR_ON_BUY_ORDER',
  ERROR_TRACKING_ORDER = 'ERROR_TRACKING_ORDER'
}

type OperationErrorData = {
  [A: string]: unknown
  code: OperationErrorCode
}

class OperationError extends Error {
  constructor(message: string, data?: OperationErrorData) {
    super(message)
    this.data = data || { code: OperationErrorCode.UNKNOWN }
  }
  data: OperationErrorData
}


export class Operation extends EventedService<ServiceEvents> {
  private constructor(gate: GateClient, symbol: SymbolName, buyOrder: GateOrderDetails, startTime: number) {
    super(['buyOrderCreated', 'buyOrderCancelled', 'unexpectedError'])
    this.gate = gate
    this.symbol = symbol
    this.assetPair = `${symbol}_USDT`
    this.startTime = startTime
    this.buyOrder = buyOrder
    this.createSellOrders().catch(e => e)
  }

  gate: GateClient
  symbol: SymbolName
  assetPair: AssetPair
  startTime: Timestamp
  buyOrder: GateOrderDetails

  async createSellOrders() {
    await this.createSellOrder().catch(e => { throw e })
    await this.createStopLossOrder().catch(e => { throw e })
  }

  public static async create(gate: GateClient, symbol: SymbolName): Promise<Operation> {
    const startTime = Date.now()
    const assetPair: AssetPair = `${symbol}_USDT`

    console.log(`Operation start time: ${getDateAsDDMMYYYY(startTime)} ${getTimeAsHHMMSS(startTime)}`)

    let assetPrice
    try {
      const result = await gate.spot.listTickers({ 'currencyPair': assetPair })
      assetPrice = Number(result.body[0].last)
      if (!assetPrice) throw new Error(`Unknown error retrieving "${assetPair}" asset price.`)
    } catch (e) {
      throw new OperationError(
        `Error ocurred retrieving "${assetPair}" price in Gate.io!`,
        { code: OperationErrorCode.ERROR_GETTING_ASSET_PRICE, }
      )
    }

    const currencyPrecision = gate.assetPairs[assetPair].amountPrecision!
    const buyPrice = toFixed(applyPercentage(assetPrice, config.buy.buyDistancePercent), 2)
    const buyAmount = toFixed(gate.balance / Number(buyPrice), currencyPrecision)
    const operationCost = Number(toFixed(Number(buyAmount) * Number(buyPrice), 2))

    console.log(`Current ${symbol} price:`, assetPrice, 'USDT')
    console.log()
    console.log('Creating BUY order...')
    console.log(' - Buy amount :', Number(buyAmount), symbol)
    console.log(' - Buy price :', Number(buyPrice), `USDT (currentPrice + ${config.buy.buyDistancePercent}%)`)
    console.log(' - Operation cost :', operationCost, `USDT (available: ${gate.balance} USDT )`)

    // if operation cost is lower than allowed minimum block
    if (operationCost < config.buy.minimumOperationCostUSD) {
      throw new OperationError(
        `Not enough balance to execute the minimum order : ${config.buy.minimumOperationCostUSD} USDT`,
        { code: OperationErrorCode.OPERATION_COST_SMALLER_ALLOWED_MINIMUM }
      )
    }

    let orderDetails: GateOrderDetails
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
      orderDetails = response.data
    } catch (e) {
      throw new OperationError(
        `Error when trying to execute BUY order "${assetPair}"`,
        { code: OperationErrorCode.ERROR_ON_BUY_ORDER, details: (e as any)?.response?.data }
      )
    }

    // if order has been cancelled, abort
    if (orderDetails.status !== Order.Status.Closed) {
      throw new Error(`Invalid BUY order status (status=${orderDetails.status})`)
    }

    console.log(' - Buy order ID :', orderDetails.id)
    console.log(' - Ready!')
    console.log(' - Time since trade start :', Date.now() - startTime, 'ms')
    return new Operation(gate, symbol, orderDetails, startTime)
  }


  private async createStopLossOrder(): Promise<void> {
    const buyPrice = this.buyOrder.price
    const triggerPrice = toFixed(applyPercentage(Number(buyPrice), config.stopLoss.triggerDistancePercent), 2)
    const sellPrice = toFixed(applyPercentage(Number(buyPrice), config.stopLoss.sellDistancePercent), 2)
    const sellAmount = this.buyOrder.amount

    console.log('Creating STOP-LOSS order...')
    console.log(' - Sell amount :', Number(sellAmount), this.symbol)
    console.log(' - Trigger price :', Number(triggerPrice), `USDT (buyPrice + ${config.stopLoss.triggerDistancePercent}%)`)
    console.log(' - Sell price :', Number(sellPrice), `USDT (buyPrice+ ${config.stopLoss.sellDistancePercent}%)`)

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
      console.log((e as any)?.response?.data?.message)
      throw e
    }

    console.log(' - Ready!')
    console.log(' - Stop-loss order ID :', order.id)
    console.log(' - Time since trade start :', Date.now() - this.startTime, 'ms')
  }


  public async createSellOrder(): Promise<void> {
    const buyPrice = this.buyOrder.price
    const sellPrice = toFixed(applyPercentage(Number(buyPrice), config.sell.sellDistancePercent), 2)
    const sellAmount = this.buyOrder.amount

    console.log('Creating SELL order...')
    console.log(' - Sell amount :', Number(sellAmount), this.symbol)
    console.log(' - Sell price :', Number(sellPrice), `USDT (buyPrice + ${config.sell.sellDistancePercent}%)`)

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
      console.log((e as any)?.response?.data?.message)
      throw e
    }

    console.log(' - Ready!')
    console.log(' - Sell order ID :', order.id)
    console.log(' - Time since trade start :', Date.now() - this.startTime, 'ms')
  }
}

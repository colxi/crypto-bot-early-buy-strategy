import { config } from '@/config'
import { AssetPair, GateOrderDetails, SymbolName } from '@/service/gate-client/types'
import { applyPercentage, toFixed } from '@/lib/math'
import { Order } from 'gate-api'
import { OperationError } from '../operation-error'
import { OperationErrorCode } from '../operation-error/types'
import { Logger } from '../../../../lib/logger'
import { Gate } from '@/service/gate-client'
import { OperationBuyOrderDetails } from '../types'


export async function createBuyOrder(
  symbol: SymbolName,
  assetPair: AssetPair,
  operationBudget: number,
  operationType: 'ioc' | 'fok',
  startTime: number,
  logger: Logger,
): Promise<OperationBuyOrderDetails> {


  /**
   * 
   * Get assetPair price data
   * 
   */
  let assetPairPrice: number
  try {
    assetPairPrice = await Gate.getAssetPairPrice(assetPair)
  } catch (e) {
    const errorMessage = `Error ocurred retrieving "${assetPair}" price in Gate.io!`
    logger.error(errorMessage)
    throw new OperationError(errorMessage, { code: OperationErrorCode.ERROR_GETTING_ASSET_PRICE, })
  }

  const amountPrecision = Gate.assetPairs[assetPair].amountPrecision!
  const usdtPrecision = Gate.assetPairs[assetPair].precision!
  const buyPrice = toFixed(applyPercentage(assetPairPrice, config.buy.buyDistancePercent), usdtPrecision)
  const buyAmount = toFixed(operationBudget / Number(buyPrice), amountPrecision)
  const operationCost = Number(toFixed(Number(buyAmount) * Number(buyPrice), usdtPrecision))

  logger.lineBreak()
  logger.log('Creating BUY order...')
  logger.log(` - Operation type: `, operationType)
  logger.log(` - Current ${symbol} price:`, assetPairPrice, 'USDT')
  logger.log(' - Buy amount :', Number(buyAmount), symbol)
  logger.log(' - Buy price :', Number(buyPrice), `USDT (currentPrice + ${config.buy.buyDistancePercent}%)`)
  logger.log(' - Operation cost :', operationCost, `USDT (budget: ${operationBudget} USDT )`)

  /**
   * 
   * BLOCK if operation cost is lower than allowed minimum block
   * 
   */
  if (operationCost < config.operation.minimumOperationCostUSD) {
    const errorMessage = `Operation cost (${operationCost}) is lower than allowed by limits (${config.operation.minimumOperationCostUSD})`
    logger.error(errorMessage)
    const newAssetPairPrice = await Gate.getAssetPairPrice(assetPair)
    logger.log(` - New asset price : ${newAssetPairPrice}`)
    throw new OperationError(errorMessage, { code: OperationErrorCode.MINIMUM_OPERATION_COST_LIMIT })
  }

  /**
   * 
   * Create BUY order
   * 
   */
  let order: GateOrderDetails
  try {
    const { response } = await Gate.spot.createOrder({
      currencyPair: assetPair,
      side: Order.Side.Buy,
      amount: buyAmount,
      price: buyPrice,
      timeInForce: operationType === 'fok'
        ? Order.TimeInForce.Fok
        : Order.TimeInForce.Ioc
    })
    order = response.data
  } catch (e) {
    const errorMessage = `Error when trying to execute BUY order "${assetPair}"`
    const originalErrorMessage = Gate.getGateResponseError(e)
    logger.error(errorMessage)
    logger.error(originalErrorMessage)
    throw new OperationError(errorMessage, { code: OperationErrorCode.ERROR_CREATING_BUY_ORDER, details: Gate.getGateResponseError(e) })
  }


  /**
   * 
   * BLOCK if order has not been fulfilled 
   * 
   */
  const fillPrice = Number(order.fill_price)
  const isCancelled = order.status === Order.Status.Cancelled
  if (isCancelled && !fillPrice) {
    const errorMessage = `BUY order not executed "${assetPair}"`
    logger.error(errorMessage)
    throw new OperationError(errorMessage, { code: OperationErrorCode.BUY_ORDER_NOT_EXECUTED, status: order.status })
  }

  const effectiveAmount = toFixed(Number(order.amount) - Number(order.left) - Number(order.fee), amountPrecision)
  const effectivePrice = toFixed(Number(order.fill_price) / Number(order.amount), usdtPrecision)
  const effectiveOperationCostPrice = toFixed((Number(order.amount) - Number(order.left)) * Number(effectivePrice), usdtPrecision)

  /**
   * 
   * Ready!
   * 
   */
  logger.success(' - Ready!')
  logger.log(' - Buy order ID :', order.id)
  logger.log(' - Effective buy amount', effectiveAmount, symbol, `(buyAmount - fees)`)
  logger.log(' - Effective buy price :', effectivePrice, 'USDT')
  logger.log(' - Effective operation cost :', effectiveOperationCostPrice, 'USDT')
  logger.log(' - Left :', order.left, symbol)
  logger.log(' - Fee :', order.fee, symbol)
  logger.log(' - Time since trade start :', Date.now() - startTime, 'ms')
  logger.lineBreak()

  return {
    id: order.id,
    originalAssetPrice: String(assetPairPrice),
    buyPrice: effectivePrice,
    amount: effectiveAmount,
    operationCost: effectiveOperationCostPrice,
    order: order
  }
}
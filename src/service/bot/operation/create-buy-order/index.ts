import { config } from '@/config'
import { AssetPair, GateOrderDetails, SymbolName } from '@/service/gate-client/types'
import { applyPercentage, getPercentage, toFixed } from '@/lib/math'
import { Order } from 'gate-api'
import { OperationError } from '../operation-error'
import { OperationErrorCode } from '../operation-error/types'
import { Logger } from '../../../../lib/logger'
import { Gate } from '@/service/gate-client'
import { OperationBuyOrderDetails } from '../types'


export async function createBuyOrder(
  symbol: SymbolName,
  assetPair: AssetPair,
  startTime: number,
  logger: Logger
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

  /**
   * 
   * Get available USDT BALANCE
   * 
   */
  let availableUSDTBalance: number
  try {
    availableUSDTBalance = await Gate.geAvailableBalanceUSDT()
  } catch (e) {
    const errorMessage = `Error ocurred retrieving available USDT balance Gate.io!`
    logger.error(errorMessage)
    throw new OperationError(errorMessage, { code: OperationErrorCode.ERROR_GETTING_AVAILABLE_BALANCE, })
  }

  /**
   * 
   * Calculate operation amounts and sizes
   * 
   */
  const operationBudget = getPercentage(availableUSDTBalance, config.operation.operationUseBalancePercent)
  const currencyPrecision = Gate.assetPairs[assetPair].amountPrecision!
  const usdtPrecision = Gate.assetPairs[assetPair].precision!
  const buyPrice = toFixed(applyPercentage(assetPairPrice, config.buy.buyDistancePercent), usdtPrecision)
  const buyAmount = toFixed(operationBudget / Number(buyPrice), currencyPrecision)
  const operationCost = Number(toFixed(Number(buyAmount) * Number(buyPrice), usdtPrecision))

  logger.lineBreak()
  logger.log('Creating BUY order...')
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
      // use immediate or cancel (IoC) as we are already targeting a price higher than
      // current. If price is already higher than the targeted, order will be CANCELED
      // and trade will be aborted
      timeInForce: Order.TimeInForce.Fok
    })
    order = response.data
  } catch (e) {
    const errorMessage = `Error when trying to execute BUY order "${assetPair}"`
    logger.error(errorMessage)
    throw new OperationError(errorMessage, { code: OperationErrorCode.ERROR_CREATING_BUY_ORDER, details: Gate.getGateResponseError(e) })
  }


  /**
   * 
   * BLOCK if order has not been fulfilled 
   * 
   */
  if (order.status !== Order.Status.Closed) {
    const errorMessage = `BUY order not executed "${assetPair}"`
    logger.error(errorMessage)
    throw new OperationError(errorMessage, { code: OperationErrorCode.BUY_ORDER_NOT_EXECUTED, status: order.status })
  }

  const effectiveAmount = toFixed(Number(order.amount) - Number(order.fee), currencyPrecision)

  /**
   * 
   * Ready!
   * 
   */
  logger.success(' - Ready!')
  logger.log(' - Buy order ID :', order.id)
  logger.log(' - Effective amount', effectiveAmount, symbol, `(buyAmount - fees)`)
  logger.log(' - Fill price :', order.fill_price)
  logger.log(' - Fill total :', (order as any).filled_total)
  logger.log(' - Time since trade start :', Date.now() - startTime, 'ms')

  return {
    id: order.id,
    originalAssetPrice: String(assetPairPrice),
    buyPrice: order.price,
    amount: effectiveAmount,
    operationCost: String(operationCost),
    order: order
  }
}
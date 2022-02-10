import { config } from '@/config'
import { AssetPair, GateOrderDetails, SymbolName } from '@/service/gate-client/types'
import { applyPercentage, toFixed } from '@/lib/math'
import { Order } from 'gate-api'
import { OperationError } from '../operation-error'
import { OperationErrorCode } from '../operation-error/types'
import { Logger } from '../../../../lib/logger'
import { Gate } from '@/service/gate-client'
import { Console } from '@/service/console'

export async function createEmergencySellOrder(
  symbol: SymbolName,
  assetPair: AssetPair,
  startTime: number,
  operationEntryPrice: string,
  amountToSell: string,
  logger: Logger,
  modifier: number = 0,
): Promise<GateOrderDetails> {
  logger.lineBreak()
  logger.log('Creating EMERGENCY SELL order...')

  /**
   * 
   * Get assetPair price data
   * 
   */
  let assetPairPrice: number
  try {
    assetPairPrice = await Gate.getAssetPairPrice(assetPair)
  } catch (e) {
    throw new OperationError(
      `Error ocurred retrieving "${assetPair}" price in Gate.io!`,
      { code: OperationErrorCode.ERROR_GETTING_ASSET_PRICE, }
    )
  }

  /**
   * 
   * Calculate amounts and sizes
   * 
   */
  const usdtPrecision = Gate.assetPairs[assetPair].precision!
  logger.log(' - Sell distance percent :', config.emergencySell.sellDistancePercent)
  logger.log(' - Sell price modifier :', modifier)
  const effectivePercentage = config.emergencySell.sellDistancePercent - modifier
  Console.log('effectivePercentage', effectivePercentage, 'modifier', modifier)
  const sellPrice = toFixed(
    applyPercentage(assetPairPrice, effectivePercentage),
    usdtPrecision
  )

  logger.log(` - Current ${symbol} price:`, assetPairPrice, 'USDT')
  logger.log(' - Sell amount :', Number(amountToSell), symbol)
  logger.log(' - Sell price :', Number(sellPrice), `USDT (assetPrice - ${Math.abs(effectivePercentage)}%)`)

  /**
   * 
   * Create EMERGENCY SELL order
   * 
   */
  let order: GateOrderDetails
  try {
    const { response } = await Gate.spot.createOrder({
      currencyPair: assetPair,
      side: Order.Side.Sell,
      amount: amountToSell,
      price: sellPrice,
      // TODO : check if IoC would work here
      timeInForce: Order.TimeInForce.Ioc
    })
    order = response.data
  } catch (e) {
    throw new OperationError(
      `Error when trying to execute EMERGENCY SELL order "${assetPair}"`,
      { code: OperationErrorCode.ERROR_CREATING_EMERGENCY_SELL_ORDER, details: Gate.getGateResponseError(e) }
    )
  }

  /**
   * 
   * BLOCK if order has not been fulfilled 
   * 
   */
  if (order.status !== Order.Status.Closed) {
    throw new OperationError(
      `EMERGENCY SELL order not executed "${assetPair}"`,
      { code: OperationErrorCode.EMERGENCY_SEL_ORDER_NOT_EXECUTED, status: order.status }
    )
  }

  /**
   * 
   * Ready!
   * 
   */
  logger.success(' - Emergency Sell Executed!')
  logger.log(' - Emergency Sell order ID :', order.id)
  logger.log(' - Time since trade start :', Date.now() - startTime, 'ms')
  return order
}

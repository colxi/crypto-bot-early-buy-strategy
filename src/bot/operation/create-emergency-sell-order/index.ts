import { config } from '@/config'
import { TimeInSeconds } from '@/lib/date'
import { GateClient } from '@/lib/gate-client'
import { AssetPair, GateNewTriggeredOrderDetails, GateOrderDetails, SymbolName } from '@/lib/gate-client/types'
import { applyPercentage, toFixed } from '@/lib/math'
import { Order, SpotPricePutOrder, SpotPriceTrigger } from 'gate-api'
import { OperationError } from '../operation-error'
import { OperationErrorCode } from '../operation-error/types'
import { OperationLogger } from '../operation-logger'

export async function createEmergencySellOrder(
  gate: GateClient,
  symbol: SymbolName,
  assetPair: AssetPair,
  startTime: number,
  operationEntryPrice: string,
  amountToSell: string,
  logger: OperationLogger
): Promise<GateOrderDetails> {
  logger.log()
  logger.log('Creating EMERGENCY SELL order...')

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
   * Calculate amounts and sizes
   * 
   */
  const sellPrice = toFixed(applyPercentage(assetPairPrice, config.operation.emergencySellOrderDistancePercent), 2)

  logger.log(` - Current ${symbol} price:`, assetPairPrice, 'USDT')
  logger.log(' - Sell amount :', Number(amountToSell), symbol)
  logger.log(' - Sell price :', Number(sellPrice), `USDT (assetPrice - ${Math.abs(config.operation.emergencySellOrderDistancePercent)}%)`)

  /**
   * 
   * Create EMERGENCY SELL order
   * 
   */
  let order: GateOrderDetails
  try {
    const { response } = await gate.spot.createOrder({
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
      { code: OperationErrorCode.ERROR_CREATING_EMERGENCY_SELL_ORDER, details: gate.getGateResponseError(e) }
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

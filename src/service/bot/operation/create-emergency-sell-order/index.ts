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
  const amountMinusFees = applyPercentage(Number(amountToSell), config.gate.feesPercent * -1)
  const currencyPrecision = Gate.assetPairs[assetPair].amountPrecision!
  const sellAmount = toFixed(amountMinusFees, currencyPrecision)
  const usdtPrecision = Gate.assetPairs[assetPair].precision!
  const effectivePercentage = config.emergencySell.sellDistancePercent + modifier
  const sellPrice = toFixed(
    applyPercentage(assetPairPrice, effectivePercentage),
    usdtPrecision
  )

  logger.log(` - Current ${symbol} price:`, assetPairPrice, 'USDT')
  logger.log(' - Sell amount :', Number(sellAmount), symbol, '(buyAmmount - fee)')
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
      amount: sellAmount,
      price: sellPrice,
      // TODO : check if IoC would work here
      timeInForce: Order.TimeInForce.Fok
    })
    order = response.data
  } catch (e) {
    throw e
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

import { config } from '@/config'
import { AssetPair, GateNewTriggeredOrderDetails, GateTriggeredOrderDetails, SymbolName } from '@/service/gate-client/types'
import { applyPercentage, toFixed } from '@/lib/math'
import { SpotPricePutOrder, SpotPriceTrigger } from 'gate-api'
import { OperationError } from '../operation-error'
import { OperationErrorCode } from '../operation-error/types'
import { Logger } from '../../../../lib/logger'
import { Gate } from '@/service/gate-client'
import { OperationTriggeredOrderDetails } from '../types'

export async function createStopLossTriggeredOrder(
  symbol: SymbolName,
  assetPair: AssetPair,
  startTime: number,
  operationEntryPrice: string,
  amountToSell: string,
  logger: Logger
): Promise<OperationTriggeredOrderDetails> {
  /**
   * 
   * Calculate amounts and sizes
   * 
   */

  const amountMinusFees = applyPercentage(Number(amountToSell), config.gate.feesPercent * -1)
  const usdtPrecision = Gate.assetPairs[assetPair].precision!
  const currencyPrecision = Gate.assetPairs[assetPair].amountPrecision!
  const sellAmount = toFixed(amountMinusFees, currencyPrecision)
  const triggerPrice = toFixed(applyPercentage(Number(operationEntryPrice), config.stopLoss.triggerDistancePercent), usdtPrecision)
  const sellPrice = toFixed(applyPercentage(Number(operationEntryPrice), config.stopLoss.sellDistancePercent), usdtPrecision)

  logger.lineBreak()
  logger.log('Creating TRIGGERED STOP-LOSS order...')
  logger.log(' - Sell amount :', Number(sellAmount), symbol)
  logger.log(' - Trigger condition : <', Number(triggerPrice), `USDT (buyPrice - ${Math.abs(config.stopLoss.triggerDistancePercent)}%)`)
  logger.log(' - Sell price :', Number(sellPrice), `USDT (buyPrice - ${Math.abs(config.stopLoss.sellDistancePercent)}%)`)


  /**
   * 
   * Create the Stop Loss Order
   * 
   */
  let order: GateNewTriggeredOrderDetails
  try {
    const { response } = await Gate.spot.createSpotPriceTriggeredOrder({
      market: assetPair,
      trigger: {
        price: triggerPrice,
        rule: SpotPriceTrigger.Rule.LessThanOrEqualTo,
        expiration: config.stopLoss.orderExpiration
      },
      put: {
        type: "limit",
        side: SpotPricePutOrder.Side.Sell,
        price: sellPrice,
        amount: sellAmount,
        account: SpotPricePutOrder.Account.Normal,
        timeInForce: SpotPricePutOrder.TimeInForce.Ioc
      },
    })
    order = response.data
  } catch (e) {
    throw new OperationError(
      `Error when trying to execute STOP LOSS order "${assetPair}"`,
      { code: OperationErrorCode.ERROR_CREATING_STOP_LOSS_ORDER, details: Gate.getGateResponseError(e) }
    )
  }


  /**
   * 
   * Ready!
   * 
   */
  logger.success(' - Ready!')
  logger.log(' - Triggered Stop-loss order ID :', order.id)
  logger.log(' - Time since trade start :', Date.now() - startTime, 'ms')
  return {
    id: order.id,
    triggerPrice: triggerPrice,
    amount: sellAmount,
    sellPrice: sellPrice,
    order: order
  }
}

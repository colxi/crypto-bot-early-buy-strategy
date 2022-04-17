import { AssetPair, GateOrderId, TriggeredOrderStatus } from '@/service/gate-client/types'
import { Order } from 'gate-api'
import { OperationError } from '../operation-error'
import { OperationErrorCode } from '../operation-error/types'
import { Logger } from '../../../../lib/logger'
import { OperationTriggeredOrderType } from '../types'
import { Gate } from '@/service/gate-client'

export const TriggeredOrderErrorStatusList = [
  TriggeredOrderStatus.Canceled,
  TriggeredOrderStatus.Failed,
  TriggeredOrderStatus.Expired
]


export async function hasFulfilledTriggeredOrder(
  orderType: OperationTriggeredOrderType,
  triggeredOrderId: GateOrderId,
  assetPair: AssetPair,
  logger: Logger
): Promise<boolean> {
  /**
   * 
   * Track TRIGGERED order
   * 
   */
  try {
    const triggeredOrder = await Gate.getTriggeredOrderDetails(triggeredOrderId)
    const triggeredOrderStatus = triggeredOrder.status
    const isErrorStatus = TriggeredOrderErrorStatusList.includes(triggeredOrder.status)

    logger.log('Tracking Triggered order', orderType, 'status:', triggeredOrder.status, 'reason:', triggeredOrder.reason)

    // If TRIGGERED order has error status....
    if (isErrorStatus) {
      throw new OperationError(`${orderType} TRIGGERED order has Error status: ${triggeredOrderStatus}`, {
        code: OperationErrorCode.TRIGGERED_ORDER_HAS_ERROR_STATUS,
        status: triggeredOrderStatus
      })
    }
    // If TRIGGERED order finished...
    else if (triggeredOrderStatus === TriggeredOrderStatus.Finish) {
      /**
       * 
       * Track LIMIT order
       * 
       */
      const limitOrderId = triggeredOrder.fired_order_id!
      const limitOrder = await Gate.getLimitOrder(limitOrderId, assetPair)
      const limitOrderStatus = limitOrder.status

      logger.log('Tracking Triggered Limit order', orderType, 'status:', limitOrder.status, 'left:', limitOrder.left)

      if (Number(limitOrder.left) > 0) {
        logger.error('!!!!! DETECTED TRIGGERED LIMIT ORDER WITH LEFT AMOUNT !!!!', limitOrder.left)
        throw new OperationError(`${orderType} LIMIT order has LEFT AMOUNT`, {
          code: OperationErrorCode.LIMIT_ORDER_HAS_LEFT_AMOUNT,
          left: limitOrder.left
        })
      }

      // If LIMIT order has error status...
      if (limitOrderStatus === Order.Status.Cancelled) {
        throw new OperationError(`${orderType} LIMIT order has Error status: ${limitOrderStatus}`, {
          code: OperationErrorCode.LIMIT_ORDER_HAS_ERROR_STATUS,
          status: limitOrderStatus
        })
      }
      // if LIMIT order is completed...
      else if (limitOrderStatus === Order.Status.Closed) return true
    }
  } catch (e) {
    logger.error('Error tracking order', Gate.getGateResponseError(e))
    throw e
  }
  return false
}
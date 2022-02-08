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
  orderTpe: OperationTriggeredOrderType,
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

    // If TRIGGERED order has error status....
    if (isErrorStatus) {
      throw new OperationError(`${orderTpe} TRIGGERED order has Error status: ${triggeredOrderStatus}`, {
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
      const limitOrderStatus = await Gate.getOrderStatus(limitOrderId, assetPair)
      // If LIMIT order has error status...
      if (limitOrderStatus === Order.Status.Cancelled) {
        throw new OperationError(`${orderTpe} LIMIT order has Error status: ${limitOrderStatus}`, {
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
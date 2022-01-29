import { GateClient } from '@/lib/gate-client'
import { AssetPair, GateOrderId, TriggeredOrderStatus } from '@/lib/gate-client/types'
import { Order } from 'gate-api'
import { OperationError } from '../operation-error'
import { OperationErrorCode } from '../operation-error/types'
import { OperationLogger } from '../operation-logger'
import { OperationTriggeredOrderType } from '../types'

export const TriggeredOrderErrorStatusList = [
  TriggeredOrderStatus.Canceled,
  TriggeredOrderStatus.Failed,
  TriggeredOrderStatus.Expired
]


export async function hasFulfilledTriggeredOrder(
  orderTpe: OperationTriggeredOrderType,
  triggeredOrderId: GateOrderId,
  gate: GateClient,
  assetPair: AssetPair,
  logger: OperationLogger
): Promise<boolean> {
  /**
   * 
   * Track TRIGGERED order
   * 
   */
  try {
    const triggeredOrder = await gate.getTriggeredOrderDetails(triggeredOrderId)
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
      const limitOrderStatus = await gate.getOrderStatus(limitOrderId, assetPair)
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
    logger.error('Error tracking order', gate.getGateResponseError(e))
    throw e
  }
  return false
}
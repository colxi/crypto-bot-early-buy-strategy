import { CustomEvent } from '@/lib/evented-service/custom-event'
import { GateNewTriggeredOrderDetails, GateOrderDetails, GateOrderId, GateTriggeredOrderDetails } from '@/service/gate-client/types'
import { Operation } from '.'

export type ServiceEvents = {
  operationStarted: (event: CustomEvent<{ operation: Operation }>) => void
  operationFinished: (event: CustomEvent<{ operation: Operation, reason: OperationEndReason }>) => void
}

export enum OperationEndReason {
  TAKE_PROFIT_FULFILLED = 'TAKE_PROFIT_FULFILLED',
  STOP_LOSS_FULFILLED = 'STOP_LOSS_FULFILLED',
  ERROR = 'ERROR'
}

export enum OperationTriggeredOrderType {
  STOP_LOSS = 'STOP_LOSS',
  TAKE_PROFIT = 'TAKE_PROFIT'
}

export interface OperationBuyOrderDetails {
  id: string
  originalAssetPrice: string
  buyPrice: string
  amount: string
  operationCost: string
  order: GateOrderDetails
}

export interface OperationTriggeredOrderDetails {
  id: string
  triggerPrice: string,
  amount: string,
  sellPrice: string,
  order: GateNewTriggeredOrderDetails
}


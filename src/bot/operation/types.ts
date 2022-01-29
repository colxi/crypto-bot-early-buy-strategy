import { CustomEvent } from '@/lib/evented-service/custom-event'
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
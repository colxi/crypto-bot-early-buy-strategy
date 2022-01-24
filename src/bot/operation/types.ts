import { CustomEvent } from '@/lib/evented-service/custom-event'
import { GateOrderId } from '@/lib/gate-client/types'
import { Operation } from '.'

export type ServiceEvents = {
  operationStart: (event: CustomEvent<{ operation: Operation }>) => void
  operationEnd: (event: CustomEvent<{ operation: Operation, reason: OperationEndReason }>) => void
}

export enum OperationEndReason {
  SELL = 'SELL',
  STOP_LOSS = 'STOP_LOSS',
  ERROR = 'ERROR'
}


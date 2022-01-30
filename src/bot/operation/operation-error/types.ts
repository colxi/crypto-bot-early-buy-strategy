
export enum OperationErrorCode {
  UNKNOWN = 'UNKNOWN',
  ERROR_GETTING_ASSET_PRICE = 'ERROR_GETTING_ASSET_PRICE',
  ERROR_GETTING_AVAILABLE_BALANCE = 'ERROR_GETTING_AVAILABLE_BALANCE',
  MINIMUM_OPERATION_COST_LIMIT = 'MINIMUM_OPERATION_COST_LIMIT',
  ERROR_CREATING_BUY_ORDER = 'ERROR_CREATING_BUY_ORDER',
  ERROR_CREATING_TAKE_PROFIT_ORDER = 'ERROR_CREATING_TAKE_PROFIT_ORDER',
  ERROR_CREATING_STOP_LOSS_ORDER = 'ERROR_CREATING_STOP_LOSS_ORDER',
  ERROR_CREATING_EMERGENCY_SELL_ORDER = 'ERROR_CREATING_EMERGENCY_SELL_ORDER',
  BUY_ORDER_NOT_EXECUTED = 'BUY_ORDER_NOT_EXECUTED',
  EMERGENCY_SEL_ORDER_NOT_EXECUTED = 'EMERGENCY_SEL_ORDER_NOT_EXECUTED',
  SELL_ORDER_CANCELED = 'SELL_ORDER_CANCELED',
  TRIGGERED_ORDER_HAS_ERROR_STATUS = 'TRIGGERED_ORDER_HAS_ERROR_STATUS',
  LIMIT_ORDER_HAS_ERROR_STATUS = 'LIMIT_ORDER_HAS_ERROR_STATUS',
}

export type OperationErrorData = {
  [A: string]: unknown
  code: OperationErrorCode
}
import { OperationErrorCode, OperationErrorData } from './types'

export class OperationError extends Error {
  constructor(message: string, data?: OperationErrorData) {
    super(message)
    this.data = data || { code: OperationErrorCode.UNKNOWN }
  }
  data: OperationErrorData

  static isOperationError(e: unknown): e is OperationError {
    return e instanceof OperationError
  }
}

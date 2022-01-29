import { config } from '..'

export function validateConfig() {
  // general
  if (!config.socketAddr.length) throw new Error('Invalid config.socketAddress.')
  if (!config.logsPath.length) throw new Error('Invalid config.logsPath')
  // gate
  if (!config.gate.key.length) throw new Error('Invalid config.gate.key')
  if (!config.gate.secret.length) throw new Error('Invalid config.gate.secret')
  if (config.gate.feesPercent < 0) throw new Error('Invalid config.gate.feesPercent. Value must be a positive value')
  // operation
  if (config.operation.minimumOperationCostUSD < 1) throw new Error('Invalid config.operation.minimumOperationCostUSD. Value must be a positive number')
  if (config.operation.operationUseBalancePercent < 0) throw new Error('Invalid config.operation.operationUseBalancePercent. Value must be greater than 0')
  if (config.operation.operationUseBalancePercent > 100) throw new Error('Invalid config.operation.operationUseBalancePercent. Value cannot be greater than 100')
  if (config.operation.maxSimultaneousOperations < 1) throw new Error('Invalid config.operation.maxSimultaneousOperations. Value must be a positive number')
  if (config.operation.priceTrackingIntervalInMillis < 50) throw new Error('Invalid config.operation.priceTrackingIntervalInMillis. Value must be greater than 50')
  if (config.operation.orderTrackingIntervalInMillis < 50) throw new Error('Invalid config.operation.orderTrackingIntervalInMillis. Value must be greater than 50')
  if (config.operation.emergencySellOrderDistancePercent > 0) throw new Error('Invalid config.operation.emergencySellOrderDistancePercent. Value must be a negative number')
  // buy
  if (config.buy.buyDistancePercent.length === 0) throw new Error('Invalid config.buy.buyDistancePercent. Must contain a value')
  // stopLoss
  if (config.stopLoss.triggerDistancePercent > 0) throw new Error('Invalid config.stopLoss.triggerDistancePercent. Value must be a negative percentage')
  if (config.stopLoss.sellDistancePercent > 0) throw new Error('Invalid config.stopLoss.sellDistancePercent. Value must be a negative percentage')
  // sell
  if (config.sell.sellDistancePercent < 0) throw new Error('Invalid config.sell.sellDistancePercent. Value must be a positive percentage')
}

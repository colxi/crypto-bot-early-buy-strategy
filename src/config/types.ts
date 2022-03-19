export interface BotConfig {
  logsPath: string
  cleanLogsPathOnStart: boolean,
  emailRecipient: `${string}@${string}.${string}`
  signalHub: {
    port: number
    authToken: string
    maxSignalAgeInMillis: number
  },
  email: {
    host: string
    port: number
    user: string
    pass: string
  }
  gate: {
    key: string
    secret: string
    feesPercent: number
  },
  operation: {
    minimumOperationCostUSD: number
    operationUseBalancePercent: number
    maxSimultaneousOperations: number
    priceTrackingIntervalInMillis: number
    orderTrackingIntervalInMillis: number
  },
  buy: {
    fallbackToPartialAfterAttempts: number
    buyDistancePercent: number
    retryLimitInMillis: number
  },
  takeProfit: {
    triggerDistancePercent: number
    sellDistancePercent: number
    orderExpiration: number
  }
  stopLoss: {
    triggerDistancePercent: number
    sellDistancePercent: number
    orderExpiration: number
  },
  emergencySell: {
    sellDistancePercent: number
    retryPercentModifier: number
    retryPercentModifierLimit: number
  }
}
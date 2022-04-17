import { BotConfig } from '@/config/types'
import { TimeInMillis, TimeInSeconds } from './src/lib/date'

export const config: BotConfig = {
  logsPath: 'operation-logs',
  cleanLogsPathOnStart: false,
  emailRecipient: '__RECIPIENT@DOMAIN.COM__',
  signalHub: {
    port: 9898,
    authToken: '__TOKEN__',
    maxSignalAgeInMillis: TimeInMillis.TEN_SECONDS
  },
  gate: {
    key: "__KEY__",
    secret: "__SECRET__",
    feesPercent: 0.2,
  },
  email: {
    host: 'smtp.ethereal.email',
    port: 587,
    user: '__USER__',
    pass: '__PASS__'
  },
  operation: {
    minimumOperationCostUSD: 1,
    operationUseBalancePercent: 10,
    maxSimultaneousOperations: 1,
    priceTrackingIntervalInMillis: 500,
    orderTrackingIntervalInMillis: 500,
  },
  buy: {
    fallbackToPartialAfterAttempts: 4,
    buyDistancePercent: 0.1,
    retryLimitInMillis: 5000,
  },
  takeProfit: {
    triggerDistancePercent: 0.02,
    sellDistancePercent: 0.01,
    orderExpiration: TimeInSeconds.ONE_WEEK,
  },
  stopLoss: {
    triggerDistancePercent: -10.2,
    sellDistancePercent: -10.3,
    orderExpiration: TimeInSeconds.ONE_WEEK
  },
  emergencySell: {
    sellDistancePercent: -0.5,
    retryPercentModifier: -0,
    retryPercentModifierLimit: -1,
  }
}

import { BotConfig } from '@/config/types'

export const config: BotConfig = {
  socketAddr: 'ws://127.0.0.1:5555',
  //socketAddr: 'ws://108.61.197.146:5555/test/raul',
  logsPath: 'operation-logs',
  gate: {
    key: "f1b81eff2b46adb70d5433a73367915a",
    secret: "f584658251866f1ae6056b02c249b660661dd53b617fb897d47d5bd9b143332a",
    feesPercent: 0.2,
  },
  operation: {
    minimumOperationCostUSD: 15,
    operationUseBalancePercent: 50,
    maxSimultaneousOperations: 1,
    priceTrackingIntervalInMillis: 500,
    orderTrackingIntervalInMillis: 500,
    emergencySellOrderDistancePercent: -1,
  },
  buy: {
    buyDistancePercent: [1],
  },
  stopLoss: {
    triggerDistancePercent: -0.1,
    sellDistancePercent: -0.15,
  },
  sell: {
    triggerDistancePercent: 5,
    sellDistancePercent: 4,
  }
}

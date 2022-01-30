import { BotConfig } from '@/config/types'

export const config: BotConfig = {
  socketAddr: 'ws://ADDRESS:IP',
  logsPath: 'operation-logs',
  cleanLogsPathOnStart: false,
  gate: {
    key: "GATE_KEY",
    secret: "GATE_SECRET",
    feesPercent: 0.2,
  },
  email: {
    host: 'smtp.HOST.email',
    port: 587,
    user: 'USER',
    pass: 'PASSWORD'
  },
  emailRecipient: 'admin@my.domain.com',
  operation: {
    minimumOperationCostUSD: 20,
    operationUseBalancePercent: 100,
    maxSimultaneousOperations: 1,
    priceTrackingIntervalInMillis: 500,
    orderTrackingIntervalInMillis: 500,
    emergencySellOrderDistancePercent: -1,
  },
  buy: {
    buyDistancePercent: 0.01,
    retryLimitInMillis: 1000,
  },
  takeProfit: {
    triggerDistancePercent: 7,
    sellDistancePercent: 6,
  },
  stopLoss: {
    triggerDistancePercent: -2,
    sellDistancePercent: -4,
  },
}

/**
 * 
 * Operation events visualization :
 * 
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! : SELL_TRIGGER_PRICE (BUY_PRICE + sell.triggerDistancePercent) 
 * ------------------------------------------ : SELL_EXECUTE_PRICE (BUY_PRICE + sell.sellDistancePercent)
 * 
 * 
 * ++++++++++++++++++++++++++++++++++++++++++ : BUY_PRICE (ASSET_PRICE + buy.buyDistancePercent)
 * .......................................... : ASSET_PRICE (announcement signal)
 * 
 * 
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! : STOP_LOSS_TRIGGER_PRICE (BUY_PRICE - stopLoss.triggerDistancePercent) 
 * ------------------------------------------ : STOP_LOSS_EXECUTE_PRICE (BUY_PRICE - stopLoss.sellDistancePercent) 
 * 
 */

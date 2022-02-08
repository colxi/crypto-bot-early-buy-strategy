import { SpotApi } from 'gate-api'

export const getLatency = async (spot: SpotApi): Promise<number> => {
  const initTime = Date.now()
  await spot.listTickers({ 'currencyPair': "BTC_USDT" })
  return Math.round((Date.now() - initTime) / 2)
}
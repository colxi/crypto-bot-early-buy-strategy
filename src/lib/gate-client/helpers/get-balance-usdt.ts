import { SpotApi } from 'gate-api'

export const geAvailableBalanceUSDT = async (spot: SpotApi): Promise<number> => {
  const { response } = await spot.listSpotAccounts({ currency: 'USDT' })
  const available = Number(response.data[0].available)
  return available
}
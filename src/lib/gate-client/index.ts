import { ApiClient, SpotApi, WalletApi } from 'gate-api'
import { TimeInMillis } from '../date'
import { getAssetPairs } from './helpers/get-assets-pairs'
import { geAvailableBalanceUSDT } from './helpers/get-balance-usdt'
import { getLatency } from './helpers/get-latency'
import { AssetPairsMap, GateClientOptions } from './types'


export class GateClient {
  private constructor(options: GateClientOptions) {
    this.client = options.client
    this.spot = options.spot
    this.wallet = options.wallet
    this.assetPairs = options.assetPairs
    this.balance = options.balance
    setInterval(() => void this.updateAssetPairs(), TimeInMillis.ONE_DAY)
  }


  public client: ApiClient
  public spot: SpotApi
  public wallet: WalletApi
  public assetPairs: AssetPairsMap
  public balance: number


  public async updateAssetPairs(): Promise<void> {
    const pairs = await getAssetPairs(this.spot)
    this.assetPairs = pairs
  }


  public async getLatency(): Promise<number> {
    return await getLatency(this.spot)
  }


  public getGateResponseError(error: unknown): string {
    if (error instanceof Error) {
      const gateError: string = (error as any)?.response?.data?.message
      if (gateError) return gateError
      else return error.message || String(error)
    } else return String(error)
  }


  public static async create(key: string, secret: string): Promise<GateClient> {
    console.log('🟢 Initializing Gate Client...')
    const client = new ApiClient()
    client.setApiKeySecret(key, secret)
    const spot = new SpotApi(client)
    const wallet = new WalletApi(client)
    const assetPairs = await getAssetPairs(spot)
    const balance = await geAvailableBalanceUSDT(spot)
    const clientLatency = await getLatency(spot)
    console.log('Gate API latency:', clientLatency, 'ms (single way)')
    console.log('Available Balance:', balance, 'USDT')
    console.log('Available asset pairs:', Object.keys(assetPairs).length)
    console.log()
    return new GateClient({ client, spot, wallet, balance, assetPairs })
  }
}
import { ApiClient, Order, SpotApi, WalletApi } from 'gate-api'
import { TimeInMillis } from '../date'
import { getAssetPairs } from './helpers/get-assets-pairs'
import { geAvailableBalanceUSDT } from './helpers/get-balance-usdt'
import { getLatency } from './helpers/get-latency'
import { AssetPair, AssetPairsMap, GateClientOptions, GateOrderDetails, GateOrderId } from './types'


export class GateClient {
  private constructor(options: GateClientOptions) {
    this.client = options.client
    this.spot = options.spot
    this.wallet = options.wallet
    this.assetPairs = options.assetPairs
    setInterval(() => void this.updateAssetPairs(), TimeInMillis.ONE_DAY)
  }


  public client: ApiClient
  public spot: SpotApi
  public wallet: WalletApi
  public assetPairs: AssetPairsMap


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


  public async getAssetPairPrice(assetPair: AssetPair): Promise<number> {
    const result = await this.spot.listTickers({ 'currencyPair': assetPair })
    const assetPrice = Number(result.body[0].last)
    if (!assetPrice) throw new Error(`Unknown error retrieving "${assetPair}" asset price.`)
    return assetPrice
  }


  public async geAvailableBalanceUSDT(): Promise<number> {
    return await geAvailableBalanceUSDT(this.spot)
  }

  public async getOrderStatus(
    orderId: GateOrderId,
    assetPair: AssetPair,
    account = 'spot'
  ): Promise<Order.Status> {
    const { response } = await this.spot.getOrder(orderId, assetPair, { account })
    const order: GateOrderDetails = response.data
    return order.status
  }

  public async getTriggeredOrderStatus(
    orderId: GateOrderId,
  ): Promise<Order.Status> {
    const { response } = await this.spot.getSpotPriceTriggeredOrder(orderId)
    const order: GateOrderDetails = response.data
    return order.status
  }

  public static async create(
    key: string,
    secret: string
  ): Promise<GateClient> {
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
    return new GateClient({ client, spot, wallet, assetPairs })
  }
}
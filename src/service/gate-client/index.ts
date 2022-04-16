import { config } from '@/config'
import { ApiClient, Order, SpotApi, WalletApi } from 'gate-api'
import { TimeInMillis } from '../../lib/date'
import { Console } from '../console'
import { getAssetPairs } from './helpers/get-assets-pairs'
import { geAvailableBalanceUSDT } from './helpers/get-balance-usdt'
import { getLatency } from './helpers/get-latency'
import {
  AssetPair,
  AssetPairsMap,
  GateAssetPairPriceDetails,
  GateOrderDetails,
  GateOrderId,
  GateTriggeredOrderDetails
} from './types'


class GateService {
  constructor() {
    //
  }

  public client!: ApiClient
  public spot!: SpotApi
  public wallet!: WalletApi
  public assetPairs!: AssetPairsMap


  public async start(): Promise<void> {
    const client = new ApiClient()
    client.setApiKeySecret(config.gate.key, config.gate.secret)
    const spot = new SpotApi(client)
    const wallet = new WalletApi(client)
    const assetPairs = await getAssetPairs(spot)

    this.client = client
    this.spot = spot
    this.wallet = wallet
    this.assetPairs = assetPairs
    setInterval(() => void this.updateAssetPairs(), TimeInMillis.ONE_DAY)

    Console.log('Initializing Gate Client...')
    Console.log('Gate API latency: ', await Gate.getLatency(), 'ms (single way)')
    Console.log('Available Balance: ', await Gate.geAvailableBalanceUSDT(), 'USDT')
    Console.log('Available asset pairs: ', Object.keys(Gate.assetPairs).length)
  }


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
    const { response } = await this.spot.listTickers({ 'currencyPair': assetPair })
    const assetPairPrice: GateAssetPairPriceDetails = response.data[0]
    const assetPrice = Number(assetPairPrice.last)
    if (!assetPrice) throw new Error(`Unknown error retrieving "${assetPair}" asset price.`)
    return assetPrice
  }


  public async geAvailableBalanceUSDT(): Promise<number> {
    return await geAvailableBalanceUSDT(this.spot)
  }

  public async getLimitOrderStatus(
    orderId: GateOrderId,
    assetPair: AssetPair,
    account = 'spot'
  ): Promise<Order.Status> {
    const { response } = await this.spot.getOrder(orderId, assetPair, { account })
    const order: GateOrderDetails = response.data
    return order.status
  }

  public async getLimitOrder(
    orderId: GateOrderId,
    assetPair: AssetPair,
    account = 'spot'
  ): Promise<Order> {
    const { response } = await this.spot.getOrder(orderId, assetPair, { account })
    const order: Order = response.data
    return order
  }

  public async getTriggeredOrderDetails(
    orderId: GateOrderId,
  ): Promise<GateTriggeredOrderDetails> {
    const { response } = await this.spot.getSpotPriceTriggeredOrder(orderId)
    const order: GateTriggeredOrderDetails = response.data
    return order
  }

  public async purgeTriggeredOrder(triggeredOrderId: string, assetPair: AssetPair) {
    const { fired_order_id: limitOrderId } = await this.getTriggeredOrderDetails(triggeredOrderId)

    await this.spot.cancelSpotPriceTriggeredOrder(triggeredOrderId)
    if (limitOrderId) {
      await this.spot.cancelOrder(limitOrderId, assetPair, { account: 'normal' })
    }
  }

  public async getTriggeredOrderStatus(
    orderId: GateOrderId,
  ): Promise<Order.Status> {
    const { response } = await this.spot.getSpotPriceTriggeredOrder(orderId)
    const order: GateOrderDetails = response.data
    return order.status
  }


}

export const Gate = new GateService()
import { ApiClient, CurrencyPair, Order, SpotApi, WalletApi } from 'gate-api'

export type Timestamp = number

export type SymbolName = string

export type AssetPair = `${string}_${string}`

export type AssetPairsMap = Record<string, CurrencyPair>

export type GateOrderId = string

export enum TriggeredOrderStatus {
  Open = 'open',
  Canceled = 'canceled', // being manually canceled  
  Finish = 'finish', // successfully executed  
  Failed = 'failed', // failed to execute  
  Expired = 'expired' //  expired
}
export interface GateAssetPairPriceDetails {
  currency_pair: AssetPair
  last: string
  lowest_ask: string
  highest_bid: string
  change_percentage: string
  base_volume: string
  quote_volume: string
  high_24h: string
  low_24h: string
}

export interface GateNewTriggeredOrderDetails {
  id: GateOrderId
}

export interface GateTriggeredOrderDetails {
  market: AssetPair
  user: number
  trigger: {
    price: string
    rule: '<=' | '>='
    expiration: number
  },
  put: {
    type: Order.Type
    side: Order.Side
    price: string
    amount: string
    account: 'normal'
    time_in_force: Order.TimeInForce
  },
  id: GateOrderId
  ctime: number
  fired_order_id: undefined | GateOrderId
  status: TriggeredOrderStatus
}

export interface GateOrderDetails {
  id: GateOrderId,
  text: string
  create_time: string
  update_time: string
  create_time_ms: Timestamp,
  update_time_ms: Timestamp
  status: Order.Status
  currency_pair: AssetPair
  type: Order.Type
  account: 'spot' | 'margin'
  side: Order.Side
  amount: string
  price: string
  time_in_force: Order.TimeInForce
  iceberg: string
  left: string
  fill_price: string
}

export interface GateClientOptions {
  client: ApiClient
  spot: SpotApi
  wallet: WalletApi
  assetPairs: AssetPairsMap
}
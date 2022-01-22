import { ApiClient, CurrencyPair, Order, SpotApi, WalletApi } from 'gate-api'

export type Timestamp = number

export type SymbolName = string

export type AssetPair = `${string}_${string}`

export type AssetPairsMap = Record<string, CurrencyPair>

export type GateOrderId = string

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
  balance: number,
  assetPairs: AssetPairsMap
}
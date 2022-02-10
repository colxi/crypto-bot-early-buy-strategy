export enum AnnouncementExchange {
  BINANCE = 'BINANCE',
  UPBIT = 'UPBIT',
  COINBASE = 'COINBASE',
}

export interface SymbolAnnouncementDetails {
  detectionDate: number
  releaseDate: number | undefined
  symbols: string[]
  exchange: AnnouncementExchange
}
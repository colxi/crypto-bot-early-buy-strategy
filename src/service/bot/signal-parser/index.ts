import { SymbolAnnouncementDetails } from './types'
import { isBinanceAnnouncement, parseBinanceAnnouncement } from './binance'
import { isCoinbaseAnnouncement, parseCoinbaseAnnouncement } from './coinbase'
import { isUpBitAnnouncement, parseUpBitAnnouncement } from './upbit'

export function parseWebsocketSignal(message: string): SymbolAnnouncementDetails | null {
  if (isUpBitAnnouncement(message)) return parseUpBitAnnouncement(message)
  else if (isCoinbaseAnnouncement(message)) return parseCoinbaseAnnouncement(message)
  else if (isBinanceAnnouncement(message)) return parseBinanceAnnouncement(message)
  return null
}
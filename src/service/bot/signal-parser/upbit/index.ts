import { AnnouncementExchange, SymbolAnnouncementDetails } from '../types'

/**
 
 Example 1
 ------------
  Upbit KRW listing: (KRW) (BTC) (DOGE) (IMX) \n Article: [거래 KRW, BTC 마켓 디지털 자산 추가 (DOGE, IMX)] (https://upbit.com/)  \n   #KRW #BTC #DOGE #IMX #Upbit #Listing

 */


export function isUpBitAnnouncement(message: string): boolean {
  const hasUpbitHashtag = message.toLowerCase().includes('upbit')
  const hasListingHashtag = message.toLowerCase().includes('listing')
  return hasUpbitHashtag && hasListingHashtag
}

export function parseUpBitAnnouncement(message: string) {
  const SYMBOL_REG_EXP = /\[.+\(([^()]*)\)\]/g
  const data: SymbolAnnouncementDetails = {
    releaseDate: undefined,
    detectionDate: Date.now(),
    symbols: [],
    exchange: AnnouncementExchange.UPBIT
  }
  while (true) {
    const symbols: RegExpExecArray | null = SYMBOL_REG_EXP.exec(message)
    if (!symbols) break
    const processedSymbols = symbols[1].split(',').map(i => i.trim())
    data.symbols.push(...processedSymbols)
  }
  // most relevant symbol in upbit seems to be the last one...
  // reverse the symbols list array
  data.symbols.reverse()
  return data.symbols.length ? data : null
}

import { AnnouncementExchange, SymbolAnnouncementDetails } from '../types'

/**
 
 Example 1
 ------------
   Binance Will List Spell Token (SPELL) and TerraUSD (UST) (https://www.binance.com/en/support/announcement) \n #SPELL #USD #UST #Binance #Listing

 Example 2
 ------------
   Binance Will List Convex Finance (CVX) and ConstitutionDAO (PEOPLE) in the Innovation Zone \n #CVX #DAO #PEOPLE #Binance #Listing

 */

export function isBinanceAnnouncement(message: string): boolean {
  const hasCoinbaseName = message.toLowerCase().includes('binance')
  const hasWillListPhrase = message.toLowerCase().includes('will list')
  return hasCoinbaseName && hasWillListPhrase
}

export function parseBinanceAnnouncement(message: string) {
  const SYMBOL_REG_EXP = /\(([^[(http)]*)\)/g
  const data: SymbolAnnouncementDetails = {
    releaseDate: undefined,
    detectionDate: Date.now(),
    symbols: [],
    exchange: AnnouncementExchange.BINANCE
  }
  while (true) {
    const symbols: RegExpExecArray | null = SYMBOL_REG_EXP.exec(message)
    if (!symbols) break
    const processedSymbols = symbols[1].split(',').map(i => i.trim())
    data.symbols.push(...processedSymbols)
  }
  // most relevant symbol in coinbase seems to be the last one...
  // reverse the symbols list array
  data.symbols.reverse()
  return data.symbols.length ? data : null
}

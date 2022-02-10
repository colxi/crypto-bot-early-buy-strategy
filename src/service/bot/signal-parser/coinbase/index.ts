import { AnnouncementExchange, SymbolAnnouncementDetails } from '../types'

/**
 
 Example 1
 ------------
  Coinbase will list: ((DOGE)) ((RENDER)) ((QSP)) \n 🔥 Transfers for Doge (DOGE), Render Token (RENDER) amp; Quantstamp (QSP) are now available on @Coinbase amp; @CoinbaseExch in the regions where trading is supported. Trading is not enabled at this time. Trading will begin on or after 9AM PT on Thurs 2/3, if liquidity conditions are met https://t.co/a1fEodZVG7 (https://twitter.com/CoinbaseAssets)

 Example 2
 ------------
  Coinbase Pro will list: ((JPT)) \n  Inbound transfers for Jupiter (JPT) are now available on @Coinbase and @CoinbaseExch in the regions where trading is supported. Trading is not enabled at this time. Trading will begin on or after 9AM PT on Tuesday February 8, if liquidity conditions are met. https://t.co/qhnzYGwvFv (https://twitter.com/CoinbaseAssets) 

 */


export function isCoinbaseAnnouncement(message: string): boolean {
  const hasCoinbaseName = message.toLowerCase().includes('coinbase')
  const hasWillListPhrase = message.toLowerCase().includes('will list')
  return hasCoinbaseName && hasWillListPhrase
}

export function parseCoinbaseAnnouncement(message: string) {
  const SYMBOL_REG_EXP = /\(\(([^[(http)]*)\)\)/g
  const data: SymbolAnnouncementDetails = {
    releaseDate: undefined,
    detectionDate: Date.now(),
    symbols: [],
    exchange: AnnouncementExchange.COINBASE
  }
  while (true) {
    const symbols: RegExpExecArray | null = SYMBOL_REG_EXP.exec(message)
    if (!symbols) break
    const processedSymbols = symbols[1].split(',').map(i => i.trim())
    data.symbols.push(...processedSymbols)
  }
  // most relevant symbol in binance seems to be the last one...
  // reverse the symbols list array
  data.symbols.reverse()
  return data.symbols.length ? data : null
}


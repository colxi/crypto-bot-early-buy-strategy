
export interface SymbolAnnouncementDetails {
  detectionDate: number
  releaseDate: number | undefined
  symbols: string[]
}

export function getSymbolsFromMessage(message: string): SymbolAnnouncementDetails | null {
  const SYMBOL_REG_EXP = /\(([^()]*)\)/g
  const data: SymbolAnnouncementDetails = {
    releaseDate: undefined,
    detectionDate: Date.now(),
    symbols: []
  }
  let symbols: RegExpExecArray | null
  while (symbols = SYMBOL_REG_EXP.exec(message)) {
    if (symbols) {
      const processedSymbols = symbols[1].split(',').map(i => i.trim())
      data.symbols.push(...processedSymbols)
    }
  }

  return data.symbols.length ? data : null
}

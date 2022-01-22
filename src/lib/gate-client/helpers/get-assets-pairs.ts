import { SpotApi } from 'gate-api'
import { AssetPairsMap } from '../types'

export const getAssetPairs = async (spot: SpotApi): Promise<AssetPairsMap> => {
  const assetPairs = await spot.listCurrencyPairs()
  const assetPairsMap: AssetPairsMap = {}
  assetPairs.body.reduce(
    (acc, i) => {
      const assetPair: string = i.id!
      acc[assetPair] = i
      return acc
    },
    assetPairsMap
  )
  return (assetPairsMap)
}
export interface BotConfig {
    socketAddr: string
    logsPath: string
    gate: {
        key: string
        secret: string
        feesPercent: number
    },
    operation: {
        minimumOperationCostUSD: number
        operationUseBalancePercent: number
        maxSimultaneousOperations: number
        priceTrackingIntervalInMillis: number
        orderTrackingIntervalInMillis: number
        emergencySellOrderDistancePercent: number
    },
    buy: {
        buyDistancePercent: number[]
    },
    stopLoss: {
        triggerDistancePercent: number
        sellDistancePercent: number
    },
    sell: {
        triggerDistancePercent: number
        sellDistancePercent: number
    }
}
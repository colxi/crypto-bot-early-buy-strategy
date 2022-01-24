import WebsocketConnection from './lib/websocket'
import { GateClient } from './lib/gate-client'
import { config } from './config'
import { EarlyBuyBot } from './bot'
import { handleSignalInterrupt } from './lib/sigint'

console.clear()

function createWebsocket(): Promise<WebsocketConnection> {
  let isInitialized = false

  return new Promise(resolve => {
    console.log('🟢 Initializing Websocket...')
    let startTime: number

    const socket = new WebsocketConnection({
      host: config.socketAddr,
      reconnectOnDisconnection: true,
      reconnectOnDisconnectionDelay: 2000,
      logger: (msg: any): void => console.log(msg)
    })

    socket.subscribe('message', (event) => {
      const message = event.detail.message
      // PONG message looks like :  "pong {timestamp}"
      const isPongMessage = typeof message === 'string' && message.split(' ')[0] === 'pong'
      if (isPongMessage) {
        const elapsed = Math.round((Date.now() - startTime) / 2)
        console.log('Websocket latency', elapsed, 'ms (single way)')
        console.log()
        if (!isInitialized) resolve(socket)
        else isInitialized = true
        event.stopPropagation()
      }
    })

    socket.subscribe('connect', (event) => {
      startTime = Date.now()
      socket.send('ping')
    })

    socket.connect()
  })

}


function validateConfig() {
  // general
  if (!config.socketAddr.length) throw new Error('Invalid config.socketAddress.')
  if (!config.logsPath.length) throw new Error('Invalid config.logsPath')
  // gate
  if (!config.gate.key.length) throw new Error('Invalid config.gate.key')
  if (!config.gate.secret.length) throw new Error('Invalid config.gate.secret')
  if (config.gate.feesPercent < 0) throw new Error('Invalid config.gate.feesPercent. Value must be a positive value')
  // operation
  if (config.operation.minimumOperationCostUSD < 1) throw new Error('Invalid config.operation.minimumOperationCostUSD. Value must be a positive number')
  if (config.operation.operationUseBalancePercent < 0) throw new Error('Invalid config.operation.operationUseBalancePercent. Value must be greater than 0')
  if (config.operation.operationUseBalancePercent > 100) throw new Error('Invalid config.operation.operationUseBalancePercent. Value cannot be greater than 100')
  if (config.operation.maxSimultaneousOperations < 1) throw new Error('Invalid config.operation.maxSimultaneousOperations. Value must be a positive number')
  if (config.operation.priceTrackingIntervalInMillis < 50) throw new Error('Invalid config.operation.priceTrackingIntervalInMillis. Value must be greater than 50')
  if (config.operation.orderTrackingIntervalInMillis < 50) throw new Error('Invalid config.operation.orderTrackingIntervalInMillis. Value must be greater than 50')
  if (config.operation.emergencySellOrderDistancePercent > 0) throw new Error('Invalid config.operation.emergencySellOrderDistancePercent. Value must be a negative number')
  // buy
  if (config.buy.buyDistancePercent < 0) throw new Error('Invalid config.buy.buyDistancePercent. Value must be a positive percentage')
  // stopLoss
  if (config.stopLoss.triggerDistancePercent > 0) throw new Error('Invalid config.stopLoss.triggerDistancePercent. Value must be a negative percentage')
  if (config.stopLoss.sellDistancePercent > 0) throw new Error('Invalid config.stopLoss.sellDistancePercent. Value must be a negative percentage')
  // sell
  if (config.sell.sellDistancePercent < 0) throw new Error('Invalid config.sell.sellDistancePercent. Value must be a positive percentage')
}


async function init(): Promise<void> {
  handleSignalInterrupt()
  validateConfig()
  const socket: WebsocketConnection = await createWebsocket()
  const gate: GateClient = await GateClient.create(config.gate.key, config.gate.secret)
  await EarlyBuyBot.create(socket, gate)
  // TEST signal! 
  // bot['createOperation']('BTC')
}

init().catch(e => {
  console.log('Error initializing BOT!')
  throw e
})


import WebsocketConnection from './lib/websocket'
import { GateClient } from './lib/gate-client'
import { config } from './config'
import { EarlyBuyBot } from './bot'

console.clear()


function createWebsocket(): Promise<WebsocketConnection> {
  let isInitialized = false
  return new Promise(resolve => {
    console.log('🟢 Initializing Websocket...')
    let startTime: number
    const socket = new WebsocketConnection({
      host: 'ws://108.61.197.146:5555/test/raul',
      reconnectOnDisconnection: true,
      reconnectOnDisconnectionDelay: 2000,
      onMessageCallback: (client, msg) => {
        if (msg.includes('pong')) {
          const elapsed = Math.round((Date.now() - startTime) / 2)
          console.log('Websocket latency', elapsed, 'ms (single way)')
          console.log()
          if (!isInitialized) {
            resolve(socket)
          } else isInitialized = true
        } else {
          console.log(msg)
        }
      },
      onConnectCallback: (socket) => {
        startTime = Date.now()
        socket.send({ ping: 'ping' })
      },
      logger: (msg: any): void => console.log(msg)
    })
    socket.connect()
  })

}


async function init(): Promise<void> {
  const socket: WebsocketConnection = await createWebsocket()
  const gate: GateClient = await GateClient.create(config.gate.key, config.gate.secret)
  const bot = await EarlyBuyBot.create(socket, gate)
  await bot.onNewAssetSignal('BTC')
}

init().catch(e => {
  console.log('Error initializing BOT!')
  throw e
})
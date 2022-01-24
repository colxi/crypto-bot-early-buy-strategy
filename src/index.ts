import WebsocketConnection from './lib/websocket'
import { GateClient } from './lib/gate-client'
import { config } from './config'
import { EarlyBuyBot } from './bot'
import { GateOrderDetails } from './lib/gate-client/types'

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


async function init(): Promise<void> {
  const socket: WebsocketConnection = await createWebsocket()
  const gate: GateClient = await GateClient.create(config.gate.key, config.gate.secret)
  const bot = await EarlyBuyBot.create(socket, gate)
  // TEST signal! 
  //; (bot as any).createOperation('BTC')
}

init().catch(e => {
  console.log('Error initializing BOT!')
  throw e
})


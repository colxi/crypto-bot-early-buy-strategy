import WebsocketConnection from '@/lib/websocket'


export class PriceTracker {
  constructor() {
    this.ws = null
  }

  ws: WebsocketConnection | null
  start() {
    this.ws = new WebsocketConnection({
      host: 'wss://ws.gate.io/v3/',
      reconnectOnDisconnection: true,
      reconnectOnDisconnectionDelay: 1000
    })
  }
}

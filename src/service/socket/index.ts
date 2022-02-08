import { config } from '@/config'
import EventedService from '@/lib/evented-service'
import WebsocketConnection, { WebsocketMessageEvent } from '@/lib/websocket'
import { Console } from '../console'

export type ServiceEvents = {
  message: (event: WebsocketMessageEvent) => void
}

class SocketService extends EventedService<ServiceEvents>{
  constructor() {
    super(['message'])
  }

  private connection!: WebsocketConnection

  public start(): Promise<void> {
    let isInitialized = false

    return new Promise(resolve => {
      Console.log('🟢 Initializing Websocket...')
      let startTime: number

      this.connection = new WebsocketConnection({
        host: config.socketAddr,
        reconnectOnDisconnection: true,
        reconnectOnDisconnectionDelay: 2000,
        logger: (msg: any): void => Console.log(msg)
      })

      this.connection.subscribe('message', (event) => {
        const message = event.detail.message
        Console.log('SOCKET: ', message)
        // PONG message looks like :  "pong {timestamp}"
        const isPongMessage = typeof message === 'string' && message.split(' ')[0] === 'pong'
        if (isPongMessage) {
          const elapsed = Math.round((Date.now() - startTime) / 2)
          Console.log('Websocket latency', elapsed, ' ms (single way)')
          if (!isInitialized) resolve()
          else isInitialized = true
          event.stopPropagation()
        } else this.dispatchEvent('message', event.detail)
      })

      this.connection.subscribe('connect', () => {
        startTime = Date.now()
        this.connection.send('ping')
      })

      this.connection.connect()
    })
  }

}

export const Socket = new SocketService()
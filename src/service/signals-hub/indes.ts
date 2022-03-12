import EventedService from '@/lib/evented-service'
import { CustomEvent } from '@/lib/evented-service/custom-event'
import WebSocket from 'ws'
import { Console } from '../console'

export class SignalsHubMessageEvent extends CustomEvent<{
  assetName: string
  type: 'PUMP' | 'TEST'
  messageTime: number
  sendTime: number
  exchange: string
  serverName: string
}>{ }
export class SignalsHubConnectionEvent extends CustomEvent<{
  address: string
}>{ }


type ServiceEvents = {
  message: (event: SignalsHubMessageEvent) => Promise<void>
  connection: (event: SignalsHubConnectionEvent) => Promise<void>
}

export class SignalsHubService extends EventedService<ServiceEvents>{
  constructor() {
    super(['message', 'connection'])
    this.server = null
  }

  server: WebSocket.Server | null

  start() {
    const wss = new WebSocket.Server({ port: 9898 })
    this.server = wss

    wss.on('connection', (ws, req) => {
      this.dispatchEvent('connection', {
        address: req.socket?.remoteAddress || 'UNKNOWN_ADDRESS'
      })

      ws.on('message', (message: string) => {
        let data
        try {
          data = JSON.parse(message)
        } catch (e) {
          Console.log('Error parsing message:', message)
          return
        }
        this.dispatchEvent('message', data)
      })
    })
  }

  stop() {
    this.server?.close()
    this.server = null
  }
}

export const SignalsHub = new SignalsHubService()

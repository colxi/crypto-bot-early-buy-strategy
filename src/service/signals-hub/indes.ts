import EventedService from '@/lib/evented-service'
import { CustomEvent } from '@/lib/evented-service/custom-event'
import WebSocket from 'ws'

export class SignalsHubMessageEvent extends CustomEvent<{
  assetName: string
  type: 'PUMP'
  timestamp: number
  exchange: string
  serverName: string
}>{ }


type ServiceEvents = {
  message: (event: SignalsHubMessageEvent) => Promise<void>
}

export class SignalsHubService extends EventedService<ServiceEvents>{
  constructor() {
    super(['message'])
    this.server = null

  }

  server: WebSocket.Server | null

  start() {
    const wss = new WebSocket.Server({ port: 9898 })
    this.server = wss
    console.log('starting signal hub')
    wss.on('connection', (ws) => {
      console.log('client connected!')
      ws.on('message', (message: string) => {
        let data
        try {
          data = JSON.parse(message)
        } catch (e) {
          console.log('error parsing message')
          return
        }
        this.dispatchEvent('message', data)
      })
    })
  }

  stop() {
    this.server?.close()
  }
}

export const SignalsHub = new SignalsHubService()

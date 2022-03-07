import EventedService from '@/lib/evented-service'
import { CustomEvent } from '@/lib/evented-service/custom-event'
import WebSocket from 'ws'

export class SignalsHubMessageEvent extends CustomEvent<{
  assetName: string,
  type: 'PUMP',
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

    wss.on('connection', (ws) => {
      console.log('client connected!')
      ws.on('message', (data: any) => {
        ws.send('rebut')
        this.dispatchEvent('message', data)
      })
    })
  }

  stop() {
    this.server?.close()
  }
}

export const SignalsHub = new SignalsHubService()

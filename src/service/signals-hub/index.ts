import { config } from '@/config'
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
  authToken: string
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
    super()
    this.server = null
  }


  private server: WebSocket.Server | null


  /**
   * 
   * Handle incoming message 
   * 
   */
  private onClientMessage(message: string) {
    let data: SignalsHubMessageEvent['detail']
    try {
      data = JSON.parse(message)
      if (typeof data !== 'object') throw new Error('Invalid message received')
      if (!this.isValidMessage(data)) throw new Error('Invalid message received')
    } catch (e) {
      Console.log('[SIGNAL-HUB] Error parsing incoming message:')
      Console.log('[SIGNAL-HUB]', message)
      return
    }

    if (data.authToken !== config.signalHub.authToken) {
      Console.log('[SIGNAL-HUB] Invalid auth token found in message', data.authToken)
      return
    }

    console.log(data)

    this.dispatchEvent('message', data)
  }


  /**
   * 
   * Validate incoming message schema
   * 
   */
  private isValidMessage(data: Record<string, any>) {
    if (!data.assetName) return false
    if (!data.exchange) return false
    if (!data.messageTime) return false
    if (!data.sendTime) return false
    if (!data.serverName) return false
    if (!data.type) return false
    if (!data.authToken) return false
    return true
  }


  /**
   * 
   * Start Service 
   * 
   */
  public async start() {
    Console.log('[SIGNAL-HUB] Starting Signal Hub...')
    this.server = new WebSocket.Server({ port: config.signalHub.port })
    /** Handle new connections */
    this.server.on('connection', (ws, message) => {
      this.dispatchEvent('connection', {
        address: message.socket?.remoteAddress || 'UNKNOWN_ADDRESS'
      })
      /** Handle client messages */
      ws.on('message', (message: string) => this.onClientMessage(message))
    })
  }


  /**
   * 
   * Stop Service 
   * 
   * */
  public async stop() {
    Console.log('[SIGNAL-HUB] Stopping Signal Hub...')
    this.server?.close()
    this.server = null
  }
}

export const SignalsHub = new SignalsHubService()

import { config } from '@/config'
import EventedService from '@/lib/evented-service'
import { CustomEvent } from '@/lib/evented-service/custom-event'
import WebSocket from 'ws'
import { Console } from '../console'


export class ServerActivityConnectionEvent extends CustomEvent<{
  address: string
}>{ }


type ServiceEvents = {
  connection: (event: ServerActivityConnectionEvent) => Promise<void>
}

export class ServerActivityService extends EventedService<ServiceEvents>{
  constructor() {
    super()
    this.server = null
  }


  private server: WebSocket.Server | null


  /**
   * 
   * Start Service 
   * 
   */
  public async start() {
    Console.log('[ACTIVITY-SERVER] Starting...')
    this.server = new WebSocket.Server({ port: 9998 })
    /** Handle new connections */
    this.server.on('connection', (ws, message) => {
      Console.log('[ACTIVITY-SERVER] connection!', message.socket?.remoteAddress || 'UNKNOWN_ADDRESS')
      this.dispatchEvent('connection', {
        address: message.socket?.remoteAddress || 'UNKNOWN_ADDRESS'
      })
    })
  }


  /**
   * 
   * Stop Service 
   * 
   * */
  public async stop() {
    Console.log('[ACTIVITY-SERVER] Stopping...')
    this.server?.close()
    this.server = null
  }


  /**
   * 
   * 
   * 
   */
  public send(message: any) {
    if (!this.server) return
    this.server!.clients.forEach(c => {
      c.send(message)
    })
  }
}

export const ServerActivity = new ServerActivityService()

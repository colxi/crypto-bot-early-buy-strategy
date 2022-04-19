import { config } from '@/config'
import EventedService from '@/lib/evented-service'
import { CustomEvent } from '@/lib/evented-service/custom-event'
import WebSocket from 'ws'
import { Console } from '../console'
import { CLI } from '@/service/cli'
import { IncomingMessage } from 'http'
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
    this.server = new WebSocket.Server({ port: config.publicWebsocket.port })
    this.server.on('connection', this.onClientConnection.bind(this))
  }


  /**
   * 
   * 
   * 
   */
  private onClientConnection(client: WebSocket, message: IncomingMessage) {
    client.on('message', this.onClientMessage.bind(this))
    Console.log('[ACTIVITY-SERVER] connection!', message.socket?.remoteAddress || 'UNKNOWN_ADDRESS')
    this.dispatchEvent('connection', {
      address: message.socket?.remoteAddress || 'UNKNOWN_ADDRESS'
    })
  }


  /**
   * 
   * 
   * 
   */
  private onClientMessage(msg: WebSocket.Data) {
    if (typeof msg !== 'string') {
      Console.log(`Invalid socket message format : ${typeof msg}`)
      return
    }
    let request: any
    try {
      request = JSON.parse(msg)
    } catch (e) {
      Console.log(`Invalid socket message format : ${typeof msg}`)
      return
    }
    if (request.action === 'command') CLI.interpreter(request.data).catch(e => Console.log(e))
    else Console.log(`Unknown action request ${request.action}`)
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

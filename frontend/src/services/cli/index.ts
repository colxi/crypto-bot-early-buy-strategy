import { config } from './../../config/index'
import { reactive } from 'vue'

class ReactiveList<T = any> {
  constructor(options: { limit: number }) {
    this.items = reactive([])
    this.limit = options.limit
  }

  private limit: number
  private items: T[]

  get data(): Readonly<any[]> {
    return this.items
  }

  push(i: T): void {
    this.items.push(i)
    if (this.items.length > this.limit) this.shift()
  }

  shift(): T | undefined {
    return this.items.shift()
  }

  clear(): void {
    this.items.splice(0, this.items.length)
  }
}

export class CliService {
  private static socket: WebSocket | null = null
  private static consoleHistory = new ReactiveList({ limit: 1000 })

  public static get history(): Readonly<any[]> { return this.consoleHistory.data }

  public static async start(): Promise<void> {
    console.log('[CliService] Starting...')
    this.initSocket()
  }

  private static initSocket(): void {
    console.log('[CliService] Connecting...')
    this.socket = new WebSocket(`${config.cliSocket.host}:${config.cliSocket.port}`)
    this.socket.addEventListener('message', this.onSocketMessage.bind(this))
    this.socket.addEventListener('close', this.initSocket.bind(this))
    this.socket.addEventListener('error', this.onSocketError.bind(this))
  }


  public static clearHistory(): void {
    this.consoleHistory.clear()
  }

  public static send(message: { action: string, data: any }): void {
    if (!this.socket) throw new Error('[CliService] Socket not found!')
    const strMsg = JSON.stringify(message)
    this.socket.send(strMsg)
  }


  private static onSocketMessage(event: MessageEvent<any>): void {
    this.consoleHistory.push(JSON.parse(event.data))
  }


  private static onSocketError(event: Event): void {
    console.log('Websocket Error', event)
  }
}

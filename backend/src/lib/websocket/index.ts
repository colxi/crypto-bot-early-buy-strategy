import WebSocket from 'ws'
import EventedService from '../evented-service'
import { CustomEvent } from '../evented-service/custom-event'
import { sleep } from '../sleep'
import {
  WebSocketStatus,
  WebsocketConnectionConfig,
} from './types'


export class WebsocketMessageEvent extends CustomEvent<{
  context: WebsocketConnection,
  message: Record<string, unknown> | string
}>{ }

export class WebsocketConnectionEvent extends CustomEvent<{
  context: WebsocketConnection,
}>{ }

type ServiceEvents = {
  message: (event: WebsocketMessageEvent) => void | Promise<void>
  connect: (event: WebsocketConnectionEvent) => void | Promise<void>
}

export default class WebsocketConnection extends EventedService<ServiceEvents>{
  constructor(config: WebsocketConnectionConfig) {
    super()
    this.#log = config.logger || this.#log
    this.host = config.host
    this.reconnectOnDisconnection = config.reconnectOnDisconnection
    this.reconnectOnDisconnectionDelay = config.reconnectOnDisconnectionDelay
    this.pingServiceInterval = 5000
    this.pingServiceTimeout = 1000 * 8
    this.#socket = null
    this.#isRequestedDisconnection = false
    this.#sentMessagesCount = 0
  }

  public readonly host: string
  public readonly reconnectOnDisconnection: boolean
  public readonly reconnectOnDisconnectionDelay: number
  public readonly pingServiceInterval: number
  public readonly pingServiceTimeout: number

  #sentMessagesCount: number
  #socket: WebSocket | null
  #isRequestedDisconnection: boolean
  #pingServiceTimer: NodeJS.Timeout | null = null
  #pingServiceLastPong: number = 0

  public get sentMessagesCount(): number {
    return this.#sentMessagesCount
  }

  public get isConnected(): boolean {
    return this.#socket?.readyState === WebSocketStatus.OPEN
  }

  public get isConnecting(): boolean {
    return this.#socket?.readyState === WebSocketStatus.CONNECTING
  }

  public get isDisconnecting(): boolean {
    return this.#socket?.readyState === WebSocketStatus.CLOSING
  }

  public get isDisconnected(): boolean {
    return this.#socket?.readyState === WebSocketStatus.CLOSED
  }

  /*----------------------------------------------------------------------------
   *
   * PUBLIC API METHODS
   *
   ---------------------------------------------------------------------------*/

  public send = (message: unknown): void => {
    if (!this.isConnected) return
    const msg = JSON.stringify(message)
    this.#socket!.send(msg)
    this.#sentMessagesCount++
  }

  public connect = (urlParams: string = ''): void => {
    if (this.isConnected || this.isConnecting) return
    this.#log(`Connecting to ${this.host}`)
    this.#isRequestedDisconnection = false
    this.#socket = urlParams
      ? new WebSocket(`${this.host}/${urlParams}`)
      : new WebSocket(this.host)
    this.#socket.on('ping', this.#onPing)
    this.#socket.on('pong', this.#onPong)
    this.#socket.on('error', this.#onSocketError)
    this.#socket.on('close', this.#onSocketDisconnect)
    this.#socket.on('open', this.#onSocketConnect)
    this.#socket.on('message', this.#onSocketMessage)
  }

  public disconnect = (): void => {
    if (this.isDisconnecting || this.isDisconnected) return
    this.#log('Disconnecting...')
    this.#isRequestedDisconnection = true
    if (this.#socket) {
      this.#socket.close()
      this.#socket = null
      this.#sentMessagesCount = 0
    }
  }

  public reconnect = async (): Promise<void> => {
    this.disconnect()
    await sleep(10000)
    this.connect()
  }

  #log = (...args: any[]): void => {
    void (args)
    // do nothing by default
  }

  /*----------------------------------------------------------------------------
   *
   * PING SERVICE 
   *
   ---------------------------------------------------------------------------*/

  #pingServiceStart = (): void => {
    // ensure Ping service is not already running by disabling it before
    // starting a new service
    this.#pingServiceStop()
    // reset last pong timestamp to current value 
    this.#pingServiceLastPong = Date.now()
    // start ping service
    this.#pingServiceTimer = setInterval(
      this.#pingServiceTick,
      this.pingServiceInterval
    )
  }

  #pingServiceStop = (): void => {
    if (!this.#pingServiceTimer) return
    clearInterval(this.#pingServiceTimer)
    this.#pingServiceTimer = null
  }

  #pingServiceTick = (): void => {
    const deltaTime = Date.now() - this.#pingServiceLastPong
    const hasTimeout = deltaTime > this.pingServiceTimeout
    if (hasTimeout) {
      this.#log('Connection Timeout')
      this.disconnect()
      this.#log(`Reconnecting in ${this.reconnectOnDisconnectionDelay}ms`)
      setTimeout(this.connect, this.reconnectOnDisconnectionDelay)
    } else {
      if (this.isConnected) this.#socket?.ping()
      else return
    }
  }


  /*----------------------------------------------------------------------------
   *
   * EVENT HANDLERS
   *
   ---------------------------------------------------------------------------*/
  #onPing = (): void => {
    this.#socket?.pong()
  }

  #onPong = (): void => {
    this.#pingServiceLastPong = Date.now()
  }

  #onSocketMessage = (msg: string): void => {
    let message: string | Record<string, any> = msg
    try {
      message = JSON.parse(msg)
    } catch (e) { /* ignore and proceed wit the string */
    }
    this.dispatchEvent('message', { context: this, message })
  }

  #onSocketError = (e: any): void => {
    this.#log(`Socket Error (${e?.code})`, e?.message)
  }

  #onSocketConnect = (): void => {
    this.#log('Connected')
    this.#pingServiceStart()
    this.dispatchEvent('connect', { context: this })
  }

  #onSocketDisconnect = (): void => {
    this.#log('Disconnected')
    this.#pingServiceStop()
    this.#socket = null
    if (
      !this.#isRequestedDisconnection &&
      this.reconnectOnDisconnection
    ) {
      setTimeout(
        this.connect,
        this.reconnectOnDisconnectionDelay
      )
    }
  }
}
import webSocket from 'ws'

export interface WebsocketConnectionConfig {
  host: string
  reconnectOnDisconnection: boolean
  reconnectOnDisconnectionDelay: number
  logger?: (...args: unknown[]) => void
}


export enum WebSocketStatus {
  OPEN = webSocket.OPEN,
  CONNECTING = webSocket.CONNECTING,
  CLOSING = webSocket.CLOSING,
  CLOSED = webSocket.CLOSED,
}

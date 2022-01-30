import WebsocketConnection from './lib/websocket'
import { GateClient } from './lib/gate-client'
import { config } from './config'
import { EarlyBuyBot } from './bot'
import { handleSignalInterrupt } from './lib/sigint'
import { validateConfig } from './config/validate-config'
import fs from 'fs'
import { createPath } from './lib/create-path'

console.clear()

function createWebsocket(): Promise<WebsocketConnection> {
  let isInitialized = false

  return new Promise(resolve => {
    console.log('🟢 Initializing Websocket...')
    let startTime: number

    const socket = new WebsocketConnection({
      host: config.socketAddr,
      reconnectOnDisconnection: true,
      reconnectOnDisconnectionDelay: 2000,
      logger: (msg: any): void => console.log(msg)
    })

    socket.subscribe('message', (event) => {
      const message = event.detail.message
      // PONG message looks like :  "pong {timestamp}"
      const isPongMessage = typeof message === 'string' && message.split(' ')[0] === 'pong'
      if (isPongMessage) {
        const elapsed = Math.round((Date.now() - startTime) / 2)
        console.log('Websocket latency', elapsed, 'ms (single way)')
        console.log()
        if (!isInitialized) resolve(socket)
        else isInitialized = true
        event.stopPropagation()
      }
    })

    socket.subscribe('connect', (event) => {
      startTime = Date.now()
      socket.send('ping')
    })

    socket.connect()
  })

}

function initializeLogsDirectory() {
  const logsAbsPath = createPath(__dirname, config.logsPath)
  console.log('Initializing LOGS directory...', logsAbsPath)

  // create directory if doe snot exist
  if (!fs.existsSync(logsAbsPath)) {
    try { fs.mkdirSync(logsAbsPath) }
    catch (e) { /** DO NOTHING */ }
  }
  if (!fs.existsSync(logsAbsPath)) {
    throw new Error(`Cannot create LOGS directory`)
  }

  // empty directory 
  if (config.cleanLogsPathOnStart) {
    console.log('Cleaning LOGS directory...')
    fs.readdir(logsAbsPath, (err, files) => {
      if (err) throw err
      for (const file of files) {
        fs.unlink(createPath(logsAbsPath, file), err => {
          if (err) throw err
        })
      }
    })
  }
}

async function init(): Promise<void> {

  try {
    handleSignalInterrupt()
    validateConfig()
    initializeLogsDirectory()
    const socket: WebsocketConnection = await createWebsocket()
    const gate: GateClient = await GateClient.create(config.gate.key, config.gate.secret)
    await EarlyBuyBot.create(socket, gate)
  } catch (e) {
    console.log('Error during initialization', (e as any)?.message)
  }
}

init()
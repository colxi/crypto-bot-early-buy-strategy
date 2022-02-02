import WebsocketConnection from './lib/websocket'
import { GateClient } from './lib/gate-client'
import { config } from './config'
import { EarlyBuyBot } from './bot'
import { handleSignalInterrupt } from './lib/sigint'
import { validateConfig } from './config/validate-config'
import fs from 'fs'
import { clearDir, createPath, getProjectRootDir } from './lib/file'

console.clear()



process.on('uncaughtException', function err(e ){
  console.log('CAPTURAT!')
  console.log(e)
  //console.log('DETAILS')
  //console.log((e as any).detail )
  //console.log((e as any).details )
  //console.log('RESPONSE')
  //console.log((e as any).response )
  process.exit()
});


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
      console.log(event.detail.message)
      const message = event.detail.message
      if(message ==='raul not in whitelist. Contact @ftor1 in telegram.'){
        socket.reconnect()
        return
      }
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
  const logsAbsPath = createPath(getProjectRootDir(), config.logsPath)
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
    clearDir(logsAbsPath)
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
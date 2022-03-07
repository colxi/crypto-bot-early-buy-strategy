import { SignalsHub } from './service/signals-hub/indes'
import WebsocketConnection from './lib/websocket'
import { Gate } from './service/gate-client'
import { config } from './config'
import { TradingBot } from './service/bot'
import { validateConfig } from './config/validate-config'
import { UI, ui } from './ui'
import { Console } from './service/console'
import { Socket } from './service/socket'
import { CLI } from './service/cli'
import { GateMonitor } from './service/gate-monitor'
import { OperationsMonitor } from './service/operations-monitor'


process.on('uncaughtException', function err(e) {
  ui.screen.destroy()
  console.log('CAPTURAT!')
  console.log(e.message)
  //console.log('DETAILS')
  //console.log((e as any).detail )
  //console.log((e as any).details )
  //console.log('RESPONSE')
  //console.log((e as any).response )
  process.exit()
})


async function init(): Promise<void> {
  try {
    validateConfig()
    const ui = new UI()
    await Console.start(ui.console)
    await Socket.start()
    await Gate.start()
    await TradingBot.start()
    await CLI.start()
    await GateMonitor.start(ui.balance)
    await OperationsMonitor.start(ui.operation)
  } catch (e) {
    ui.console.print('Error during initialization', (e as any)?.message)
  }
}

void init()
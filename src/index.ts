import { SignalsHub } from './service/signals-hub'
import { Gate } from './service/gate-client'
import { TradingBot } from './service/bot'
import { validateConfig } from './config/validate-config'
import { UI, ui } from './ui'
import { Console } from './service/console'
import { CLI } from './service/cli'
import { GateMonitor } from './service/gate-monitor'
import { OperationsMonitor } from './service/operations-monitor'


process.on('uncaughtException', function err(e) {
  ui.screen.destroy()
  console.clear()
  console.log('FATAL ERROR, please restart the bot!')
  console.log(e.message)
  process.exit()
})


async function init(): Promise<void> {
  try {
    validateConfig()
    const ui = new UI()
    await Console.start(ui.console)
    await Gate.start()
    await SignalsHub.start()
    await TradingBot.start()
    await CLI.start()
    await GateMonitor.start(ui.balance)
    await OperationsMonitor.start(ui.operation)
  } catch (e) {
    ui.console.print('Error during initialization', (e as any)?.message)
  }
}

void init()
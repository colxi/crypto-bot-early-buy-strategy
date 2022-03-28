import { VersionCheck } from './service/version-check/index'
import { SignalsHub } from './service/signals-hub'
import { Gate } from './service/gate-client'
import { TradingBot } from './service/bot'
import { validateConfig } from './config/validate-config'
import { ui } from './ui'
import { Console } from './service/console'
import { CLI } from './service/cli'
import { GateMonitor } from './service/gate-monitor'
import { OperationsMonitor } from './service/operations-monitor'
import { exec } from 'child_process'


process.on('uncaughtException', function err(e) {
  const errorMessage = e instanceof Error ? e.message : String(e)
  Console.log('FATAL ERROR, please restart the bot!')
  Console.log(errorMessage)
  void ui.screen.destroy()
  console.log()
  console.log('FATAL ERROR:')
  console.log()
  if (typeof e === 'object') {
    for (const prop of Object.getOwnPropertyNames(e || {}).sort()) {
      console.log(`[ERROR:${prop.toUpperCase()}]`)
      console.log(e[prop as keyof Error])
      console.log()
    }
  } else console.log(e)
  process.exit()
})

async function checkWinQuickMode() {
  return new Promise(resolve => {
    const isWin = process.platform === "win32"
    if (!isWin) return
    /* eslint-disable */
    Console.log('Checking Windows Terminal QuickMode...')
    exec(
      'reg query HKCU\\Console /v QuickEdit ',
      (error, stdout, stderr) => {
        Console.log(stderr)
        Console.log(error)
        Console.log(stdout)
        resolve(true)
      })
    /* eslint-enable */
  })
}

async function init(): Promise<void> {
  validateConfig()
  await Console.start()
  await VersionCheck.start()
  await checkWinQuickMode()
  await Gate.start()
  await SignalsHub.start()
  await TradingBot.start()
  await CLI.start()
  await GateMonitor.start()
  await OperationsMonitor.start()
}

init().catch(e => { throw e })
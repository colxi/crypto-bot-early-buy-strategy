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
    Console.log('Checking Windows Terminal QuickMode...')
    exec(
      'reg query HKCU\\Console /v QuickEdit',
      (error, stdout) => {
        if (stdout.includes('0x1')) {
          Console.log('QuickMode is ENABLED!.Disabling it!')
          exec(
            'reg add HKCU\\Console /v QuickEdit /t REG_DWORD /d 0 /f',
            (error, stdout) => {
              Console.log('QuickMode successfully DISABLED!')
              Console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
              Console.log('Please close the Terminal and restart the BOT for changes to make effect')
              Console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
              resolve(true)
            }
          )
        } else {
          Console.log('QuickMode is DISABLED!. OK!')
          resolve(true)
        }
      })
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
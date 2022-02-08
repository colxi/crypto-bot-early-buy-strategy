import { config } from '@/config'
import { clearDir, createPath, getProjectRootDir } from '@/lib/file'
import { Gate } from '@/service/gate-client'
import { AssetPair } from '@/service/gate-client/types'
import { ui } from '@/ui'
import { Console } from '../console'
import { TradingBot } from '../bot'
import { OperationEndReason } from '../bot/operation/types'

const commandsDictionary = [
  { command: 'q', name: 'Quit', usage: 'q' },
  { command: 'h', name: 'Help', usage: 'h' },
  { command: 'cls', name: 'Clear screen', usage: 'cls' },
  { command: 'ls', name: 'List operations', usage: 'ls' },
  { command: 'oi', name: 'Operation info', usage: 'oi <OPERATION_ID>' },
  { command: 'ko', name: 'Kill operation', usage: 'ko <OPERATION_ID>' },
  { command: 'co', name: 'Create Operation', usage: 'co <ASSET_SYMBOL>' },
  { command: 'sb', name: 'Show balance', usage: 'sb' },
  { command: 'gap', name: 'Get Asset price', usage: 'gap <ASSET_SYMBOL>' },
  { command: 'cl', name: 'Clear logs', usage: 'cl' },
] as const

type Command = (typeof commandsDictionary)[number]['command']

const commandsList = commandsDictionary.map(i => i.command)
function isValidCommand(command: string): command is Command {
  return commandsList.includes(command as any)
}


class CLIService {
  async start() {
    this.initPrompt().catch(e => { throw e })
  }

  async initPrompt() {
    while (true) {
      const message = await ui.inputBox.prompt()
      await this.interpreter(message)
    }
  }

  // promptInterface: readline.Interface

  private async interpreter(input: string) {
    if (!input.trim()) return
    const [command, ...params] = input.split(' ')
    const parameters = params.join(' ')

    const handlers: Record<Command, any> = {
      q: async () => { await this.commandQuit() },
      h: async () => { await this.commandHelp() },
      cls: async () => { await this.commandCls() },
      ls: async () => { await this.commandOperationList() },
      oi: async () => { await this.commandOperationInfo(parameters) },
      ko: async () => { await this.commandOperationKill(parameters) },
      co: async () => { await this.commandOperationCreate(parameters) },
      sb: async () => { await this.commandGateAvailableBalance() },
      cl: async () => { await this.commandLogsRemove() },
      gap: async () => { await this.getAssetPrice(parameters) },
    }

    Console.log('> ', input)
    if (isValidCommand(command)) await handlers[command](parameters)
    else Console.log('Unknown command: ', command)
  }


  /*------------------------------------------------------------------------------------------------
   * 
   * COMMANDS
   * 
   *----------------------------------------------------------------------------------------------*/

  async commandQuit() {
    Console.log('PRESS CTRL+C again to exit')
    Console.log('')
    process.kill(process.pid, 'SIGTERM')
  }


  async commandCls() {
    Console.clear()
  }


  async commandHelp() {
    Console.log('List of available commands...')

    const columnsWidth = [10, 30, 0]

    const colT1 = 'COMMAND'.padEnd(columnsWidth[0], ' ')
    const colT2 = 'NAME'.padEnd(columnsWidth[1], ' ')
    const colT3 = 'USAGE'
    const titles = `${colT1} ${colT2} ${colT3}`
    Console.log()
    Console.log(titles)
    Console.log(''.padEnd(titles.length, '-'))

    commandsDictionary.forEach((i) => {
      const col1 = i.command.padEnd(columnsWidth[0], ' ')
      const col2 = i.name.padEnd(columnsWidth[1], ' ')
      const col3 = i.usage
      Console.log(`${col1} ${col2} ${col3}`)
    })
    Console.log('')
  }


  async commandOperationList() {
    Console.log('Listing active Operations...')
    const activeOperations = Object.values(TradingBot.operations)
    if (!activeOperations.length) Console.log('There are no active operations')
    else activeOperations.forEach(i => Console.log(` ID: ${i.id} | ASSET PAIR: ${i.assetPair}`))
    Console.log('')
  }


  async commandOperationInfo(params: string) {
    const [operationID] = params.split(' ')
    const operation = TradingBot.operations[operationID]
    if (!operation) Console.log(`Operation (${operationID}) not found.`)
    else {
      Console.log('Operation details...')
      Console.log(operation)
    }
    Console.log('')
  }


  async commandOperationKill(params: string) {
    const [operationID,] = params.split(' ')
    const operation = TradingBot.operations[operationID]
    if (!operation) Console.log(`Operation (${operationID}) not found.`)
    else {
      Console.log('Killing operation...')
      await operation.finish(OperationEndReason.ERROR, new Error('Operation KILL requested by user'))
    }
    Console.log('')
  }

  async commandOperationCreate(params: string) {
    const [assetSymbol] = params.split(' ')
    if (!assetSymbol) Console.log('Please provide a valid symbol (eg: BTC, ETH, ...).')
    else {
      Console.log('Creating operation...')
      await TradingBot.createOperation(assetSymbol.toUpperCase())
    }
    Console.log('')
  }

  async commandGateAvailableBalance() {
    Console.log('Checking Gate Available USDT balance...')
    const balance = await Gate.geAvailableBalanceUSDT()
    Console.log(balance, 'USDT')
    Console.log('')
  }

  async commandLogsRemove() {
    Console.log('Removing all logs...')
    const logsAbsPath = createPath(getProjectRootDir(), config.logsPath)
    clearDir(logsAbsPath)
    Console.log('Done!')
    Console.log('')
  }

  async getAssetPrice(params: string) {
    Console.log('Getting Asset price...')
    const assetPair: AssetPair = `${params.toUpperCase()}_USDT`
    const price = await Gate.getAssetPairPrice(assetPair)
    Console.log(`${assetPair} ${price} USDT`)
    Console.log('')
  }
}


export const CLI = new CLIService()
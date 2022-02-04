import { config } from '@/config'
import { clearDir, createPath, getProjectRootDir } from '@/lib/file'
import { AssetPair } from '@/lib/gate-client/types'
import readline from 'readline'
import { EarlyBuyBot } from '..'
import { OperationEndReason } from '../operation/types'

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


export class CLI {
  constructor(bot: EarlyBuyBot) {
    this.bot = bot
    this.promptInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    this.promptInterface.resume()
    this.promptInterface.on("SIGINT", () => { this.commandQuit().catch((e) => { throw e }) })
    this.prompt()
  }

  promptInterface: readline.Interface
  bot: EarlyBuyBot

  private prompt() {
    this.promptInterface.question('> ', (message) => {
      this.interpreter(message)
        .then(() => this.prompt())
        .catch(e => console.log(e))
    })
  }

  private async interpreter(input: string) {
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

    if (isValidCommand(command)) await handlers[command](parameters)
    else {
      console.log('Unknown command', command)
      console.log()
    }
  }


  /*------------------------------------------------------------------------------------------------
   * 
   * COMMANDS
   * 
   *----------------------------------------------------------------------------------------------*/

  async commandQuit() {
    console.log('PRESS CTRL+C again to exit')
    console.log('')
    process.kill(process.pid, 'SIGTERM')
  }


  async commandCls() {
    console.clear()
  }


  async commandHelp() {
    console.log('List of available commands...')

    const columnsWidth = [10, 30, 0]

    const colT1 = 'COMMAND'.padEnd(columnsWidth[0], ' ')
    const colT2 = 'NAME'.padEnd(columnsWidth[1], ' ')
    const colT3 = 'USAGE'
    const titles = `${colT1} ${colT2} ${colT3}`
    console.log()
    console.log(titles)
    console.log(''.padEnd(titles.length, '-'))

    commandsDictionary.forEach((i) => {
      const col1 = i.command.padEnd(columnsWidth[0], ' ')
      const col2 = i.name.padEnd(columnsWidth[1], ' ')
      const col3 = i.usage
      console.log(`${col1} ${col2} ${col3}`)
    })
    console.log('')
  }


  async commandOperationList() {
    console.log('Listing active Operations...')
    const activeOperations = Object.values(this.bot.operations)
    if (!activeOperations.length) console.log('There are no active operations')
    else activeOperations.forEach(i => console.log(` ID: ${i.id} | ASSET PAIR: ${i.assetPair} | AMOUNT : ${i.amount}`))
    console.log('')
  }


  async commandOperationInfo(params: string) {
    const [operationID] = params.split(' ')
    const operation = this.bot.operations[operationID]
    if (!operation) console.log(`Operation (${operationID}) not found.`)
    else {
      console.log('Operation details...')
      console.log(operation)
    }
    console.log('')
  }


  async commandOperationKill(params: string) {
    const [operationID,] = params.split(' ')
    const operation = this.bot.operations[operationID]
    if (!operation) console.log(`Operation (${operationID}) not found.`)
    else {
      console.log('Killing operation...')
      await operation.finish(OperationEndReason.ERROR, new Error('Operation KILL requested by user'))
    }
    console.log('')
  }

  async commandOperationCreate(params: string) {
    const [assetSymbol] = params.split(' ')
    if (!assetSymbol) console.log('Please provide a valid symbol (eg: BTC, ETH, ...).')
    else {
      console.log('Creating operation...')
      await this.bot.createOperation(assetSymbol.toUpperCase())
    }
    console.log('')
  }

  async commandGateAvailableBalance() {
    console.log('Checking Gate Available USDT balance...')
    const balance = await this.bot.gate.geAvailableBalanceUSDT()
    console.log(balance, 'USDT')
    console.log('')
  }

  async commandLogsRemove() {
    console.log('Removing all logs...')
    const logsAbsPath = createPath(getProjectRootDir(), config.logsPath)
    clearDir(logsAbsPath)
    console.log('Done!')
    console.log('')
  }

  async getAssetPrice(params: string) {
    console.log('Getting Asset price...')
    const assetPair: AssetPair = `${params.toUpperCase()}_USDT`
    const price = await this.bot.gate.getAssetPairPrice(assetPair)
    console.log(`${assetPair} ${price} USDT`)
    console.log('')
  }
}

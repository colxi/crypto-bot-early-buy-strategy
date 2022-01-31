import { config } from '@/config'
import { clearDir, createPath, getProjectRootDir } from '@/lib/file'
import readline from 'readline'
import { EarlyBuyBot } from '..'
import { OperationEndReason } from '../operation/types'

const commandsDictionary = [
  { command: 'q', name: 'Quit', usage: 'q' },
  { command: 'h', name: 'Help', usage: 'h' },
  { command: 'cls', name: 'Clear screen', usage: 'cls' },
  { command: 'ol', name: 'Operations list', usage: 'ol' },
  { command: 'oi', name: 'Operation info', usage: 'oi <OPERATION_ID>' },
  { command: 'ok', name: 'Operation kill', usage: 'ok <OPERATION_ID>' },
  { command: 'oc', name: 'Operation create', usage: 'oc <ASSET_SYMBOL>' },
  { command: 'gab', name: 'Gate available balance', usage: 'gab' },
  { command: 'lr', name: 'Logs remove', usage: 'lg' },
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
      output: process.stdout
    })
    this.promptInterface.resume()
    this.prompt()
  }

  promptInterface: readline.Interface
  bot: EarlyBuyBot

  private prompt() {
    this.promptInterface.question('> ', async (message) => {
      await this.interpreter(message)
      this.prompt()
    })
  }

  private async interpreter(input: string) {
    const [command, ...params] = input.split(' ')
    const parameters = params.join(' ')

    const handlers: Record<Command, any> = {
      q: async () => { await this.commandQuit(parameters) },
      h: async () => { await this.commandHelp(parameters) },
      cls: async () => { await this.commandCls(parameters) },
      ol: async () => { await this.commandOperationList(parameters) },
      oi: async () => { await this.commandOperationInfo(parameters) },
      ok: async () => { await this.commandOperationKill(parameters) },
      oc: async () => { await this.commandOperationCreate(parameters) },
      gab: async () => { await this.commandGateAvailableBalance(parameters) },
      lr: async () => { await this.commandLogsRemove(parameters) },
    }

    if (isValidCommand(command)) await handlers[command](parameters)
    else console.log('unknown command', command)
  }


  /*------------------------------------------------------------------------------------------------
   * 
   * COMMANDS
   * 
   *----------------------------------------------------------------------------------------------*/

  async commandQuit(params: string) {
    console.log('PRESS CTRL+C again to exit')
    process.exit()
  }


  async commandCls(params: string) {
    console.clear()
  }


  async commandHelp(params: string) {
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
  }


  async commandOperationList(params: string) {
    console.log('Listing active Operations...')
    const activeOperations = Object.values(this.bot.operations)
    if (!activeOperations.length) console.log('There are no active operations')
    else activeOperations.forEach(i => console.log(` ID: ${i.id} | ASSET PAIR: ${i.assetPair} | AMOUNT : ${i.amount}`))
  }


  async commandOperationInfo(params: string) {
    const [operationID, ...parameters] = params.split(' ')
    const operation = this.bot.operations[operationID]
    if (!operation) console.log(`Operation (${operationID}) not found. Use "ol" to list all operations.`)
    else {
      console.log('Operation details...')
      console.log(operation)
    }
  }


  async commandOperationKill(params: string) {
    const [operationID, ...parameters] = params.split(' ')
    const operation = this.bot.operations[operationID]
    if (!operation) console.log(`Operation (${operationID}) not found. Use "ol" to list all operations.`)
    else {
      console.log('Killing operation...')
      operation.finish(OperationEndReason.ERROR, new Error('Operation KILL requested by user'))
    }
  }

  async commandOperationCreate(params: string) {
    const [assetSymbol, ...parameters] = params.split(' ')
    if (!assetSymbol) console.log('Please provide a valid symbol (eg: BTC, ETH, ...).')
    else {
      console.log('Creating operation...')
      this.bot.createOperation(assetSymbol.toUpperCase())
    }
  }

  async commandGateAvailableBalance(params: string) {
    console.log('Checking Gate Available USDT balance...')
    const balance = await this.bot.gate.geAvailableBalanceUSDT()
    console.log(balance, 'USDT')
  }

  async commandLogsRemove(params: string) {
    console.log('Removing all logs...')
    const logsAbsPath = createPath(getProjectRootDir(), config.logsPath)
    clearDir(logsAbsPath)
    console.log('Done!')
  }

}


import readline from 'readline'
import { EarlyBuyBot } from '..'
import { OperationEndReason } from '../operation/types'

const commandsDictionary = [
  { command: 'q', name: 'Quit', usage: 'q' },
  { command: 'h', name: 'Help', usage: 'h' },
  { command: 'cls', name: 'Clear', usage: 'cls' },
  { command: 'ol', name: 'Operation list', usage: 'ol' },
  { command: 'os', name: 'Operations select', usage: 'os <OPERATION_ID>' },
  { command: 'ok', name: 'Operation kill', usage: 'ok <OPERATION_ID>' },
  { command: 'oc', name: 'Operation create', usage: 'oc <ASSET_SYMBOL>' },
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
    this.promptInterface.question('> ', (message) => {
      this.interpreter(message)
      this.prompt()
    })
  }

  private interpreter(input: string) {
    const [command, ...params] = input.split(' ')
    const parameters = params.join(' ')

    const handlers: Record<Command, any> = {
      q: () => { this.commandQuit(parameters) },
      h: () => { this.commandHelp(parameters) },
      cls: () => { this.commandCls(parameters) },
      ol: () => { this.commandOperationList(parameters) },
      os: () => { this.commandOperationSelect(parameters) },
      ok: () => { this.commandOperationKill(parameters) },
      oc: () => { this.commandOperationCreate(parameters) },
    }

    if (isValidCommand(command)) handlers[command](parameters)
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

    const columnsWidth = [10, 20, 0]

    const colT1 = 'COMMAND'.padEnd(columnsWidth[0], ' ')
    const colT2 = 'NAME'.padEnd(columnsWidth[1], ' ')
    const colT3 = 'USAGE'
    console.log(`${colT1} ${colT2} ${colT3}`)

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
    if (!activeOperations.length) console.log('No active operations found')
    else activeOperations.forEach(i => console.log(` ID: ${i.id} | ASSET PAIR: ${i.assetPair} | AMOUNT : ${i.amount}`))
  }


  async commandOperationSelect(params: string) {
    const [operationID, ...parameters] = params.split(' ')
    const operation = this.bot.operations[operationID]
    if (!operation) console.log('Operation ID not found. Use Operation list to print all operations.')
    else {
      console.log('Operation details...')
      console.log(operation)
    }
  }


  async commandOperationKill(params: string) {
    const [operationID, ...parameters] = params.split(' ')
    const operation = this.bot.operations[operationID]
    if (!operation) console.log('Operation ID not found. Use Operation list to print all operations.')
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
}


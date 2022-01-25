import { Server } from 'ws'
import readline from 'readline'
import { config } from '../config'

const [host, port] = config.socketAddr.split('//')[1].split(':')

const wsServer = new Server({ host, port: Number(port) })
console.log('Starting WS SERVER!')
wsServer.on('connection', function connection(connection) {
  connection.on('message', function message(data: string) {
    if (data === '"ping"') connection.send('"pong"')
  })
  connection.send('Hi there!')
})

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function messageInput() {
  prompt.question('Message to send : ', function (message) {
    wsServer.clients.forEach(function each(client) {
      if (client.readyState === client.OPEN) {
        client.send(message)
        messageInput()
      }
    })
  })
}

messageInput()

import { sleep } from '@/lib/sleep'
import WebsocketConnection from '@/lib/websocket'


export async function testSymbols(socket: WebsocketConnection) {
  console.log()
  console.log('Aqui hauria d obrir DIA:')
  socket.send('Coinbase Pro available: (CTX) (DIA) (MPL) (PLU) (UNFI) (RUMR) CTX, DIA, MPL, PLU & UNFI are not yet available on https://t.co/Zkd27RUMRo or via our Consumer mobile apps. We will make a separate announcement if and when this support is added.')
  await sleep(1000)
  console.log('Aqui hauria d obrir NEAR:')
  socket.send('거래 KRW, BTC 마켓 디지털 자산 추가 (NEAR, YGG)')
  await sleep(1000)
  console.log()
  console.log('Aqui hauria d obrir QUACK:')
  socket.send('거래 KRW, BTC 마켓 디지털 자산 추가 (QUACK)')
  await sleep(1000)
  console.log()
  console.log('Aqui hauria d obrir YGG:')
  socket.send('거래 KRW, BTC 마켓 디지털 자산 추가 (LLLL, YGG)')
  await sleep(1000)
  console.log()
  console.log('Aqui hauria d obrir SPELL:')
  socket.send('Binance Will List Spell Token(SPELL) and TerraUSD(UST)')
  await sleep(1000)
  console.log()
  console.log('Aqui hauria d obrir UST:')
  socket.send('Binance Will List Spell Token(LLLL) and TerraUSD(UST)')
  await sleep(1000)
  console.log()
  console.log('Aqui hauria d obrir SPELL:')
  socket.send('Binance Will List Spell Token(SPELL)')
}
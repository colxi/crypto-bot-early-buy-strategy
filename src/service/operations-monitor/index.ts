import { TimeInMillis } from '@/lib/date'
import { Balance } from '@/ui/balance'
import { Operations } from '@/ui/operation'
import { TradingBot } from '../bot'
import { Console } from '../console'
import { Gate } from '../gate-client'

const REFRESH_INTERVAL_IN_MILLIS = TimeInMillis.ONE_SECOND

class OperationsMonitorService {
  public operations!: Operations

  async start(operations: Operations) {
    this.operations = operations
    setInterval(() => {
      this.updateWidget().catch((e) => Console.log(e.message))
    }, REFRESH_INTERVAL_IN_MILLIS)
  }

  async updateWidget() {
    // TradingBot.operations[0].operationCost
    const operations = [
      {
        id: 1,
        symbol: 'BTC',
        assetPair: 'BTC_USDT',
        amount: 11,
        entryPrice: '123.34',
        elapsedTime: 12,
        ROE: 12.2,
        operationCost: 1234.345
      }
    ]
    this.operations.update(operations as any)
  }
}

export const OperationsMonitor = new OperationsMonitorService()
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
    const operations = Object.values(TradingBot.operations)
    this.operations.update(operations)
  }
}

export const OperationsMonitor = new OperationsMonitorService()
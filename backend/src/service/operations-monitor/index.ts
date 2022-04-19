// import { ui } from './../../ui/index'
import { TimeInMillis } from '@/lib/date'
import { TradingBot } from '../bot'
import { Console } from '../console'

const REFRESH_INTERVAL_IN_MILLIS = TimeInMillis.ONE_SECOND

class OperationsMonitorService {
  async start() {
    setInterval(() => {
      this.updateWidget().catch((e) => Console.log(e.message))
    }, REFRESH_INTERVAL_IN_MILLIS)
  }

  async updateWidget() {
    const operations = Object.values(TradingBot.operations)
    // ui.operation.update(operations)
  }
}

export const OperationsMonitor = new OperationsMonitorService()
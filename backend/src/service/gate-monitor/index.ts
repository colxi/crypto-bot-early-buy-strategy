import { TimeInMillis } from '@/lib/date'
import { Console } from '../console'
import { Gate } from '../gate-client'
// import { ui } from './../../ui/index'


const REFRESH_INTERVAL_IN_MILLIS = TimeInMillis.FIVE_SECONDS

class GateMonitorService {

  async start() {
    setInterval(() => {
      this.updateWidget().catch((e) => Console.log(e.message))
    }, REFRESH_INTERVAL_IN_MILLIS)
  }

  async updateWidget() {
    const startTime = Date.now()
    const balanceInUSDT = await Gate.geAvailableBalanceUSDT()
    const latency = Date.now() - startTime
    // ui.balance.update(String(balanceInUSDT), latency)
  }
}

export const GateMonitor = new GateMonitorService()
import { TimeInMillis } from '@/lib/date'
import { Balance } from '@/ui/balance'
import { Console } from '../console'
import { Gate } from '../gate-client'

const REFRESH_INTERVAL_IN_MILLIS = TimeInMillis.FIVE_SECONDS

class GateMonitorService {
  public balance!: Balance

  async start(balance: Balance) {
    this.balance = balance
    setInterval(() => {
      this.updateWidget().catch((e) => Console.log(e.message))
    }, REFRESH_INTERVAL_IN_MILLIS)
  }

  async updateWidget() {
    const startTime = Date.now()
    const balanceInUSDT = await Gate.geAvailableBalanceUSDT()
    const latency = Date.now() - startTime
    this.balance.update(String(balanceInUSDT), latency)
  }
}

export const GateMonitor = new GateMonitorService()
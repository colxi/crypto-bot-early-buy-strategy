import { Console } from './../console/index'
// @ts-expect-error
import gitRepoIsUpToDate from 'git-repo-is-up-to-date'
import { TimeInMillis } from '@/lib/date'


export class VersionCheck {
  public static isUpToDate: boolean = false
  public static branch: string | null = null
  public static versionDate: string | null = null
  public static lastCheckError: string | null = null

  static async start() {
    Console.log('[VERSION-CHECK] Starting...')
    setInterval(
      () => { this.cycle().catch(() => Console.log('[VERSION-CHECK] Error checking version')) },
      TimeInMillis.ONE_DAY
    )
    await this.cycle()
  }

  static async cycle() {
    const isUpToDate = await this.isLastVersion()
    if (isUpToDate) Console.log('[VERSION-CHECK] You are running last available version')
    else {
      Console.log('[VERSION-CHECK] You ar NOT running last available version : ')
      Console.log('[VERSION-CHECK]', this.lastCheckError)
    }
  }

  static async isLastVersion() {
    this.lastCheckError = null
    const { isUpToDate, errors, repoInfo } = await gitRepoIsUpToDate()
    this.isUpToDate = isUpToDate
    this.branch = repoInfo.branch
    this.versionDate = repoInfo.committerDate
    if (!isUpToDate) this.lastCheckError = errors[0] || 'UNKNOWN ERROR'
    return isUpToDate
  }
}
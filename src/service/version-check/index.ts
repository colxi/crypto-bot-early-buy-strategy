import { Console } from './../console/index'
// @ts-expect-error
import gitRepoIsUpToDate from 'git-repo-is-up-to-date'


export class VersionCheck {
  public static isUpToDate: boolean = false
  public static branch: string | null = null
  public static versionDate: string | null = null

  static async start() {
    const { isUpToDate, errors, repoInfo } = await gitRepoIsUpToDate()
    this.isUpToDate = isUpToDate
    this.branch = repoInfo.branch
    this.versionDate = repoInfo.committerDate
    if (isUpToDate) {
      Console.log('You ar running last available version')
    }
    else {
      Console.log('You ar NOT running last available version : ')
      Console.log(errors[0])
    }
  }
}
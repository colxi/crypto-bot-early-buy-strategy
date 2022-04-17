import { Http } from '@/services/http'

export const api = {
  async getLogFiles(): Promise<{ files: string[] }> {
    return await Http.get({ url: '/operation/log/list' })
  },
  async getLog(fileName: string): Promise<{ data: string }> {
    return await Http.get({ url: `/operation/log/${fileName}` })
  }
}

import { HttpService } from '@/services/http'

export const api = {
  async getLogFiles(): Promise<{ files: string[] }> {
    return await HttpService.get({ url: '/operation/log/list' })
  },
  async getLog(fileName: string): Promise<{ data: string }> {
    return await HttpService.get({ url: `/operation/log/${fileName}` })
  }
}

import { HttpService } from '@/services/http'


export const api = {
  async login(username: string, password: string): Promise<{ authToken: string }> {
    return HttpService.post({
      url: '/user/login',
      data: { username, password }
    })
  }
}

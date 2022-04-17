import { Http } from '@/http/'


export const api = {
  async login(username: string, password: string): Promise<{ authToken: string }> {
    return Http.post({
      url: '/user/login',
      data: { username, password }
    })
  }
}

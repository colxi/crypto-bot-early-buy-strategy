import router from '@/router'

class HttpService {
  baseUrl: string = 'http://127.0.0.1:3100'

  get authToken(): string {
    return localStorage.getItem('auth-token') || ''
  }

  set authToken(token: string) {
    localStorage.setItem('auth-token', token)
  }

  private httpRequest = async (options: { url: string, method: string, body?: any }): Promise<any> => {
    console.log('request!', options.url, options.method)
    const response: Response = await fetch(
      options.url,
      {
        headers: {
          'auth-token': this.authToken,
          'Content-Type': 'application/json',
        },
        method: options.method,
        body: options.body
      }
    )
    if (response.status === 401) {
      console.log('[Http] Required token missing, expired or invalid')
      router.push('/login')
      return
    }
    if (response.status > 299) {
      throw new Error(`Request failed with code ${response.status}`)
    }

    return await response.json()
  }

  public setAuthToken(token: string): void {
    this.authToken = token
  }

  public async get(options: { url: string }): Promise<any> {
    return await this.httpRequest({
      url: Array.from(options.url).shift() === '/'
        ? `${this.baseUrl}${options.url}`
        : `${this.baseUrl}/${options.url}`,
      method: 'GET'
    })
  }

  public async post(options: { url: string, data: Record<string, unknown> | any[] | null }): Promise<any> {
    const requestBody = JSON.stringify(options.data) || null
    return await this.httpRequest({
      url: Array.from(options.url).shift() === '/'
        ? `${this.baseUrl}${options.url}`
        : `${this.baseUrl}/${options.url}`,
      method: 'POST',
      body: requestBody
    })
  }
}

export const Http = new HttpService()
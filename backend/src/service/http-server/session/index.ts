

export class HttpServerSessions {
  private static activeSessions: Record<string, { username: string, created: number }> = {}

  public static isValidSessionToken(token: string) {
    return Boolean(token && Object.keys(this.activeSessions).includes(token))
  }

  public static createSession(data: { authToken: string, username: string, created: number }) {
    this.activeSessions[data.authToken] = data
  }

  public static getSession(token: string) {
    return this.activeSessions[token]
  }
}


import { config } from '@/config'
import crypto from 'crypto'
import { RESTApiServiceRequestPayload, RESTApiServiceRequestResponder } from 'rest-api-service'
import { HttpServerSessions } from '../../session'


export const user = {
  login: (
    responder: RESTApiServiceRequestResponder,
    payload: RESTApiServiceRequestPayload
  ) => {
    const username = (payload.body as any)?.username
    const password = (payload.body as any)?.password
    const userExists = Object.keys(config.publicApi.users).includes(username)
    const isValidPassword = password === config.publicApi.users[username]
    if (userExists && isValidPassword) {
      const authToken = crypto.randomBytes(20).toString('hex')
      HttpServerSessions.createSession({
        authToken: authToken,
        username: username,
        created: Date.now()
      })

      responder(200, { authToken: authToken })
    } else {
      responder(403, { result: false })
    }
  },

  me: (
    responder: RESTApiServiceRequestResponder,
    payload: RESTApiServiceRequestPayload,
    token: string
  ) => {
    responder(
      200,
      {
        user: {
          username: HttpServerSessions.getSession(token).username
        }
      }
    )
  }
}

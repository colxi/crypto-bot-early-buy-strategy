import { config } from '@/config'
import { httpServerRoutes } from './routes'
import RESTApiService from 'rest-api-service'
import { HttpServerSessions } from './session'


export async function startHTTPServerService() {
  const myService = await RESTApiService.create(httpServerRoutes, {
    protocol: 'http',
    port: config.publicApi.port,
    verbose: false,
    auth: HttpServerSessions.isValidSessionToken,
    cors: {
      credentials: true,
      origin: "*"
    }
  })
  return myService
}

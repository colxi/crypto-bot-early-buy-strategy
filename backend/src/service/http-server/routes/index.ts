import { RESTApiServiceRoute } from 'rest-api-service'
import { Controllers } from '../controllers/index'

export const httpServerRoutes: RESTApiServiceRoute[] = [
  ['POST', '/user/login', Controllers.user.login, false],
  ['GET', '/user/me', Controllers.user.me, true],
  ['GET', '/operation/log/list', Controllers.operation.logList, true],
  ['GET', '/operation/log/:file', Controllers.operation.getLogData, true],
]

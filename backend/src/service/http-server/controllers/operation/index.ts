import { createPath, getProjectRootDir } from '@/lib/file'
import { config } from '@/config'
import { RESTApiServiceRequestPayload, RESTApiServiceRequestResponder } from 'rest-api-service'
import fs from 'fs'

export const operation = {
  logList: (
    responder: RESTApiServiceRequestResponder,
    payload: RESTApiServiceRequestPayload
  ) => {
    const dirPath = createPath(getProjectRootDir(), config.logsPath)
    const files = fs.readdirSync(dirPath)
    responder(200, { files: files })
  },

  getLogData: (
    responder: RESTApiServiceRequestResponder,
    payload: RESTApiServiceRequestPayload
  ) => {
    const file = (payload.params as any)?.file
    const dirPath = createPath(getProjectRootDir(), config.logsPath)
    const files = fs.readdirSync(dirPath)
    if (!files.includes(file)) responder(404, {})
    else {
      const filePath = createPath(getProjectRootDir(), config.logsPath, file)
      const buffer = fs.readFileSync(filePath)
      const fileContent = buffer.toString()
      responder(200, { data: fileContent })
    }
  },
}

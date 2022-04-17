import path from 'path'
import fs from 'fs'

export function getProjectRootDir() {
  const _path = require?.main?.filename || process?.mainModule?.filename
  return path.join(path.dirname(_path!), '..')
}

export function createPath(...parts: string[]): string {
  return path.join(...parts)
}

export function clearDir(path: string) {
  fs.readdir(path, (err, files) => {
    if (err) throw err
    for (const file of files) {
      fs.unlink(createPath(path, file), err => {
        if (err) throw err
      })
    }
  })
}
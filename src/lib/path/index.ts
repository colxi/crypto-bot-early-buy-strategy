import path from 'path'

export function getProjectRootDir() {
    const _path = require?.main?.filename || process?.mainModule?.filename
    return path.join(path.dirname(_path!), '..')
}
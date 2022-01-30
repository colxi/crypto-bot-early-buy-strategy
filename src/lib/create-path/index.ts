import pathPosix from 'path/posix'
import pathWin from 'path/win32'

export function createPath(...parts: string[]): string {
  const isWindows = process.platform === "win32"
  return isWindows ? pathWin.join(...parts) : pathPosix.join(...parts)
}

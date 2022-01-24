import fs from 'fs'

export class Logger {
  constructor(filename: string) {

  }


  public log() {
    fs.appendFile('log.txt', 'new data', (err) => {
      if (err) {
        // append failed
      } else {
        // done
      }
    })
  }

}
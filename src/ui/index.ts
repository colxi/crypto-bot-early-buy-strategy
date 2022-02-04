import blessed from 'blessed'

class UI {
  constructor() {
    const screen = blessed.screen({
      // autoPadding: false,
      // warnings: true,
      // smartCSR: true,
      // fastCSR: true,
      // useBCE: true,
      smartCSR: true,
      resizeTimeout: 500,
      dockBorders: true,
    })


    this.layout = blessed.layout({
      parent: screen,
      top: 'top',
      left: 'left',
      width: '100%',
      height: '100%',
      // border: 'line',
      style: {
        bg: 'red',
        border: {
          fg: 'blue'
        }
      }
    } as any)


    this.leftColumn = blessed.scrollablebox({
      parent: this.layout,
      left: 0,
      width: '50%',
      height: '100%',
      border: 'line',
      scrollbar: {
        bg: 'blue'
      } as any,
    })
    this.rightColumn = blessed.box({
      parent: this.layout,
      width: '50%',
      left: '50%',
      height: '100%',
      border: 'line',
      scrollbar: {
        bg: 'blue'
      } as any,
    })

    const prompt = blessed.prompt({
      left: '0',
      bottom: '0',
      height: 'shrink',
      width: '100%',
      border: 'line',
      style: {
        // fg: 'blue',
        // bg: 'black',
        bold: true,

      }
    })

    this.leftColumn.append(prompt)

    this.leftColumn.key(['q', 'C-c'], function quit() {
      return process.exit(0)
    })

    prompt.input('Search:', 'test', (a: Error, value: string) => {
      this.printLeft('aaaaaa')
      this.printLeft(value)
      //
    })

    screen.render()
  }

  public layout: blessed.Widgets.LayoutElement
  public leftColumn: blessed.Widgets.BoxElement
  public rightColumn: blessed.Widgets.BoxElement
  public leftColumnData: string[] = []

  public printLeft(content: unknown) {
    this.leftColumnData.push(String(content))
    this.leftColumnData.splice(0, this.leftColumnData.length - Number(this.leftColumn.height))
    this.leftColumn.setText(this.leftColumnData.join('\n'))
  }
}

export const ui = new UI()
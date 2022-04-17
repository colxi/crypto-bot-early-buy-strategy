<script lang="ts">
import { computed, defineComponent, onMounted, reactive, Ref, ref, watch } from 'vue'

class ReactiveList {
  constructor(options: { limit: number }) {
    this.items = ref([])
    this.limit = options.limit
  }

  private limit: number
  private items: Ref<any[]>

  get data(): Readonly<any[]> {
    return this.items.value
  }

  add(i: any) {
    this.items.value.push(i)
    if (this.items.value.length > this.limit) this.items.value.shift()
  }
}

export default defineComponent({
  name: 'Dashboard',

  components: {},

  setup() {
    const data = new ReactiveList({ limit: 1000 })
    const consoleRef = ref<HTMLElement>()

    watch(data.data, () => {
      //
      const availableScroll =
        Number(consoleRef.value?.scrollHeight) - Number(consoleRef.value?.clientHeight)
      const currentScrollPosition = Number(consoleRef.value?.scrollTop)
      setTimeout(() => {
        const scrollDiff = availableScroll - currentScrollPosition
        if (scrollDiff > 50) return
        const result = consoleRef.value?.scrollTo({
          top: availableScroll + 100,
          behavior: 'smooth',
        })
      }, 100)
    })

    onMounted(() => {
      const socket = new WebSocket('ws://127.0.0.1:9998')

      socket.addEventListener('message', (event) => {
        data.add(JSON.parse(event.data))
      })

      socket.addEventListener('error', () => {
        console.log('Websocket Error')
      })
    })

    const formatLine = (line: any[]): string => {
      const formatted = line.map((i, index) => {
        if (index === 0) {
          return `<span class="time">${i}</span>`
        } else if (typeof i === 'number' || String(Number(i)) === i) {
          return `<span class="number">${i}</span>`
        } else if (i === 'USDT') {
          return `<span class="usdt">${i}</span>`
        } else return i
      })
      return formatted.join(' ')
    }

    return { formatLine, consoleRef, data }
  },
})
</script>

<template>
  <pre
    class="widget"
    ref="consoleRef"
  ><div v-for="(l, i) in data.data" :key="i" v-html="formatLine(l)"></div></pre>
</template>

<style lang="scss" scoped >
.widget {
  border: 1px solid #7f7f7f;
  height: 100%;
  overflow-y: scroll;
  padding: 10px;
}

pre {
  margin: 0;
  padding: 0;
}

pre::v-deep {
  .time {
    color: yellow;
  }

  .number {
    color: green;
  }

  .usdt {
    color: orange;
  }
}
</style>

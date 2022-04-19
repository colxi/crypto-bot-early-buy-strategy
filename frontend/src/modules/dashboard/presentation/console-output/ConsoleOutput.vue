<script lang="ts">
import { CliService } from '@/services/cli'
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
  name: 'ConsoleOutput',
  components: {},

  setup() {
    const consoleRef = ref<HTMLElement>()
    const data = CliService.history

    const updateScrollBar = (): void => {
      const consoleDom = consoleRef.value
      if (!consoleDom) return
      const availableScroll = Number(consoleDom.scrollHeight) - Number(consoleDom.clientHeight)
      const currentScrollPosition = Number(consoleDom.scrollTop)
      const scrollDiff = availableScroll - currentScrollPosition
      if (scrollDiff < 100) {
        consoleDom.scrollTo({
          top: availableScroll,
          behavior: 'smooth',
        })
      }
    }

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

    watch(data, () => setTimeout(updateScrollBar, 100))

    return { formatLine, consoleRef, data }
  },
})
</script>

<template>
  <pre
    class="widget"
    ref="consoleRef"
  ><div v-for="(l, i) in data" :key="i" v-html="formatLine(l)"></div></pre>
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

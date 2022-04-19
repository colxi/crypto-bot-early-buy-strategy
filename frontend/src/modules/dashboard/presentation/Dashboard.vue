<script lang="ts">
import Vue, { defineComponent, ref } from 'vue'
import ConsoleInput from './console-input/ConsoleInput.vue'
import ConsoleOutput from './console-output/ConsoleOutput.vue'
import LogsFiles from './log-files/LogsFiles.vue'

export default defineComponent({
  name: 'Dashboard',

  components: { ConsoleOutput, ConsoleInput, LogsFiles },

  setup() {
    const consoleInputRef = ref<Vue.ComponentPublicInstance>()
    const onConsoleClick = (): void => {
      if (!consoleInputRef.value) return
      console.log(consoleInputRef.value)
      consoleInputRef.value.$el.focus()
    }

    return { consoleInputRef, onConsoleClick }
  },
})
</script>

<template>
  <div class="wrapper">
    <div class="col-left" @click="onConsoleClick">
      <ConsoleOutput />
      <ConsoleInput ref="consoleInputRef" />
    </div>
    <div class="col-right">
      <LogsFiles />
    </div>
  </div>
</template>

<style lang="scss" scoped >
.wrapper {
  display: grid;
  grid-template-columns: 4fr 2fr;
  height: 100vh;
  padding: 10px;
  gap: 10px;
}

.col-left {
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr 30px;
  gap: 10px;
  height: 100%;
}
</style>

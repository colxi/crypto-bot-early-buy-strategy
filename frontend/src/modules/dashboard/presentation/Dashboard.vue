<script lang="ts">
import { computed, defineComponent, onMounted, reactive, Ref, ref } from 'vue'
import CLI from './cli/CLI.vue'
import Console from './console/Console.vue'
import LogsFiles from './log-files/LogsFiles.vue'

export default defineComponent({
  name: 'Dashboard',

  components: { Console, CLI, LogsFiles },

  setup() {
    return {}
  },
})
</script>

<template>
  <div class="wrapper">
    <div class="col-left">
      <Console />
      <CLI />
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

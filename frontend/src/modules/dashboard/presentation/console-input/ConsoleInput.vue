<script lang="ts">
import { CliService } from '@/services/cli'
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'ConsoleInput',

  components: {},

  setup() {
    const input = ref<string>('')

    const onEnterPress = (): void => {
      if (input.value === 'cls') CliService.clearHistory()
      else CliService.send({ action: 'command', data: input.value })
      input.value = ''
    }

    return { onEnterPress, input }
  },
})
</script>

<template>
  <input v-model="input" v-on:keyup.enter="onEnterPress" />
</template>

<style lang="scss" scoped >
.widget {
  border: 1px solid #7f7f7f;
  height: 100%;
  overflow: scroll;
  padding: 10px;
}
pre {
  margin: 0;
  padding: 0;
}
</style>

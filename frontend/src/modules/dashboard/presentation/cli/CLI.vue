<script lang="ts">
import { computed, defineComponent, onMounted, reactive, Ref, ref } from 'vue'

export default defineComponent({
  name: 'Dashboard',

  components: {},

  setup() {
    const input = ref('')
    return { input }
  },
})
</script>

<template>
  <input v-model="input" />
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

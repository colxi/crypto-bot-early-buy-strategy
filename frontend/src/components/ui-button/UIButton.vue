<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'UIButton',
  props: {
    type: {
      type: String,
      required: false,
      default: 'normal',
    },
  },

  setup(props) {
    const buttonType = ref(props.type)
    return { buttonType }
  },
})
</script>

<template>
  <div :class="['button', buttonType]">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.button {
  display: inline-block;
  cursor: pointer;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 4px;
  text-align: center;

  &.normal {
    background: #1ca10f;
    color: white;
    &:hover {
      background: #1b9210;
      color: white;
    }
  }

  &.transparent {
    background: transparent;
    color: #1ca10f;
    &:hover {
      background: transparent;
      color: white;
    }
  }

  &.danger {
    background: #f74848;
    color: white;
    &:hover {
      background: #d43f3f;
      color: white;
    }
  }
}
</style>

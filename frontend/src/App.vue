<script lang="ts">
import { defineComponent, ref } from 'vue'
import { Http } from '@/http/'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'App',

  setup() {
    const userData = Http.get({ url: '/user/me' })
    useRouter().push('/dashboard')
  },
})
</script>


<template>
  <router-view />
</template>

<style lang="scss">
html,
body {
  margin: 0px;
  padding: 0px;
  height: 100vh;
}

* {
  box-sizing: border-box;
}

body {
  background: #1d1e20;
  color: #7f7f7f;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  height: 100vh;
}
/** SCROLL BARS */
::-webkit-scrollbar {
  width: 10px;
  height: 11px;
}
::-webkit-scrollbar-button {
  width: 0px;
  height: 0px;
}
::-webkit-scrollbar-thumb {
  background: #c9c9c9;
  border-radius: 50px;
  border: 2px solid rgb(68, 68, 68);
}
::-webkit-scrollbar-thumb:hover {
  background: transparent;
}
::-webkit-scrollbar-thumb:active {
  background: transparent;
}
::-webkit-scrollbar-track {
  background: transparent;
  border: 0px none transparent;
  border-radius: 53px;
}
::-webkit-scrollbar-track:hover {
  background: transparent;
}
::-webkit-scrollbar-track:active {
  background: transparent;
}
::-webkit-scrollbar-corner {
  background: transparent;
}
</style>

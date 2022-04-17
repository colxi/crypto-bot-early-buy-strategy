<script lang="ts">
import { defineComponent, ref } from 'vue'
import UIButton from '@/components/ui-button/UIButton.vue'
import { Http } from '@/http'
import { api } from '@/modules/login/api'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'Login',

  components: { UIButton },

  setup() {
    const username = ref('admin')
    const password = ref('1234')
    const router = useRouter()

    const onSubmitButtonClick = async (): Promise<void> => {
      const { authToken } = await api.login(username.value, password.value)
      Http.setAuthToken(authToken)
      router.push('/dashboard')
    }

    return { onSubmitButtonClick, username, password }
  },
})
</script>

<template>
  <div class="wrapper">
    <div class="form">
      <input v-model="username" />
      <input v-model="password" />
      <UIButton @click="onSubmitButtonClick">Submit</UIButton>
    </div>
  </div>
</template>

<style lang="scss" scoped >
.wrapper {
  display: grid;
  width: 100%;
  height: 100vh;
}

.form {
  width: 100px;
  height: 300px;
  margin: auto;
}
</style>

<script lang="ts">
import { api } from '@/modules/dashboard/api'
import { computed, defineComponent, onBeforeMount, onMounted, reactive, Ref, ref } from 'vue'

export default defineComponent({
  name: 'Dashboard',

  components: {},

  setup() {
    const logFiles = ref<string[]>([
      '23-03-21 23:34 BTC',
      '23-03-21 23:34 BTC',
      '23-03-21 23:34 BTC',
      '23-03-21 23:34 BTC',
      '23-03-21 23:34 BTC',
      '23-03-21 23:34 BTC',
      '23-03-21 23:34 BTC',
    ])
    const logData = ref<string>('')

    const isModalVisible = ref(false)

    const onLogFileClick = async (index: number): Promise<void> => {
      const { data } = await api.getLog(logFiles.value[index])
      logData.value = data
      isModalVisible.value = true
    }

    const onModalOverrideClick = (): void => {
      isModalVisible.value = false
    }

    onBeforeMount(async () => {
      const { files } = await api.getLogFiles()
      logFiles.value = files
    })

    return { onModalOverrideClick, onLogFileClick, isModalVisible, logFiles, logData }
  },
})
</script>

<template>
  <div class="widget">
    <div v-for="(logFile, index) in logFiles" :key="index" @click="onLogFileClick(index)">
      📄 {{ logFile }}
    </div>
  </div>
  <div v-if="isModalVisible" class="modal">
    <div class="modal__overlay" @click="onModalOverrideClick"></div>
    <div class="modal__container">
      <div>Header</div>
      <div class="modal__body">
        <pre>{{ logData }}</pre>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped >
.widget {
  border: 1px solid #7f7f7f;
  height: 100%;
  overflow-y: scroll;
  padding: 10px;
}

.modal {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  display: grid;

  .modal__overlay {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    background: black;
    display: grid;
    z-index: 99998;
    opacity: 0.5;
  }

  .modal__container {
    width: 800px;
    height: 80%;
    background: #1d1e20;
    margin: auto;
    z-index: 99999;
    border: 1px solid grey;
    overflow-y: hidden;
    display: grid;
    grid-template-rows: 30px auto;
  }

  .modal__body {
    padding: 10px;
    overflow-y: scroll;
    height: 100%;
  }
}
</style>

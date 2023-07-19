<script setup>
  import {useTaskStore} from '@/store/task';
  const taskStore = useTaskStore();
</script>

<template>
  <div id="app-solution" v-html="taskStore.solution"></div>
</template>

<style scoped>

  @import '@/styles/content.css';

  #app-solution {
    height: 100%;
    padding: 20px;
    border: 1px solid #cccccc;
    overflow-y: scroll;
  }


</style>

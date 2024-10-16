<script setup>
import { useTaskStore } from '@/store/task';

const taskStore = useTaskStore();

function handleBeforeinput(event) {
  event.preventDefault();
  return false;
}

</script>

<template>
  <div id="app-instructions" class="long-essay-content"
       contenteditable="true"
       @beforeinput="handleBeforeinput"
       v-html="taskStore.instructions"></div>
</template>


<style>
/* Must be global because of v-html used for the instructions */
@import '@/styles/content.css';
</style>

<style scoped>

#app-instructions {
  height: 100%;
  padding: 20px;
  border: 1px solid #cccccc;
  overflow-y: scroll;
}

</style>

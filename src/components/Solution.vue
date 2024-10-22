<script setup>
import { useTaskStore } from '@/store/task';
import { useLayoutStore } from '@/store/layout';
import { nextTick, watch } from 'vue';

const taskStore = useTaskStore();
const layoutStore = useLayoutStore();

function handleBeforeinput(event) {
  event.preventDefault();
  return false;
}

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'solution') {
    await nextTick();
    document.getElementById('app-solution').focus();
  }
}
handleFocusChange();
watch(() => layoutStore.focusChange, handleFocusChange);

</script>

<template>
  <div id="app-solution" class="long-essay-content"
       contenteditable="true"
       @beforeinput="handleBeforeinput"
       v-html="taskStore.solution"></div>
</template>

<style>
/* Must be global because of v-html used for the instructions */
@import '@/styles/content.css';

</style>
<style scoped>

#app-solution {
  height: 100%;
  padding: 20px;
  border: 1px solid #cccccc;
  overflow-y: scroll;
}


</style>

<script setup>
  import {useEssayStore} from '@/store/essay';
  const essayStore = useEssayStore();

  import TextHighlighter from '@/lib/highlight/TextHighlighter';

  function init() {
    var hltr = new TextHighlighter(document.getElementById('app-essay'));
  }

</script>

<template>
  <button @click = "init()">Init</button>
  <div id="app-essay" v-html="essayStore.text"></div>
</template>

<style scoped>

  @import '@/styles/content.css';

  #app-essay {
    height: 100%;
    padding: 20px;
    border: 1px solid #cccccc;
    overflow-y: scroll;
  }


</style>

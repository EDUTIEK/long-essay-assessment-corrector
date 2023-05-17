<script setup>
  import {useEssayStore} from '@/store/essay';
  import TextMarker from '@/lib/highlight/TextMarker';
  import {onMounted} from 'vue'

  const essayStore = useEssayStore();

  var marker;

  onMounted(() => {
    marker = new TextMarker(document.getElementById('app-essay'));
  })

  </script>

<template>
  <div id="app-essay" v-html="essayStore.text"></div>
</template>

<style>

  @import '@/styles/content.css';

  #app-essay {
    height: 100%;
    padding: 20px;
    border: 1px solid #cccccc;
    overflow-y: scroll;
  }

  w-p.other {
    background-color: aliceblue;
  }

  w-p.own {
    background-color: skyblue;
  }

  w-p.active {
    background-color: yellow!important;
  }



</style>

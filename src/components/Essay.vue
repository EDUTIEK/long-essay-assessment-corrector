<script setup>
  import {useEssayStore} from '@/store/essay';
  import {useCommentsStore} from "@/store/comments";
  import TextMarker from '@/lib/highlight/TextMarker';
  import {onMounted} from 'vue'

  const essayStore = useEssayStore();
  const commentsStore = useCommentsStore();
  let marker;

  onMounted(() => {
    marker = new TextMarker(document.getElementById('app-essay'), {bindEvents: true, onSelection});

    commentsStore.getActiveOtherComments.forEach(comment => {
        marker.showMark('other', comment.start_position, comment.end_position);
    });

    commentsStore.getActiveOtherComments.forEach(comment => {
        marker.showMark('own', comment.start_position, comment.end_position);
    });

  });

  function onSelection(selected) {
      console.log ('parent ' + selected.parentNumber)
      commentsStore.createComment(selected.firstWord, selected.lastWord, selected.parentNumber);
  }



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
    background-color: rgba(240, 248, 255, 0.99);
  }

  w-p.own {
    background-color: skyblue;
  }

  w-p.active {
    background-color: yellow!important;
  }



</style>

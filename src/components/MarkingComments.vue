<script setup>
import { useCommentsStore } from "@/store/comments";
import MarkingComment from '@/components/MarkingComment.vue';
import { nextTick, watch } from 'vue';
import Snippets from "@/components/Snippets.vue";

const commentsStore = useCommentsStore();

/**
 * Focus the currently selected comment
 */
async function focusSelected() {
  await nextTick();
  let el = document.getElementById('appCommentContainer' + commentsStore.selectedKey);
  if (el) {
    let tx = el.querySelector('textarea');
    if (tx) {
      tx.focus();
    }
  }
}

watch(() => commentsStore.selectionChange, focusSelected);


/**
 * Set the scrolling so that the complete mark is visible
 */
async function scrollToFirstVisible() {
  await nextTick();
  let el = document.getElementById('appCommentContainer' + commentsStore.firstVisibleKey);
  if (el) {
    el.scrollIntoView();
  }
}

watch(() => commentsStore.firstVisibleKey, scrollToFirstVisible);

</script>


<template>
  <div id="appMarkingComments">
    <!-- <snippets></snippets> -->
    <marking-comment v-for="comment in commentsStore.activeComments" :key="comment.key" :comment="comment"></marking-comment>
  </div>
</template>

<style scoped>

</style>

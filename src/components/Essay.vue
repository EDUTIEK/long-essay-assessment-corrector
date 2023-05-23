<script setup>
  import {useEssayStore} from '@/store/essay';
  import {useCommentsStore} from "@/store/comments";
  import Comment from "@/data/Comment";
  import TextMarker from '@/lib/highlight/TextMarker';
  import {onMounted} from 'vue';
  import { nextTick} from "vue";
  import { watch } from 'vue';
  import { ref } from 'vue';

  const essayStore = useEssayStore();
  const commentsStore = useCommentsStore();
  const showMenu = ref(false);

  let marker;
  let menuSelection;
  let menuComment;

  onMounted(() => {
    marker = new TextMarker(document.getElementById('app-essay'), {bindEvents: true, onSelection});
    commentsStore.getActiveComments.forEach(comment => updateMark(comment));
  });


  commentsStore.$subscribe((mutation, state) =>
  {
      marker.hideAllMarks('own');
      marker.hideAllMarks('own-excellent');
      marker.hideAllMarks('own-cardinal');
      marker.hideAllMarks('other');
      marker.hideAllMarks('other-excellent');
      marker.hideAllMarks('other-cardinal');
      marker.hideAllMarks('selected');

      commentsStore.getActiveComments.forEach(comment => updateMark(comment));
      let comment = commentsStore.getComment(commentsStore.selectedKey);
      if (comment) {
          marker.showMark('selected', comment.start_position, comment.end_position);
      }
  })

  /**
   * Update the marking of a comment
   */
  function updateMark(comment) {
      marker.hideMark(comment.prefix + '-excellent', comment.start_position, comment.end_position);
      marker.hideMark(comment.prefix + '-cardinal', comment.start_position, comment.end_position);
      marker.hideMark(comment.prefix, comment.start_position, comment.end_position);

      if (comment.rating_excellent) {
          marker.showMark(comment.prefix + '-excellent', comment.start_position, comment.end_position);
      } else if (comment.rating_cardinal) {
          marker.showMark(comment.prefix + '-cardinal', comment.start_position, comment.end_position);
      } else {
          marker.showMark(comment.prefix, comment.start_position, comment.end_position);
      }
  }

  /**
   * Handle the click into the text or a selection of a text range
   * Decide whether to add a new comment or select an existing comment
   */
  async function onSelection(selected) {
      if (showMenu.value) {
          showMenu.value = false;
      }
      else {
          // check if new selection overlaps with own comments
          let comments = commentsStore.getOwnCommentsInRange(selected.firstWord, selected.lastWord);
          if (comments.length) {
              // get the first overlapping comment
              let comment = comments.shift();

              if (selected.isCollapsed) {
                  // just clicked at a position => select the overlapping comment
                  marker.removeSelection();
                  commentsStore.selectComment(comment.key);
              }
              else {
                  // selected an overlapping range => show menu whether to change boundaries or add a new comment
                  menuSelection = selected;
                  menuComment = comment;
                  showMenu.value=true;
                  await nextTick();
                  document.getElementById("app-essay-menu").style.left = selected.mouseX + 'px';
                  document.getElementById("app-essay-menu").style.top = selected.mouseY + 'px';
              }
         }
         else {
              // no overlapping => create a new comment
              marker.removeSelection();
              commentsStore.createComment(selected.firstWord, selected.lastWord, selected.parentNumber);
         }
      }
  }

  /**
   * Add comment for a previously selected range
   */
  function menuAddComment() {
      showMenu.value = false;
      marker.removeSelection();
      commentsStore.createComment(menuSelection.firstWord, menuSelection.lastWord, menuSelection.parentNumber);
  }

  /**
   * Edit the comment from a previously selected range
   */
  function menuEditComment() {
      showMenu.value = false;
      marker.removeSelection();
      menuComment.start_position = menuSelection.firstWord;
      menuComment.end_position = menuSelection.lastWord;
      menuComment.parent_number = menuSelection.parentNumber;
      commentsStore.updateComment(menuComment);
      commentsStore.selectComment(menuComment.key);
  }

</script>

<template>
    <div id="app-essay-wrapper">
        <div id="app-essay" v-html="essayStore.text"></div>
        <v-menu v-model="showMenu">
            <div id="app-essay-menu">
                <v-btn icon="mdi-comment-plus" @click="menuAddComment()"></v-btn>
                <v-btn icon="mdi-comment-edit" @click="menuEditComment()"></v-btn>
            </div>

        </v-menu>
    </div>
</template>

<style>

  @import '@/styles/content.css';

  #app-essay-wrapper {
      height: 100%;
  }

  #app-essay {
    height: 100%;
    padding: 20px;
    border: 1px solid #cccccc;
    overflow-y: scroll;
  }

  #app-essay-menu {
      position: absolute;
      width: 150px;
  }

  w-p.other {
      background-color: #F5F7FB;
  }
  w-p.other-cardinal {
      background-color: #FCF6F4;
  }
  w-p.other-excellent {
      background-color: #F7F9F7;
  }

  w-p.own {
      background-color: #D8E5F4;
  }
  w-p.own-cardinal {
      background-color: #FBDED1;
  }
  w-p.own-excellent {
      background-color: #E3EFDD;
  }

  w-p.other.selected {
      background-color: #94C3FC;
  }
  w-p.own.selected {
      background-color: #94C3FC!important;
  }
  w-p.other-cardinal.selected {
      background-color: #FCB494;
  }
  w-p.own-cardinal.selected {
      background-color: #FCB494!important;
  }
  w-p.other-excellent.selected {
      background-color: #BBEBA5;
  }
  w-p.own-excellent.selected {
      background-color: #BBEBA5!important;
  }

</style>

<script setup>
  import {useEssayStore} from '@/store/essay';
  import {useCommentsStore} from "@/store/comments";
  import Comment from "@/data/Comment";
  import TextMarker from '@/lib/highlight/TextMarker';
  import {onMounted} from 'vue'
  import { watch } from 'vue'

  const essayStore = useEssayStore();
  const commentsStore = useCommentsStore();
  let marker;


  onMounted(() => {
    marker = new TextMarker(document.getElementById('app-essay'), {bindEvents: true, onSelection});
    commentsStore.getActiveComments.forEach(comment => updateMark(comment));
  });

  commentsStore.$subscribe((mutation, state) => {
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
   * @param comment
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

  function onSelection(selected) {
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


  /*
  w-p.other {
      background-color: #E8EFF8;
  }
  w-p.other-cardinal {
    background-color: #FDEBE3;
  }
  w-p.other-excellent {
      background-color: #EEF5EB;
  }

  w-p.own {
    background-color: #C8DAF0;
  }
  w-p.own-cardinal {
      background-color: #F9D1BF;
  }
  w-p.own-excellent {
      background-color: #D7E9CF;
  }

  w-p.active {
    background-color: #A9C5E7;
  }
  w-p.active-cardinal {
      background-color: #F6B69A;
  }
  w-p.active-excellent {
      background-color: #C1DBB5;
  }
    */


</style>

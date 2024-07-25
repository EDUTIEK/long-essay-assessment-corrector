<script setup>
  import {useEssayStore} from '@/store/essay';
  import {useCommentsStore} from "@/store/comments";
  import {useSummariesStore} from '@/store/summaries';
  import {usePreferencesStore} from '@/store/preferences';
  import {useSettingsStore} from '@/store/settings';

  import TextMarker from '@/lib/TextMarker';
  import {onMounted, watch, ref} from 'vue';

  const essayStore = useEssayStore();
  const commentsStore = useCommentsStore();
  const summariesStore = useSummariesStore();
  const preferencesStore = usePreferencesStore();
  const settingsStore = useSettingsStore();

  let marker;

  onMounted(() => {
    applyZoom();
    marker = new TextMarker(document.getElementById('app-essay'), onSelection, onIntersection);
    commentsStore.activeComments.forEach(comment => updateMark(comment));
  });

  function refreshMarks() {
      //console.log(Date.now(), 'refreshMarks');
      marker.hideAllMarksAndLabels();
      commentsStore.activeComments.forEach(comment => updateMark(comment));
      refreshSelection();
  }
  watch(() => commentsStore.markerChange, refreshMarks);
  watch(() => commentsStore.filterChange, refreshMarks);

  function refreshSelection() {
      //console.log(Date.now(), 'refreshSelection');
      marker.hideAllMarksOfClass('selected');
      //marker.hideAllMarksOfClass('labelled');

      let comment = commentsStore.getComment(commentsStore.selectedKey);
      if (comment) {
          marker.showMark('selected', comment.start_position, comment.end_position);
          marker.addLabel('labelled', comment.label, comment.start_position);
          marker.scrollToMark(comment.start_position, comment.end_position);
      }
  }
  watch(() => commentsStore.selectionChange, refreshSelection);


  /**
   * Update the marking of a comment
   */
  function updateMark(comment) {
      if(comment.prefix) {
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
      marker.addLabel('labelled', comment.label, comment.start_position);
  }

  /**
   * Handle the click into the text or a selection of a text range
   * Decide whether to add a new comment or select an existing comment
   */
  async function onSelection(selected) {
      // check if new selection overlaps with own comments
      let comments = commentsStore.getActiveCommentsInRange(selected.firstWord, selected.lastWord);
      if (comments.length) {
          // get the first overlapping comment
          let comment = comments.shift();

          if (selected.isCollapsed) {
              // just clicked at a position => select the overlapping comment
              marker.removeSelection();
              commentsStore.selectComment(comment.key);
          }
          else {
              // always create a new comment, even if it overlaps (VC 26.5.2023)
              marker.removeSelection();
              if (!summariesStore.isOwnDisabled) {
                  commentsStore.createComment(selected.firstWord, selected.lastWord, selected.parentNumber);
              }
          }
      }
      else {
          // no overlapping => create a new comment
          marker.removeSelection();
          if (!summariesStore.isOwnDisabled) {
              commentsStore.createComment(selected.firstWord, selected.lastWord, selected.parentNumber);
          }
      }
  }

  /**
   * Handle a comment geting visible by scrolling
   * @param {int} firstWord
   */
  function onIntersection(firstWord) {
      let comments = commentsStore.getActiveCommentsByStartPosition(firstWord);
      if (comments.length) {
          let comment = comments.shift();
          commentsStore.setFirstVisibleComment(comment.key);
      }
  }

  function zoomIn() {
    preferencesStore.zoomEssayTextIn();
    applyZoom();
  }

  function zoomOut() {
    preferencesStore.zoomEssayTextOut();
    applyZoom();
  }

  function applyZoom() {
    document.getElementById('app-essay').style.fontSize=(preferencesStore.essay_text_zoom * 16) + 'px';
  }
</script>

<template>
    <div id="app-essay-wrapper">
      <div class="appTextButtons">
        <v-btn-group density="comfortable" variant="outlined" divided>
          <v-btn size="small" icon="mdi-magnify-minus-outline" @click="zoomOut()"></v-btn>
          <v-btn size="small" icon="mdi-magnify-plus-outline" @click="zoomIn()"></v-btn>
        </v-btn-group>
      </div>
      <div id="app-essay" :class="'long-essay-content ' + settingsStore.headlineClass" v-html="essayStore.text">
      </div>
    </div>
</template>

<style>
/* Must be global because of v-html used for the instructions */

  #app-essay-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .appTextButtons {
    text-align: center;
    padding-bottom: 5px;
  }

  #app-essay {
    flex-grow: 1;
    width: 100%;
    padding: 20px;
    overflow-y: scroll;
  }

  #app-essay-menu {
      position: absolute;
      width: 150px;
  }

  w-p.labelled:before {
      content: attr(label); /* value that that refers to CSS 'content' */
      position: relative;
      left: -3px;
      top: -7px;
      padding: 3px;
      z-index: 10000;
      background-color: #aaaaaaaa;
      color: white;
      font-family: sans-serif;

      font-size: 14px;
      font-style: normal;
      font-weight: normal;
  }

  w-p.labelled.selected:before {
    background-color: grey;
  }
  /*
  w-p.other {
      background-color: #F5F7FB;
  }
  w-p.other-cardinal {
      background-color: #FCF6F4;
  }
  w-p.other-excellent {
      background-color: #F7F9F7;
  }
  */

  w-p.other {
      background-color: #D8E5F4;
  }
  w-p.other-cardinal {
      background-color: #FBDED1;
  }
  w-p.other-excellent {
      background-color: #E3EFDD;
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

<script setup>
import {stores} from "@/store";
import TextMarker from '@/lib/TextMarker';
import Comment from "@/data/Comment";
import { ref, onMounted,  nextTick, watch } from 'vue';

const essayStore = stores.essay();
const commentsStore = stores.comments();
const summariesStore = stores.summaries();
const preferencesStore = stores.preferences();
const settingsStore = stores.settings();
const layoutStore = stores.layout();
const configStore = stores.config();

const showMenu = ref(false);

let marker;

onMounted(() => {
  applyZoom();
  marker = new TextMarker(document.getElementById('app-essay'), onSelection, onIntersection);
  commentsStore.activeComments.forEach(comment => updateMark(comment));
});

watch(() => layoutStore.focusChange, handleFocusChange);
watch(() => commentsStore.markerChange, refreshMarks);
watch(() => commentsStore.filterChange, refreshMarks);
watch(() => commentsStore.selectionChange, refreshSelection);
watch(() => commentsStore.caretRequest, setCaretToSelectedComment);

function handleBeforeinput(event) {
  event.preventDefault();
  return false;
}

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'essay') {
    await nextTick();
    document.getElementById('app-essay').focus();
  }
}
handleFocusChange();

function refreshMarks() {
  marker.hideAllMarksAndLabels();
  commentsStore.activeComments.forEach(comment => updateMark(comment));
}

function refreshSelection() {
  refreshMarks();

  let comment = commentsStore.getComment(commentsStore.selectedKey);
  if (comment) {
    const style = configStore.getCommentStyle(comment.correction_position, true, true);
    marker.showMark(Comment.CLASS_SELECTED, style, comment.start_position, comment.end_position);
    marker.addLabel('labelled', comment.label, comment.start_position);
    marker.addLabel('selected', comment.label, comment.start_position);
    marker.scrollToMark(comment.start_position, comment.end_position);
  }
}

function setCaretToSelectedComment()
{
  let comment = commentsStore.getComment(commentsStore.selectedKey);
  marker.setCaretToMark(comment.start_position);
}


/**
 * Update the marking of a comment
 */
function updateMark(comment) {
  for (const css_class of Comment.CORRECTOR_CSS_CLASSES) {
    marker.hideMark(css_class, comment.start_position, comment.end_position);
  }
  const style = configStore.getCommentStyle(
      comment.correction_position,
      comment.key == commentsStore.selectedKey, true);
  marker.showMark(comment.getCssClass(), style, comment.start_position, comment.end_position);
  marker.addLabel('labelled', comment.label, comment.start_position);
  if (comment.key == commentsStore.selectedKey) {
    marker.addLabel('selected', comment.label, comment.start_position);
  }
}

/**
 * Handle the click into the text or a selection of a text range
 * Decide whether to add a new comment or select an existing comment
 */
async function onSelection(selected) {
  if (!stores.settings().Task.enable_comments) {
    return;
  }

  // check if new selection overlaps with own comments
  let comments = commentsStore.getActiveCommentsInRange(selected.firstWord, selected.lastWord);
  if (comments.length) {
    // get the first overlapping comment
    let comment = comments.shift();

    if (selected.isCollapsed) {
      // just clicked at a position => select the overlapping comment
      marker.removeSelection();
      commentsStore.selectComment(comment.key);
    } else {
      // always create a new comment, even if it overlaps (VC 26.5.2023)
      marker.removeSelection();
      if (!summariesStore.isOwnDisabled) {
        commentsStore.createComment(selected.firstWord, selected.lastWord, selected.parentNumber);
      }
    }
  } else if (!selected.isCollapsed) {
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
  document.getElementById('app-essay').style.fontSize = (preferencesStore.essay_text_zoom) + 'rem';
}

</script>

<template>
  <div id="app-essay-wrapper">
    <div class="appTextButtons">
      <v-btn-group density="comfortable" variant="outlined" divided>
        <v-btn :title="$t('essayZoomOut')" size="small" icon="mdi-magnify-minus-outline" @click="zoomOut()"></v-btn>
        <v-btn :title="$t('essayZoomIn')" size="small" icon="mdi-magnify-plus-outline" @click="zoomIn()"></v-btn>
      </v-btn-group>
    </div>
    <component :is="'style'">
      {{ configStore.commentStyles }}
    </component>
    <div contenteditable="true"  id="app-essay"
         @beforeinput="handleBeforeinput"
         :class="'xlas-content ' + settingsStore.contentClass"
         v-html="'<style>' + configStore.commentStyles + '</style>' + essayStore.text">
    </div>

    <v-menu v-model="showMenu">
        <v-btn-group>
          <v-btn icon="mdi-marker" @click=""></v-btn>
          <v-btn icon="mdi-format-underline" @click=""></v-btn>
          <v-btn icon="mdi-format-underline-wavy" @click=""></v-btn>
          <v-btn @click="">✓</v-btn>
          <v-btn @click="">✗</v-btn>
          <v-btn @click="">?</v-btn>
          <v-btn @click="">⩝</v-btn>
        </v-btn-group>
    </v-menu>
  </div>
</template>

<style>
/* Must be global because of v-html used for the instructions */

.xlas-counter {
  font-family:sans-serif;
  font-size:0.7em;
  font-weight:normal;
  margin-left: -10mm;
  float: left;
}

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
  padding-left: 15mm;
  overflow-y: scroll;
}

#app-essay-menu1 {
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
  border-radius: 5px;
}

w-p.labelled.selected:before {
  background-color: #606060;
}

</style>

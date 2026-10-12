<script setup>
import {stores} from "@/store";
import TextMarker from '@/lib/TextMarker';
import Comment from "@/data/Comment";
import Mark from "@/data/Mark";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const essayStore = stores.essay();
const commentsStore = stores.comments();
const summariesStore = stores.summaries();
const preferencesStore = stores.preferences();
const settingsStore = stores.settings();
const layoutStore = stores.layout();
const configStore = stores.config();
const correctionsStore = stores.corrections();

const showMenu = ref(false);
const selectedShape = computed(() => commentsStore.selectedComment?.marks?.[0]?.shape ?? '');
const selectedSymbol = computed(() => commentsStore.selectedComment?.marks?.[0]?.symbol ?? '');
const canEditSelected = computed(() => {
  const comment = commentsStore.selectedComment;
  return !!comment
      && comment.correction_key == correctionsStore.ownKey
      && !summariesStore.isOwnDisabled;
});

// gap between last line of a mark and the menu
const menu_gap = 4;

let updateMenuLocation = () => {};
let essayResizeObserver;
let menuWords = null;

let marker;

onMounted(() => {
  applyZoom();
  const essay = document.getElementById('app-essay');
  marker = new TextMarker(essay, onSelection, onIntersection);
  commentsStore.activeComments.forEach(comment => updateMark(comment));

  essayResizeObserver = new ResizeObserver(() => {
    const comment = commentsStore.selectedComment;
    if (showMenu.value && comment) {
      menuWords = chooseMenuWords(comment);
    }
    updateMenuLocation();
  });
  essayResizeObserver.observe(essay);
  refreshSelection();
});

onBeforeUnmount(() => {
  essayResizeObserver?.disconnect();
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
    menuWords = chooseMenuWords(comment);
    showMenu.value = !!menuWords;
    if (showMenu.value) {
      nextTick(() => {
        updateMenuLocation();
        requestAnimationFrame(updateMenuLocation);
      });
    }
  } else {
    menuWords = null;
    showMenu.value = false;
  }
}

/**
 * Place the menu under the chosen line of the marking and keep it
 * inside the essay horizontally. Called again while the essay scrolls.
 */
function menuLocationStrategy(data, _props, contentStyles) {
  let retries = 0;

  function updateLocation() {
    const essay = document.getElementById('app-essay');
    const content = data.contentEl.value;
    const comment = commentsStore.selectedComment;
    if (!showMenu.value || !essay || !content || !comment || !menuWords) {
      return;
    }

    const line = firstLineRect(essay, menuWords.start, menuWords.end);
    const menuWidth = content.offsetWidth;
    if (!line || !menuWidth) {
      if (line && retries++ < 8) {
        requestAnimationFrame(updateLocation);
      }
      return;
    }
    retries = 0;

    const essayRect = essay.getBoundingClientRect();
    let left = line.left + (line.width - menuWidth) / 2;
    const minLeft = essayRect.left;
    const maxLeft = essayRect.left + essay.clientWidth - menuWidth;
    left = maxLeft < minLeft ? minLeft : Math.min(Math.max(left, minLeft), maxLeft);

    const anchor = content.offsetParent;
    const anchorRect = anchor ? anchor.getBoundingClientRect() : { top: 0, left: 0 };
    const menuTop = line.bottom + menu_gap;
    const menuHeight = content.offsetHeight;
    const menuBottom = menuTop + menuHeight;
    const menuOverlaps = menuBottom > essayRect.top && menuTop < essayRect.bottom;
    const clipTop = Math.max(0, essayRect.top - menuTop);
    const clipBottom = Math.max(0, menuBottom - essayRect.bottom);
    const style = {
      position: anchor ? 'absolute' : 'fixed',
      top: Math.round(menuTop - anchorRect.top) + 'px',
      left: Math.round(left - anchorRect.left) + 'px',
      right: 'auto',
      bottom: 'auto',
      transform: 'none',
      visibility: menuOverlaps ? 'visible' : 'hidden',
      clipPath: clipTop || clipBottom
          ? 'inset(' + Math.round(clipTop) + 'px 0 ' + Math.round(clipBottom) + 'px 0)'
          : 'none',
    };
    Object.assign(content.style, style);
    contentStyles.value = style;
  }

  updateMenuLocation = updateLocation;
  nextTick(() => requestAnimationFrame(updateLocation));
  return { updateLocation };
}

/**
 * Words the menu stays attached to.
 * The last line when the whole marking is on screen, otherwise the first line,
 * so the menu sits below the marking and does not jump while scrolling.
 */
function chooseMenuWords(comment) {
  const essay = document.getElementById('app-essay');
  const lines = visualLines(essay, comment.start_position, comment.end_position);
  if (!lines.length) {
    return null;
  }
  const essayRect = essay.getBoundingClientRect();
  const last = lines[lines.length - 1];
  const lastFits = last.top >= essayRect.top && last.bottom <= essayRect.bottom;
  const line = lastFits ? last : lines[0];
  return { start: line.start, end: line.end };
}

/**
 * Visual lines of a marked word range
 */
function visualLines(essay, start, end) {
  if (!essay) {
    return [];
  }
  const nodes = [];
  essay.querySelectorAll('w-p').forEach(node => {
    const word = parseInt(node.getAttribute('w'), 10);
    if (word >= start && word <= end) {
      nodes.push({ word, rect: node.getBoundingClientRect() });
    }
  });

  const lines = [];
  for (const node of nodes) {
    const rect = node.rect;
    if (!rect.height && !rect.width) {
      continue;
    }
    const previous = lines[lines.length - 1];
    const threshold = Math.max(4, rect.height * 0.6);
    if (previous && Math.abs(rect.top - previous.top) <= threshold) {
      previous.end = node.word;
      previous.left = Math.min(previous.left, rect.left);
      previous.right = Math.max(previous.right, rect.right);
      previous.top = Math.min(previous.top, rect.top);
      previous.bottom = Math.max(previous.bottom, rect.bottom);
    } else {
      lines.push({
        start: node.word,
        end: node.word,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      });
    }
  }
  return lines;
}

/**
 * Bounding box of the marked words on the first visual line
 */
function firstLineRect(essay, start, end) {
  const line = visualLines(essay, start, end)[0];
  if (!line) {
    return null;
  }
  return {
    left: line.left,
    right: line.right,
    top: line.top,
    bottom: line.bottom,
    width: line.right - line.left,
  };
}

function ensureTextMark(comment) {
  let mark = comment.marks[0];
  if (!mark) {
    mark = new Mark({
      key: 'M' + comment.corrector_id + '_' + Math.random().toString(),
    });
    comment.marks.push(mark);
  }
  return mark;
}

async function applyShape(shape) {
  const comment = commentsStore.selectedComment;
  if (!canEditSelected.value) {
    return;
  }
  const mark = ensureTextMark(comment);
  if (mark.shape === shape) {
    return;
  }
  mark.shape = shape;
  await commentsStore.updateComment(comment);
}

async function applySymbol(symbol) {
  const comment = commentsStore.selectedComment;
  if (!canEditSelected.value) {
    return;
  }
  const mark = ensureTextMark(comment);
  if (mark.symbol === symbol) {
    return;
  }
  mark.symbol = symbol;
  await commentsStore.updateComment(comment);
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
  nextTick(() => {
    const comment = commentsStore.selectedComment;
    if (showMenu.value && comment) {
      menuWords = chooseMenuWords(comment);
    }
    updateMenuLocation();
  });
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
         @scroll.passive="updateMenuLocation"
         :class="'xlas-content ' + settingsStore.contentClass"
         v-html="'<style>' + configStore.commentStyles + '</style>' + essayStore.text">
    </div>

    <v-menu v-model="showMenu"
            target="#app-essay"
            location="bottom"
            :close-on-content-click="false"
            :disable-initial-focus="true"
            :persistent="true"
            :transition="false"
            :z-index="11000"
            scroll-strategy="reposition"
            :location-strategy="menuLocationStrategy">
      <v-sheet class="app-essay-menu" elevation="8" rounded @mousedown.prevent>
        <v-btn-group density="comfortable" divided variant="text">
          <v-btn size="small" icon="mdi-marker"
                 :disabled="!canEditSelected"
                 :class="{ 'app-essay-menu-active': selectedShape === Mark.SHAPE_TEXT_MARKER }"
                 @click="applyShape(Mark.SHAPE_TEXT_MARKER)"></v-btn>
          <v-btn size="small" icon="mdi-format-underline"
                 :disabled="!canEditSelected"
                 :class="{ 'app-essay-menu-active': selectedShape === Mark.SHAPE_TEXT_UNDERLINE }"
                 @click="applyShape(Mark.SHAPE_TEXT_UNDERLINE)"></v-btn>
          <v-btn size="small" icon="mdi-format-underline-wavy"
                 :disabled="!canEditSelected"
                 :class="{ 'app-essay-menu-active': selectedShape === Mark.SHAPE_TEXT_WAVE }"
                 @click="applyShape(Mark.SHAPE_TEXT_WAVE)"></v-btn>
          <v-btn size="small" class="app-essay-menu-symbol" :title="$t('symbolCheck')"
                 :disabled="!canEditSelected"
                 :class="{ 'app-essay-menu-active': selectedSymbol === Mark.SYMBOL_CHECK }"
                 @click="applySymbol(Mark.SYMBOL_CHECK)">{{ Mark.SYMBOL_CHECK }}</v-btn>
          <v-btn size="small" class="app-essay-menu-symbol" :title="$t('symbolCross')"
                 :disabled="!canEditSelected"
                 :class="{ 'app-essay-menu-active': selectedSymbol === Mark.SYMBOL_CROSS }"
                 @click="applySymbol(Mark.SYMBOL_CROSS)">{{ Mark.SYMBOL_CROSS }}</v-btn>
          <v-btn size="small" class="app-essay-menu-symbol" :title="$t('symbolQuestion')"
                 :disabled="!canEditSelected"
                 :class="{ 'app-essay-menu-active': selectedSymbol === Mark.SYMBOL_QUESTION }"
                 @click="applySymbol(Mark.SYMBOL_QUESTION)">{{ Mark.SYMBOL_QUESTION }}</v-btn>
          <v-btn size="small" class="app-essay-menu-symbol" :title="$t('symbolMissing')"
                 :disabled="!canEditSelected"
                 :class="{ 'app-essay-menu-active': selectedSymbol === Mark.SYMBOL_MISSING }"
                 @click="applySymbol(Mark.SYMBOL_MISSING)">{{ Mark.SYMBOL_MISSING }}</v-btn>
        </v-btn-group>
      </v-sheet>
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

.app-essay-menu {
  width: max-content;
  background: #fff;
}

.app-essay-menu-symbol {
  min-width: 40px;
  font-size: 18px;
}

.app-essay-menu .v-btn.app-essay-menu-active {
  background-color: rgba(25, 118, 210, 0.16);
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

<script setup>
/**
 * Display of a PDF essay
 * Correction Marks can be set for test and free hand
 */
import {stores} from "@/store";
import createPDFJsApi from 'annotate-pdf/pdfjs-api';
import {nextTick, onMounted, ref, watch} from 'vue';
import Comment from "@/data/Comment";
import Mark from "@/data/Mark";
import axios from 'axios';
import i18n from "@/plugins/i18n";

const essayStore = stores.essay();
const correctionsStore = stores.corrections();
const commentsStore = stores.comments();
const layoutStore = stores.layout();
const summariesStore = stores.summaries();
const preferencesStore = stores.preferences();

const { t } = i18n.global;

const EssayNode = ref();

const defaultShape = ref('');
const showLabels = ref(false);
const selectWords = ref(true);

// timestamp of the last mark creation
// needed to distinct a 'select' event by mark creation from the click on an empty place
let markCreated = 0;

let pdfjs;

onMounted(() => {
  showLabels.value = preferencesStore.display_labels;
  selectWords.value = preferencesStore.select_words;

  pdfjs = createPDFJsApi(EssayNode.value, './annotate-pdf/pdfjs-dist/web/viewer.html', essayStore.url);
  pdfjs.setDefaultColor(stores.config().getDefaultCommentColor(true));
  pdfjs.enableWordSelection(!!selectWords.value);
  pdfjs.enableTokenButtons(true);
  pdfjs.enableTypeButtons(true);

  loadMarks();
  if (summariesStore.isOwnDisabled) {
    selectShape('');
  } else {
    selectShape(preferencesStore.default_shape);
  }
  pdfjs.on('create', createMark);
  pdfjs.on('update', updateMark);
  pdfjs.on('delete', deleteMark);
  pdfjs.on('select', selectMark);
  pdfjs.on('pageChanged', pageChanged);
  // pdfjs.on('focus-end', focusEnd);

  suppressPdfViewerLetterShortcuts(EssayNode.value);
  handleFocusChange();
});

watch(() => layoutStore.focusChange, handleFocusChange);
watch(() => commentsStore.showOtherCorrections, loadMarks);
watch(() => commentsStore.selectionChange, refreshMarks);
watch(() => commentsStore.deletionChange, handleDeleted);

/**
 * Select the drawing shape
 * An empty shape means selection for copy
 */
function selectShape(shape) {

  defaultShape.value = shape;
  if (shape?.length && preferencesStore.default_shape !== defaultShape.value) {
    preferencesStore.default_shape = defaultShape.value;
    preferencesStore.update();
  }

   if (Mark.TEXT_SHAPES.includes(shape)) {
    pdfjs.enableFreeFormHighlight(false);
    pdfjs.enableTextHighlight(true);
    pdfjs.setDrawMode(Mark.shapeToPdfAnnotationType(shape));

    const comment = commentsStore.selectedComment;
    if (comment && comment.correction_key == correctionsStore.ownKey && !summariesStore.isOwnDisabled) {
      let changed = false;
      for (const mark of comment.marks) {
        if (mark.shape !== shape && Mark.TEXT_SHAPES.includes(mark.shape)) {
          mark.shape = shape;
          changed = true;
          pdfjs.setType(mark.key, Mark.shapeToPdfAnnotationType(shape));
        }
      }
      if (changed) {
        commentsStore.updateComment(comment);
      }
    }

  } else if (Mark.FREE_SHAPES.includes(shape)) {
    pdfjs.enableFreeFormHighlight(true);
    pdfjs.enableTextHighlight(false);
    pdfjs.setDefaultFreeFormType(Mark.shapeToPdfFreeFormType(defaultShape.value));

  } else {
    pdfjs.enableFreeFormHighlight(false);
    pdfjs.enableTextHighlight(false);
  }
}

async function handleFocusChange() {
  if (layoutStore.isEssaySelected) {
    await nextTick();
    EssayNode.value.focus();
  }
}

async function loadMarks() {
  const all = [];
  for (const comment of commentsStore.activeComments) {
    for (const annotation of comment.getPdfAnnotations()) {
      if (comment.correction_key != stores.corrections().ownKey || summariesStore.isOwnDisabled) {
        annotation.noDelete = true;
      }
      if (!showLabels.value) {
        annotation.label = '';
      }
      all.push(annotation);
    }
  }
  await pdfjs.setAll(all);
  // setAll may leave focus in the iframe without firing focus-end (noFocus add path)
  reclaimCommentFocus();
}

/**
 * pdfjs binds unmodified letters on the viewer window (r rotates, j/k turn pages, …).
 * Stop those in the capture phase so they never reach that handler.
 * Ctrl, Alt and Meta stay intact, as do letters typed into viewer text fields.
 */
function suppressPdfViewerLetterShortcuts(container) {
  const frame = container?.querySelector('iframe');
  if (!frame) {
    return;
  }
  frame.addEventListener('load', () => {
    frame.contentWindow?.addEventListener('keydown', blockPlainLetterShortcut, true);
  });
}

function blockPlainLetterShortcut(event) {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) {
    return;
  }
  if (!/^[a-z]$/i.test(event.key)) {
    return;
  }
  const el = event.target instanceof Element ? event.target : event.target?.parentElement;
  if (el?.closest('input, textarea, select')
      || el?.isContentEditable
      || el.classList.contains('toolbarHorizontalGroup')
  ) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
}

/**
 * True when keyboard focus is in the PDF pane (iframe or wrapper).
 * Used to reclaim focus for the comment textarea after annotate-pdf steals it.
 */
function isFocusInPdf() {
  const active = document.activeElement;
  return !!EssayNode.value && (active === EssayNode.value || EssayNode.value.contains(active));
}

/**
 * Reclaim focus for the sidebar textarea when the PDF pane still holds it.
 * Delayed steals (editor.moveInDOM / toolbar) are handled via the focus-end event.
 */
function reclaimCommentFocus() {
  if (commentsStore.selectedKey && isFocusInPdf()) {
    commentsStore.setFocusRequest();
  }
}

function toggleLabels() {
  showLabels.value = !showLabels.value;
  if (preferencesStore.display_labels !== showLabels.value) {
    preferencesStore.display_labels = showLabels.value;
    preferencesStore.update();
  }
  refreshMarks();
}

function toggleWords() {
  selectWords.value = !selectWords.value;
  if (preferencesStore.select_words !== selectWords.value) {
    preferencesStore.select_words = selectWords.value;
    preferencesStore.update();
  }
  pdfjs.enableWordSelection(selectWords.value);
}

async function createMark(event) {
  markCreated = Date.now();

  const annotation = event.detail;
  const data = {
    key: annotation.id,
    shape: Mark.shapeFromPdfAnnotationType(annotation.type),
    symbol: Mark.symbolFromPdfAnnotationToken(annotation.token),
    internal: JSON.stringify(annotation.intern),
    parent_number: annotation.page + 1,
    pos: {x: annotation.pos.x * 1000, y: annotation.pos.y * 1000}
  }

  if (!commentsStore.getCommentByMarkKey(data.key)) {
    // new mark will create a new comment
    const newComment = new Comment({parent_number: event.detail.page + 1});
    newComment.addMarkData(data);
    await commentsStore.addComment(newComment);
  }
}

function updateMark(event) {
  const annotation = event.detail;
  const data = {
    key: annotation.id,
    shape: Mark.shapeFromPdfAnnotationType(annotation.type),
    symbol: Mark.symbolFromPdfAnnotationToken(annotation.token),
    internal: JSON.stringify(annotation.intern),
    parent_number: annotation.page + 1,
    pos: {x: annotation.pos.x * 1000, y: annotation.pos.y * 1000}
  }

  const comment = commentsStore.getCommentByMarkKey(data.key);
  if (comment) {
    const oldData = comment.getData();
    comment.updateMarkData(data);
    pdfjs.setLabel(annotation.id, comment.label);
    pdfjs.setAltText(annotation.id, comment.getAltText());

    const newData = comment.getData();
    if (JSON.stringify(oldData) != JSON.stringify(newData)) {
      commentsStore.updateComment(comment, false);
    }
    if (comment.key === commentsStore.selectedKey && Date.now() - markCreated > 200) {
      reclaimCommentFocus();
    }
  }
}

async function deleteMark(event) {
  const comment = commentsStore.getCommentByMarkKey(event.detail.id);
  if (comment) {
    await commentsStore.deleteComment(comment.key);
  }
  refreshMarks();
}

function selectMark(event) {
  if (event.detail) {
    const comment = commentsStore.getCommentByMarkKey(event.detail.id);
    if (comment) {
      commentsStore.selectComment(comment.key);
      return;
    }
  } else if (Date.now() - markCreated > 200) {
    commentsStore.selectComment('');
  }
}

function pageChanged(event) {
  let comments = commentsStore.getActiveCommentsByParentNumber(event.detail);
  if (comments.length) {
    let comment = comments.shift();
    commentsStore.setFirstVisibleComment(comment.key);
  }
}

/**
 * annotate-pdf fires focus-end for the creation of a new comment
 * after PDF.js finishes restoring focus in moveEditorInDOM
 * That is the reliable point to take focus back for the comment textarea
 * @deprecated
 */
function focusEnd(event) {
  if (!event?.detail?.id || !commentsStore.selectedKey) {
    return;
  }
  const comment = commentsStore.getCommentByMarkKey(event.detail.id);
  if (comment && comment.key === commentsStore.selectedKey) {
    reclaimCommentFocus();
  }
}

async function refreshMarks() {
  const configStore = stores.config();
  const selectedKey = commentsStore.selectedKey;
  const selectIds = [];
  for (const comment of commentsStore.activeComments) {
    for (const mark of comment.marks) {
      pdfjs.setColor(mark.key, configStore.getCommentColor(
          comment.correction_position, comment.key == selectedKey, mark.isFilled()),
      );
      pdfjs.setLabel(mark.key,
          (showLabels.value || comment.key == selectedKey) ? comment.label:  ''
      );
      if (comment.key == selectedKey) {
        selectIds.push(mark.key);
      }
    }
  }
  if (selectIds.length && selectedKey) {
    for (const id of selectIds) {
      await pdfjs.select(id);
    }
    reclaimCommentFocus();
  }
}

function handleDeleted()
{
  const comment = commentsStore.lastDeleted;
  if (comment) {
    for (const mark of comment.marks) {
      pdfjs.delete(mark.key);
    }
  }
}

async function download(marked)
{
  let blob;
  let title;

  if (marked) {
    blob = await essayStore.buildMarkedPdf('all');
    if (stores.items().isFinal) {
      title = stores.api().getDownloadTitle(t('essayPdfMarkedWritingFile'));
    } else {
      title = stores.api().getDownloadTitle(t('essayPdfMarkedWritingDraft'));
    }

  } else {
    const response = await fetch(essayStore.url);
    blob = await response.blob();
    title = stores.api().getDownloadTitle(t('essayPdfPureWritingFile'));
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title

  document.body.appendChild(a); // required in Firefox
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url); // free memory
}

</script>

<template>
  <div class ="appEssayWrapper">
    <div class="appTextButtons">

      <div class="appTextButtonsGroup">
        <label class="appTextButtonsLabel" for="appTextShapesToggle">{{ $t('essayPdfTextCopy') }}</label>
        <v-btn-toggle id="appTextSelection" density="comfortable" variant="outlined" divided v-model="defaultShape">
          <v-tooltip max-width="200" location="bottom" :text ="$t('essayPdfSelectForCopyInfo')">
            <template v-slot:activator="{props}">
              <v-btn :disabled="summariesStore.isOwnDisabled" v-bind="props" size="small" icon="mdi-content-copy" value="" @click="selectShape('')"></v-btn>
            </template>
          </v-tooltip>
        </v-btn-toggle>
      </div>

      <div class="appTextButtonsGroup" v-if="stores.settings().Task.enable_comments">
        <label class="appTextButtonsLabel" for="appTextShapesToggle">{{ $t('essayPdfTextShapes') }}</label>
        <v-btn-toggle id="appTextShapesToggle" density="comfortable" variant="outlined" divided v-model="defaultShape">
          <v-tooltip max-width="200" location="bottom" :text ="$t('essayPdfShapeTextMarkerInfo')">
            <template v-slot:activator="{props}">
              <v-btn :disabled="summariesStore.isOwnDisabled" v-bind="props" size="small" icon="mdi-marker" :value="Mark.SHAPE_TEXT_MARKER" @click="selectShape(Mark.SHAPE_TEXT_MARKER)"></v-btn>
            </template>
          </v-tooltip>
          <v-tooltip max-width="200" location="bottom" :text ="$t('essayPdfShapeTextUnderlineInfo')">
            <template v-slot:activator="{props}">
              <v-btn :disabled="summariesStore.isOwnDisabled" v-bind="props" size="small" icon="mdi-format-underline" :value="Mark.SHAPE_TEXT_UNDERLINE" @click="selectShape(Mark.SHAPE_TEXT_UNDERLINE)"></v-btn>
            </template>
          </v-tooltip>
          <v-tooltip max-width="200" location="bottom" :text ="$t('essayPdfShapeTextWaveInfo')">
            <template v-slot:activator="{props}">
              <v-btn :disabled="summariesStore.isOwnDisabled" v-bind="props" size="small" icon="mdi-format-underline-wavy" :value="Mark.SHAPE_TEXT_WAVE" @click="selectShape(Mark.SHAPE_TEXT_WAVE)"></v-btn>
            </template>
          </v-tooltip>
          <v-tooltip max-width="200" location="bottom" :text ="$t('essayPdfShapeTextVlineInfo')">
            <template v-slot:activator="{props}">
              <v-btn :disabled="summariesStore.isOwnDisabled" v-bind="props" size="small" icon="mdi-align-horizontal-left" :value="Mark.SHAPE_TEXT_VLINE" @click="selectShape(Mark.SHAPE_TEXT_VLINE)"></v-btn>
            </template>
          </v-tooltip>
        </v-btn-toggle>
      </div>

<!--      <div class="appTextButtonsGroup" v-if="stores.settings().Task.enable_comments" >-->
<!--        <label class="appTextButtonsLabel" for="appFreeShapesToggle">{{ $t('essayPdfFreeShapes') }}</label>-->
<!--        <v-btn-toggle id="appFreeShapesToggle" density="comfortable" variant="outlined" divided v-model="defaultShape">-->
<!--          <v-tooltip max-width="200" location="bottom" :text ="$t('essayPdfShapeFreeLineInfo')">-->
<!--            <template v-slot:activator="{props}">-->
<!--              <v-btn :disabled="summariesStore.isOwnDisabled" v-bind="props" size="small" icon="mdi-minus" :value="Mark.SHAPE_FREE_LINE" @click="selectShape(Mark.SHAPE_FREE_LINE)"></v-btn>-->
<!--            </template>-->
<!--          </v-tooltip>-->
<!--          <v-tooltip  max-width="200" location="bottom" :text ="$t('essayPdfShapeFreeWaveInfo')">-->
<!--            <template v-slot:activator="{props}">-->
<!--              <v-btn :disabled="summariesStore.isOwnDisabled" v-bind="props" size="small" icon="mdi-wave" :value="Mark.SHAPE_FREE_WAVE" @click="selectShape(Mark.SHAPE_FREE_WAVE)"></v-btn>-->
<!--            </template>-->
<!--          </v-tooltip>-->
<!--          <v-tooltip  max-width="200" location="bottom" :text ="$t('essayPdfShapeFreeRectInfo')">-->
<!--            <template v-slot:activator="{props}">-->
<!--              <v-btn :disabled="summariesStore.isOwnDisabled" v-bind="props" size="small" icon="mdi-rectangle-outline" :value="Mark.SHAPE_FREE_RECT" @click="selectShape(Mark.SHAPE_FREE_RECT)"></v-btn>-->
<!--            </template>-->
<!--          </v-tooltip>-->
<!--          <v-tooltip  max-width="200" location="bottom" :text ="$t('essayPdfShapeFreeDotInfo')">-->
<!--            <template v-slot:activator="{props}">-->
<!--              <v-btn :disabled="summariesStore.isOwnDisabled" v-bind="props" size="small" icon="mdi-circle-small" :value="Mark.SHAPE_FREE_DOT" @click="selectShape(Mark.SHAPE_FREE_DOT)"></v-btn>-->
<!--            </template>-->
<!--          </v-tooltip>-->
<!--          <v-tooltip  max-width="200" location="bottom" :text ="$t('essayPdfShapeFreeCircleInfo')">-->
<!--            <template v-slot:activator="{props}">-->
<!--              <v-btn :disabled="summariesStore.isOwnDisabled" v-bind="props" size="small" icon="mdi-circle-outline" :value="Mark.SHAPE_FREE_CIRCLE" @click="selectShape(Mark.SHAPE_FREE_CIRCLE)"></v-btn>-->
<!--            </template>-->
<!--          </v-tooltip>-->
<!--        </v-btn-toggle>-->
<!--      </div>-->

      <div class="appTextButtonsGroup" v-if="stores.settings().Task.enable_comments">
        <label class="appTextButtonsLabel" for="appFreeShapesToggle">{{ $t('essayPdfOptions') }}</label>
        <v-btn-group density="comfortable" variant="outlined" divided>
          <v-tooltip  max-width="200" location="bottom" :text ="$t('essayPdfToggleLabelsInfo')">
            <template v-slot:activator="{props}">
              <v-btn size="small" v-bind="props" :active="!!showLabels" icon="mdi-label-outline" @click="toggleLabels"></v-btn>
            </template>
          </v-tooltip>
          <v-tooltip  max-width="200" location="bottom" :text ="$t('essayPdfSelectWordsInfo')">
            <template v-slot:activator="{props}">
              <v-btn size="small" v-bind="props" :active="!!selectWords" @click="toggleWords">{{ $t('essayPdfSelectWords') }}</v-btn>
            </template>
          </v-tooltip>


        </v-btn-group>
      </div>

      <div class="appTextButtonsGroup" v-if="stores.settings().Assessment.download_writing || stores.settings().Assessment.download_correction">
        <label class="appTextButtonsLabel" for="appDownloads">{{ $t('essayPdfDownload') }}</label>
        <v-btn-group density="comfortable" variant="outlined" divided>
          <v-tooltip  max-width="200" v-if="stores.settings().Assessment.download_writing" location="bottom" :text ="$t('essayPdfPureWritingInfo')">
            <template v-slot:activator="{props}">
              <v-btn size="small" v-bind="props" @click="download(false)">{{ $t('essayPdfPureWriting') }}</v-btn>
            </template>
          </v-tooltip>
          <!-- <v-btn size="small" v-if="stores.settings().Assessment.download_correction" @click="download(true)">{{ $t('essayPdfMarkedWriting') }}</v-btn> -->
        </v-btn-group>
      </div>

    </div>
    <div class="appEssayNode" tabindex="0" ref="EssayNode"></div>
  </div>
</template>

<style scoped>

.appEssayWrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  margin-top: -10px;
}

.appTextButtons {
  padding-bottom: 5px;
  height: 70px;
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.appTextButtonsGroup {
  padding: 0 10px 0 10px;
  margin: 0;
}

.appTextButtonsLabel {
  display:block;
  font-size: 12px;
  color: #555555;
}


.appEssayNode {
  flex-grow: 1;
  width: 100%;
  height: calc(100% - 50px);
}

</style>
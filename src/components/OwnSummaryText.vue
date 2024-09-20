<script setup>
/*
* Import TinyMCE
*/
import 'tinymce';
// Default icons are required for TinyMCE 5.3 or above
import 'tinymce/icons/default';
// A theme is also required
import 'tinymce/themes/silver';
// Import the skin
import 'tinymce/skins/ui/oxide/skin.css';

/* Import content css */
import contentUiCss from 'tinymce/skins/ui/oxide/content.css';
import contentLocalCss from '@/styles/content.css';
import headlinesThreeCss from '@/styles/headlines-three.css';

/* Import plugins */
import 'tinymce/plugins/lists';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/paste';
/* Import tiny vue integration */
import Editor from '@tinymce/tinymce-vue'

import { useSummariesStore } from '@/store/summaries';
import { usePreferencesStore } from '@/store/preferences';
import { onMounted } from 'vue';

const summariesStore = useSummariesStore();
const preferencesStore = usePreferencesStore();


// editorId used for retrieving the editor instance using the tinymce.get('ID') method.
const props = defineProps(['editorId']);

function toolbar() {
  switch ('full') // corrector always has full formatting options
  {
    case 'full':
      return 'zoomOut zoomIn | undo redo | styleselect | bold italic underline | bullist numlist | removeformat | charmap | paste';
    case 'medium':
      return 'zoomOut zoomIn | undo redo | bold italic underline | bullist numlist | removeformat | charmap | paste';
    case 'minimal':
      return 'zoomOut zoomIn | undo redo | bold italic underline | removeformat | charmap | paste';
    case 'none':
    default:
      return 'zoomOut zoomIn | undo redo | charmap |paste';
  }
}

/**
 * @see https://www.tiny.cloud/docs/configure/content-filtering/#valid_elements
 */
function validElements() {
  switch ('full') // corrector always has full formatting options
  {
    case 'full':
      return 'p/div,br,strong/b,em/i,u,ol,ul,li,h1,h2,h3,h4,h5,h6,pre';
    case 'medium':
      return 'p/div,br,strong/b,em/i,u,ol,ul,li';
    case 'minimal':
      return 'p/div,p/li,br,strong/b,em/i,u';
    case 'none':
    default:
      return 'p/div,p/li,br';
  }
}

/**
 * @see https://www.tiny.cloud/docs/configure/content-formatting/#formats
 */
function formats() {
  return {
    underline: { inline: 'u', remove: 'all' }
  }
}

function styleFormats() {
  return [
    { title: 'Absatz', format: 'p' },
    { title: 'Überschrift 1', format: 'h1' },
    { title: 'Überschrift 2', format: 'h2' },
    { title: 'Überschrift 3', format: 'h3' },
    { title: 'Maschinenschrift', format: 'pre' },
    { title: 'Listenelement', block: 'li' },
  ];
}

onMounted(() => {
  applyZoom();
});

function zoomIn() {
  preferencesStore.zoomSummaryTextIn();
  applyZoom();
}

function zoomOut() {
  preferencesStore.zoomSummaryTextOut();
  applyZoom();
}

function applyZoom() {
  const editor = tinymce.get(props.editorId);
  if (editor) {
    editor.contentWindow.document.body.style.fontSize = (preferencesStore.summary_text_zoom * 16) + 'px';
  }
}

</script>

<template>
  <div class="app-own-summary-text-wrapper">
    <editor
        v-if="!summariesStore.isOwnDisabled"
        :id="props.editorId"
        v-model="summariesStore.editSummary.text"
        @change="summariesStore.updateContent(true)"
        @keyup="summariesStore.updateContent(true)"
        api-key="no-api-key"
        :init="{
            height: '100%',
            menubar: false,
            plugins: 'lists charmap paste',
            toolbar: toolbar(),
            valid_elements: validElements(),
            formats: formats(),
            style_formats: styleFormats(),
            custom_undo_redo_levels: 10,
            skin: false,                      // avoid 404 errors for skin css files
            content_css: false,               // avoid 404 error for content css file
            content_style: contentUiCss.toString() + '\n' + contentLocalCss.toString() + '\n' + headlinesThreeCss.toString(),
            browser_spellcheck: true,
            paste_block_drop: true,
            paste_convert_word_fake_lists: false,
            font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
            setup: function (editor) {
              editor.ui.registry.addButton('zoomOut', {tooltip: 'Verkleinern', icon: 'zoom-out', onAction: zoomOut});
              editor.ui.registry.addButton('zoomIn', {tooltip: 'Vergrößern', icon: 'zoom-in', onAction: zoomIn});
              }
            }"
    />

    <div class="app-summary-text-display long-essay-content corrector-summary"
         v-if="summariesStore.isOwnDisabled"
         v-html="summariesStore.editSummary.text">
    </div>
  </div>
</template>

<style>
/**
 * Styles for tiny must be global
 */

/* hide the statusbar */
.tox-statusbar {
  display: none !important;
}

.app-own-summary-text-wrapper {
  height: 100%;
}

.app-summary-text-display {
  height: 100%;
  border: 1px solid #cccccc;
  padding: 10px;
  overflow-y: scroll;
}


</style>

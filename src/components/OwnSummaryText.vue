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

/* Import plugins */
import 'tinymce/plugins/lists';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/paste';
/* Import tiny vue integration */
import Editor from '@tinymce/tinymce-vue'

import {useSummariesStore} from '@/store/summaries';
import { usePreferencesStore } from '@/store/preferences';
const summariesStore = useSummariesStore();
const preferencesStore = usePreferencesStore();


// editorId used for retrieving the editor instance using the tinymce.get('ID') method.
const props = defineProps(['editorId']);

function toolbar() {
  switch ('full') // corrector always has full formatting options
  {
    case 'full':
      return 'zoomOut zoomIn | undo redo | formatselect | bold italic underline | bullist numlist | removeformat | charmap | paste';
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
    underline: {inline: 'u', remove: 'all'}
  }
}

function zoomIn() {
  preferencesStore.zoomSummaryTextIn();
  const editor = tinymce.get(props.editorId);
  editor.contentWindow.document.body.style.fontSize= (preferencesStore.summary_text_zoom * 16) + 'px';
}

function zoomOut() {
  preferencesStore.zoomSummaryTextOut();
  const editor = tinymce.get(props.editorId);
  editor.contentWindow.document.body.style.fontSize= (preferencesStore.summary_text_zoom * 16) + 'px';
}

</script>

<template>
  <div class="headline">Abschlussvotum</div>
  <div class="app-own-summary-text-wrapper" v-if="!summariesStore.isOwnDisabled">
      <editor
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
            custom_undo_redo_levels: 10,
            skin: false,                      // avoid 404 errors for skin css files
            content_css: false,               // avoid 404 error for content css file
            content_style: contentUiCss.toString() + '\n' + contentLocalCss.toString(),
            paste_block_drop: true,
            font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
            setup: function (editor) {
              editor.ui.registry.addButton('zoomOut', {
                tooltip: 'Verkleinern',
                icon: 'zoom-out',
                onAction: zoomOut
              });
              editor.ui.registry.addButton('zoomIn', {
                tooltip: 'Vergrößern',
                icon: 'zoom-in',
                onAction: zoomIn
              });
              }
            }"
      />
  </div>

  <div class="app-summary-text-wrapper" v-if="summariesStore.isOwnDisabled">
    <div class="app-summary-text-display" v-html="summariesStore.editSummary.text">
    </div>
  </div>
</template>

<style>

.headline {
  font-weight: bold;
  height: 40px;
  padding-top: 10px;
}

.app-own-summary-text-wrapper {
  height: calc(100% - 40px);
}

.app-summary-text-wrapper {
  height: calc(100% - 40px);
  border: 1px solid #cccccc;
  padding: 10px;
  overflow-y: scroll;
}

.app-summary-text-display {
  height:100%;
  font-family: Serif;
  font-size: 16px;

}



</style>

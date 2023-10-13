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
const summariesStore = useSummariesStore();

function toolbar() {
  switch ('full') // corrector always has full formatting options
  {
    case 'full':
      return 'undo redo | formatselect | bold italic underline | bullist numlist | removeformat | charmap | paste';
    case 'medium':
      return 'undo redo | bold italic underline | bullist numlist | removeformat | charmap | paste';
    case 'minimal':
      return 'undo redo | bold italic underline | removeformat | charmap | paste';
    case 'none':
    default:
      return 'undo redo | charmap |paste';
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

// Used for retrieving the editor instance using the tinymce.get('ID') method.
const id = "summary";
</script>

<template>
  <div class="app-own-summary-text-wrapper" v-if="!summariesStore.isOwnAuthorized">
      <editor
          :id="id"
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
            paste_block_drop: true
       }"
      />
  </div>

  <div class="app-summary-text-wrapper" v-if="summariesStore.isOwnAuthorized">
    <div class="app-summary-text-display" v-html="summariesStore.editSummary.text">
    </div>
  </div>
</template>

<style scoped>

.app-own-summary-text-wrapper {
  height: 100%;
}

.app-summary-text-wrapper {
  height:100%;
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

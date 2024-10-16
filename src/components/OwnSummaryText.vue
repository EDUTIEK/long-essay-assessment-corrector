<script setup>
/*
* Import TinyMCE
* @see https://www.tiny.cloud/docs/tinymce/latest/vite-es6-npm/
*/
import tinymce from 'tinymce';

/* Default icons are required. After that, import custom icons if applicable */
import 'tinymce/icons/default/icons.min.js';

/* Required TinyMCE components */
import 'tinymce/themes/silver/theme.min.js';
import 'tinymce/models/dom/model.min.js';

/* Import a skin (can be a custom skin instead of the default) */
import 'tinymce/skins/ui/oxide/skin.js';

/* Import plugins */
import '@/plugins/tiny_de.js';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/wordcount';

/* content UI CSS is required */
import 'tinymce/skins/ui/oxide/content.js';

/* The default content CSS can be changed or replaced with appropriate CSS for the editor content. */
import 'tinymce/skins/content/default/content.js';

// Import tiny vue integration
import Editor from '@tinymce/tinymce-vue'

import contentLocalCss from '@/styles/content.css?inline';
import headlinesThreeCss from '@/styles/headlines-three.css?inline';

import { useSummariesStore } from '@/store/summaries';
import { usePreferencesStore } from '@/store/preferences';
import { useLayoutStore } from '@/store/layout';
import { onMounted } from 'vue';

const summariesStore = useSummariesStore();
const preferencesStore = usePreferencesStore();
const layoutStore = useLayoutStore();

// editorId used for retrieving the editor instance using the tinymce.get('ID') method.
const props = defineProps(['editorId']);

function toolbar() {
  // corrector always has full formatting options
  return 'zoomOut zoomIn undo redo styles bold italic underline bullist numlist removeformat charmap';
}

/**
 * @see https://www.tiny.cloud/docs/configure/content-filtering/#valid_elements
 */
function validElements() {
  // corrector always has full formatting options
  return 'p/div,br,strong/b,em/i,u,ol,ul,li,h1,h2,h3,h4,h5,h6,pre';
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

function handleInit() {
  applyZoom();
  applyFormat();
}

function handleChange() {
  summariesStore.updateContent(true);
  applyZoom();
}

function handleKeyUp() {
  summariesStore.updateContent(true);
}


function zoomIn() {
  preferencesStore.zoomSummaryTextIn();
  applyZoom();
}

function zoomOut() {
  preferencesStore.zoomSummaryTextOut();
  applyZoom();
}

function applyZoom() {
  try {
    const editor = tinymce.get(props.editorId);
    if (editor) {
      editor.dom.setStyle(editor.dom.doc.body, 'font-size', (preferencesStore.summary_text_zoom) + 'rem');
      editor.dom.setStyle(editor.dom.select('h1'),
          'font-size',
          (preferencesStore.summary_text_zoom * 1.3) + 'rem');
      editor.dom.setStyle(editor.dom.select('h2'),
          'font-size',
          (preferencesStore.summary_text_zoom * 1.15) + 'rem');
      editor.dom.setStyle(editor.dom.select('h3'), 'font-size', (preferencesStore.summary_text_zoom) + 'rem');
      editor.dom.setStyle(editor.dom.select('h4'), 'font-size', (preferencesStore.summary_text_zoom) + 'rem');
      editor.dom.setStyle(editor.dom.select('h5'), 'font-size', (preferencesStore.summary_text_zoom) + 'rem');
      editor.dom.setStyle(editor.dom.select('h6'), 'font-size', (preferencesStore.summary_text_zoom) + 'rem');
    }
  }
  catch (e) {
    // prevent error when tiny is unloaded
  }
}

/**
 * Add classes for the headline styles to the overlay element of the tiny menu
 */
function applyFormat() {
  for (const element of document.getElementsByClassName('tox-tinymce-aux')) {
    element.classList.add('headlines-three');
  }
}

</script>

<template>
  <div class="app-own-summary-text-wrapper">
    <label :for="props.editorId" class="hidden">Verborgenes Feld zum Gutachten</label>
    <editor
        :id="props.editorId"
        v-if="!summariesStore.isOwnDisabled"
        v-model="summariesStore.editSummary.text"
        @change="handleChange"
        @keydown="layoutStore.handleKeyDown"
        @keyup="handleKeyUp"
        @init="handleInit"
        api-key="no-api-key"
        :init="{
            license_key: 'gpl',
            language: 'de',
            height: '100%',
            menubar: false,
            statusbar: true,
            elementpath: false,
            branding: false,
            plugins: 'lists charmap wordcount',
            toolbar: toolbar(),
            valid_elements: validElements(),
            formats: formats(),
            style_formats: styleFormats(),
            custom_undo_redo_levels: 10,
            skin: 'default',
            content_css: 'default',
            content_style: contentLocalCss.toString() + '\n' + headlinesThreeCss.toString(),
            browser_spellcheck: true,
            highlight_on_focus: true,
            iframe_aria_text: 'Editor Gutachten',
            paste_as_text: false,         // keep formats when copying between clipboards
            paste_block_drop: true,       // prevent unfiltered content from drag & drop
            paste_merge_formats: true,    // default
            paste_tab_spaces: 4,          // default
            smart_paste: false,           // don't create hyperlinks automatically
            paste_data_images: false,     // don't paste images
            paste_remove_styles_if_webkit: true,  // default
            paste_webkit_styles: 'none',          // default
            //font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
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

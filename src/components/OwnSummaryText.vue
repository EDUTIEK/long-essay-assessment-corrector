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
import TinyHelper from '@/lib/TinyHelper';

import contentLocalCss from '@/styles/content.css?inline';
import headlinesThreeCss from '@/styles/headlines-three.css?inline';

import { useSummariesStore } from '@/store/summaries';
import { usePreferencesStore } from '@/store/preferences';
import { useLayoutStore } from '@/store/layout';
import { nextTick, watch } from 'vue';

const summariesStore = useSummariesStore();
const preferencesStore = usePreferencesStore();
const layoutStore = useLayoutStore();

// editorId used for retrieving the editor instance using the tinymce.get('ID') method.
const props = defineProps(['editorId']);
const helper = new TinyHelper(props.editorId);

watch(() => layoutStore.focusChange, handleFocusChange);

function handleInit() {
  helper.init();
}

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'ownSummary') {
    helper.applyFocus();
    await nextTick();
    helper.restoreScrolling();
  }
}

function handleChange() {
  summariesStore.updateContent(true);
  helper.applyZoom();
}

function handleKeyUp() {
  summariesStore.updateContent(true);
}
</script>

<template>
  <div class="app-own-summary-text-wrapper">
    <label :for="props.editorId" class="hidden">Verborgenes Feld zum Gutachten</label>
    <editor
        :id="props.editorId"
        v-if="!summariesStore.isOwnDisabled"
        v-model="summariesStore.editSummary.text"
        @init="handleInit"
        @change="handleChange"
        @keyup="handleKeyUp"
        @keydown="layoutStore.handleKeyDown"
        @scroll="helper.saveScrolling"
        licenseKey = 'gpl'
        :init="helper.getInit()"
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

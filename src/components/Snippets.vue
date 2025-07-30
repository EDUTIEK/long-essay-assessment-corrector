<script setup>

import {useSnippetsStore} from "@/store/snippets";
import { ref, watch, nextTick } from 'vue'
import Snippet from "@/data/Snippet";
import i18n from "@/plugins/i18n";

const { t } = i18n.global;
const snippetsStore = useSnippetsStore();
const appSelect = ref();  // v-autocomplete
const appEdit = ref();    // v-textarea

let snippets = [];

function loadList() {
  snippets = [];
  switch (snippetsStore.open_for_purpose) {
    case Snippet.FOR_COMMENT:
      for (const snippet of snippetsStore.forComment) {
        snippets.push(snippet);
      }
      break;
    case Snippet.FOR_SUMMARY:
      for (const snippet of snippetsStore.forSummary) {
        snippets.push(snippet);
      }
      break;
  }
  snippets.push(new Snippet({key: 'new', text: t('snippetsNewSnippet'), purpose: snippetsStore.open_for_purpose}));
}

function clearEditor() {
  snippetsStore.edit = new Snippet({text: '', purpose: snippetsStore.open_for_purpose});
}

async function handleOpen() {
  if (snippetsStore.selection_open) {
    loadList();
    clearEditor();
    await nextTick();
    appSelect.value.focus();
    await nextTick();
    appSelect.value.search = snippetsStore.open_text;
  }
}
watch(() => snippetsStore.selection_open, handleOpen);


async function handleSelect() {
  const searched = appSelect.value.search ? appSelect.value.search : '';

  if (snippetsStore.select == 'new') {
    snippetsStore.edit = new Snippet({text: searched, purpose: snippetsStore.open_for_purpose});
    if (snippetsStore.edit.text) {
      await snippetsStore.createSnippet(snippetsStore.edit);
      loadList();
    }
  } else {
    const snippet = snippets.find(element => element.key === snippetsStore.select);
    if (snippet && snippet.key !== snippetsStore.edit.key) {
      snippetsStore.edit = snippet;
    }
  }

  snippetsStore.select = null;
  await nextTick();
  appEdit.value.focus();

}

async function handleEdit() {
  if (snippetsStore.has(snippetsStore.edit.key)) {
    snippetsStore.updateSnippet(snippetsStore.edit);
  } else if (snippetsStore.edit.text) {
    await snippetsStore.createSnippet(snippetsStore.edit);
    loadList();
  }
}

function handleClose() {
  snippetsStore.selection_open = false;
}

function handleApply() {
  snippetsStore.selection_open = false;
  snippetsStore.insert_text = snippetsStore.edit.text;
}

async function handleDelete() {
  snippetsStore.deleteSnippet(snippetsStore.edit.key);
  snippetsStore.select = null;
  loadList();
  clearEditor();
  await nextTick();
  appSelect.value.focus();
}

async function handleKeydown() {
  switch (event.key) {
    case "F1":
      event.preventDefault();
      handleApply();
      break;
  }
}

function customFilter (itemTitle, queryText, item) {
  const text = item.raw.text.toLowerCase()
  const searchText = queryText.toLowerCase()
  return item.raw.key === 'new' || text.indexOf(searchText) > -1
}

</script>

<template>
  <div id="app-snippets">
    <v-dialog max-width="60em" v-model="snippetsStore.selection_open">
      <v-card>
        <v-card-title>{{ $t('snippetsSnippet') }}</v-card-title>
        <v-card-text>
          {{ $t('snippetsSelect') }}
          <v-autocomplete
              ref="appSelect"
              id="appSnippetSelect"
              v-model = "snippetsStore.select"
              :custom-filter="customFilter"
              :items="snippets"
              @update:modelValue="handleSelect()"
              @keydown="handleKeydown()"
              base-color="white"
              item-title="text"
              item-value="key"
          ></v-autocomplete>
          {{ $t('snippetsEdit') }}
          <v-textarea
              ref="appEdit"
              v-model="snippetsStore.edit.text"
              @change="handleEdit()"
              @keyup="handleEdit()"
              @keydown ="handleKeydown()"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-btn
              :disabled = "snippetsStore.edit.text == ''"
              @click="handleApply()">
            <v-icon left icon="mdi-ok"></v-icon>
            <span>{{ $t('allApply') }}</span>
          </v-btn>
          <v-btn
              :disabled = "!snippetsStore.has(snippetsStore.edit.key)"
              @click="handleDelete()">
            <v-icon left icon="mdi-ok"></v-icon>
            <span>{{ $t('allDelete') }}</span>
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="handleClose()">
            <v-icon left icon="mdi-close"></v-icon>
            <span>{{ $t('allClose') }}</span>
          </v-btn>

        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>

</template>

<style scoped>

</style>
<script setup>

import {useSnippetsStore} from "@/store/snippets";
import { ref, watch, nextTick } from 'vue'
import Snippet from "@/data/Snippet";

const snippetsStore = useSnippetsStore();

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
  snippets.push(new Snippet({key: 'new', text: "--- neuer Baustein ---", purpose: snippetsStore.open_for_purpose}));
}

function clearEditor() {
  snippetsStore.edit = new Snippet({text: '', purpose: snippetsStore.open_for_purpose});
}

function updateEditor() {
  const snippet = snippets.find(element => element.key === snippetsStore.select);
  if (snippet) {
    if (snippet.key === 'new') {
      clearEditor();
    }
    else if (snippet.key !== snippetsStore.edit.key) {
      snippetsStore.edit = snippet;
    }
  }
}

async function handleOpen() {
  if (snippetsStore.selection_open) {
    loadList();
    clearEditor();
    await nextTick();
    document.getElementById('appSnippetSelect').focus();
  }
}
watch(() => snippetsStore.selection_open, handleOpen);


async function handleSelect() {
  updateEditor();
  if (snippetsStore.select == 'new') {
    await nextTick();
    document.getElementById('appSnippetEdit').focus();
  }
  snippetsStore.select = null;
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
  document.getElementById('appSnippetSelect').focus();
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
        <v-card-title>Textbaustein</v-card-title>
        <v-card-text>
          Auswählen:
          <v-autocomplete
              id="appSnippetSelect"
              v-model = "snippetsStore.select"
              :custom-filter="customFilter"
              :items="snippets"
              @update:modelValue="handleSelect()"
              base-color="white"
              item-title="text"
              item-value="key"
          ></v-autocomplete>
          Bearbeiten:
          <v-textarea
              id="appSnippetEdit"
              v-model="snippetsStore.edit.text"
              @change="handleEdit()"
              @keyup="handleEdit()"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="handleApply()">
            <v-icon left icon="mdi-ok"></v-icon>
            <span>Übernehmen</span>
          </v-btn>
          <v-btn @click="handleDelete()">
            <v-icon left icon="mdi-ok"></v-icon>
            <span>Löschen</span>
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="handleClose()">
            <v-icon left icon="mdi-close"></v-icon>
            <span>Schließen</span>
          </v-btn>

        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>

</template>

<style scoped>

</style>
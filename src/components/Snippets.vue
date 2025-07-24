<script setup>

import {useSnippetsStore} from "@/store/snippets";
import { ref, watch } from 'vue'
import Snippet from "@/data/Snippet";

const snippetsStore = useSnippetsStore();

snippetsStore.createSnippet(new Snippet({purpose: Snippet.FOR_COMMENT, text: "Snippet One"}));
snippetsStore.createSnippet(new Snippet({purpose: Snippet.FOR_COMMENT, text: "Snippet Two"}));
snippetsStore.createSnippet(new Snippet({purpose: Snippet.FOR_COMMENT, text: "Snippet Three"}));

let snippets = [];

function load() {
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

function select() {
  const snippet = snippets.find(element => element.key === snippetsStore.select);
  if (snippet) {
    if (snippet.key === 'new') {
      snippetsStore.edit = new Snippet({text: '', purpose: snippetsStore.open_for_purpose})
      snippetsStore.select = '';
    }
    else if (snippet.key !== snippetsStore.edit.key) {
      snippetsStore.edit = snippet;
    }
    document.getElementById('appSnippetEdit').focus();
  }
}

function handleOpen() {
  if (snippetsStore.selection_open) {
    load();
    select();
  }
}
watch(() => snippetsStore.selection_open, handleOpen);

function handleClose() {
  snippetsStore.selection_open = false;
}

function handleSelect() {
  select();
}

async function handleEdit() {
  if (snippetsStore.has(snippetsStore.edit.key)) {
    snippetsStore.updateSnippet(snippetsStore.edit);
  } else if (snippetsStore.edit.text) {
    await snippetsStore.createSnippet(snippetsStore.edit);
    load();
    snippetsStore.select = snippetsStore.edit.key;
  }
}

function handleApply() {
  snippetsStore.selection_open = false;
}

function handleDelete() {
  snippetsStore.selection_open = false;
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
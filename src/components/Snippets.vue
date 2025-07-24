<script setup>

import {useSnippetsStore} from "@/store/snippets";
import { ref, watch } from 'vue'
import Snippet from "@/data/Snippet";

const snippetsStore = useSnippetsStore();

snippetsStore.createSnippet(new Snippet({purpose: Snippet.FOR_COMMENT, text: "Snippet One"}));
snippetsStore.createSnippet(new Snippet({purpose: Snippet.FOR_COMMENT, text: "Snippet Two"}));
snippetsStore.createSnippet(new Snippet({purpose: Snippet.FOR_COMMENT, text: "Snippet Three"}));

let snippets = [];
let current = ref(new Snippet({text: 'Bitte oben auswählen oder hier neu eingeben.'}));

function handleOpen() {
  if (snippetsStore.selection_open) {
    switch (snippetsStore.open_for_purpose) {
      case Snippet.FOR_COMMENT:
        snippets = snippetsStore.forComment;
        break;

      case Snippet.FOR_SUMMARY:
        snippets = snippetsStore.forSummary;
        break;
    }
  }
}
watch(() => snippetsStore.selection_open, handleOpen);

function handleClose() {
  snippetsStore.selection_open = false;
}

function handleSelect() {
  if (snippetsStore.selection_open && snippetsStore.current_snippet_key) {
    current.value = snippetsStore.get(snippetsStore.current_snippet_key);
  }
}
watch(() => snippetsStore.current_snippet_key, handleSelect);

async function handleEdit() {
  console.log('handleEdit');
  const snippet = current.value;
  if (snippet) {
    console.log(snippet);
    if (snippet.purpose === null) {
      snippet.purpose = snippetsStore.open_for_purpose;
    }
    if (snippetsStore.has(snippet.key)) {
      snippetsStore.updateSnippet(snippet);
    } else {
      snippetsStore.createSnippet(snippet);
      snippetsStore.current_snippet_key = snippet.key;
    }
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
  return text.indexOf(searchText) > -1
}

function selectSnippet() {
  console.log('select snippet');
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
              v-model = snippetsStore.current_snippet_key
              :custom-filter="customFilter"
              :items="snippets"
              base-color="white"
              item-title="text"
              item-value="key"
          ></v-autocomplete>
          Bearbeiten:
          <v-textarea
              v-model="current.text"
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
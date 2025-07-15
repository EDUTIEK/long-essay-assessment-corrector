<script setup>

import {useSnippetsStore} from "@/store/snippets";
import { ref } from 'vue'

const snippetsStore = useSnippetsStore();

const dialogOpen = ref(false);

const states = [
  { name: 'Das ist aber ganz schlecht', abbr: 'FL', id: 1 },
  { name: 'Die Aussage ist verdoppelt', abbr: 'GA', id: 2 },
  { name: 'Ich stimme zu', abbr: 'NE', id: 3 },
]

function customFilter (itemTitle, queryText, item) {
  const textOne = item.raw.name.toLowerCase()
  const textTwo = item.raw.abbr.toLowerCase()
  const searchText = queryText.toLowerCase()
  return textOne.indexOf(searchText) > -1 || textTwo.indexOf(searchText) > -1
}

function selectSnippet() {
  console.log('select snippet');
}

</script>

<template>
  <div id="app-snippets">
    <v-btn @click="dialogOpen=true">
      <v-icon left icon="mdi-text"></v-icon>
    </v-btn>

    <v-dialog v-model="dialogOpen">
      <v-card>
        <v-card-title>Textbaustein</v-card-title>
        <v-card-text>
          Auswählen:
          <v-autocomplete
              :custom-filter="customFilter"
              :items="states"
              base-color="white"
              item-title="name"
              item-value="abbr"
          ></v-autocomplete>
          Bearbeiten:
          <v-textarea></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="selectSnippet()">
            <v-icon left icon="mdi-ok"></v-icon>
            <span>Übernehmen</span>
          </v-btn>
          <v-btn @click="selectSnippet()">
            <v-icon left icon="mdi-ok"></v-icon>
            <span>Löschen</span>
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="dialogOpen=false">
            <v-icon left icon="mdi-close"></v-icon>
            <span>Schließen</span>
          </v-btn>

        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>

  <v-button>

  </v-button>

</template>

<style scoped>

</style>
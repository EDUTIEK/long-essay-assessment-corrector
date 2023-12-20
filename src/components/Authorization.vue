<script setup>

import { useApiStore } from '@/store/api';
import { useTaskStore } from '@/store/task';
import { useItemsStore } from '@/store/items';
import { useSettingsStore } from '@/store/settings';
import { useSummariesStore } from '@/store/summaries';
import OwnSummaryIncludes from '@/components/OwnSummaryIncludes.vue';
import { ref } from 'vue';

const apiStore = useApiStore();
const taskStore = useTaskStore();
const itemsStore = useItemsStore();
const settingsStore = useSettingsStore();
const summariesStore = useSummariesStore();



const showIncludes = ref(false);

async function setAuthorizedAndContinue() {
  
    await summariesStore.setOwnAuthorized();
    if (await apiStore.saveChangesToBackend(true)) {
      apiStore.setShowAuthorization(false);
      let newKey = itemsStore.getNextKey(apiStore.itemKey);
      if (newKey != '') {
        apiStore.loadItemFromBackend(newKey);
      }
    }
    else {
      apiStore.setShowAuthorization(false);
      apiStore.setShowSendFailure(true);
    }
}

async function setAuthorizedAndClose() {

  await summariesStore.setOwnAuthorized();
  if (await apiStore.saveChangesToBackend(true)) {
    apiStore.setShowAuthorization(false);
    window.location = apiStore.returnUrl;
  } 
  else {
    apiStore.setShowAuthorization(false);
    apiStore.setShowSendFailure(true);
    return;
  }
}

</script>

<template>
    <div id="app-authorization-wrapper">

      <v-btn v-show="!summariesStore.isOwnDisabled" :disabled="!taskStore.authorization_allowed" @click="apiStore.setShowAuthorization(true)">
          <v-icon left icon="mdi-file-certificate-outline"></v-icon>
        <span>Autorisieren...</span>
      </v-btn>

      <v-dialog max-width="60em" persistent v-model="apiStore.showAuthorization">
        <v-card>
          <v-card-title>Korrektur von {{itemsStore.currentItem.title}} autorisieren</v-card-title>
          <v-card-text>
            
            <label for="appOwnSummaryPoints"><strong>Eigene Wertung:</strong></label>
            <input class="appPoints" type="number" min="0" :max="settingsStore.max_points" v-model="summariesStore.editSummary.points" />Punkte
            &nbsp;
            <strong>Notenstufe:</strong> {{ summariesStore.currentGradeTitle }}
            
            <own-summary-includes></own-summary-includes>

            <p><strong>Eigener Text:</strong></p>
            <div class="appText" v-html="summariesStore.editSummary.text">
            </div>
            
            <hr>
            <p v-show="summariesStore.areOthersAuthorized && summariesStore.stitchReasonText != '' ">
              <strong>Ihre Punktevergabe wird einen Stichentscheid erfordern:</strong>
              <br>{{ summariesStore.stitchReasonText }}
            </p>
            <br>
            <p>
              Durch die Autorisierung wird Ihre Korrektur festgeschrieben. Sie können sie anschließend nicht mehr ändern. Möchten Sie Ihre Korrektur autorisieren?
            </p>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="setAuthorizedAndContinue()">
              <v-icon left icon="mdi-check"></v-icon>
              <span>Autorisieren und Weiter</span>
            </v-btn>
            <v-btn @click="setAuthorizedAndClose()">
              <v-icon left icon="mdi-check"></v-icon>
              <span>Autorisieren und Schließen</span>
            </v-btn>
            <v-btn @click="apiStore.setShowAuthorization(false);">
              <v-icon left icon="mdi-close"></v-icon>
              <span>Abbrechen</span>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
</template>

<style scoped>

.appPoints {
  width: 4em;
  border: 0;
  margin-left: 5px;
  margin-right: 5px;
  padding: 5px;
}

.appText {
  height: 12em;
  overflow-y: scroll;
}

</style>

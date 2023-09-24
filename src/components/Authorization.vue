<script setup>

import {useApiStore} from '@/store/api';
import {useTaskStore} from '@/store/task';
import {useSummaryStore} from '@/store/summary';
import {useItemsStore} from '@/store/items';
import {useSettingsStore} from '@/store/settings';

const apiStore = useApiStore();
const taskStore = useTaskStore();
const summaryStore = useSummaryStore();
const itemsStore = useItemsStore();
const settingsStore = useSettingsStore();

async function setAuthorizedAndContinue() {
    if (! await apiStore.saveChangesToBackend()) {
        apiStore.setShowSendFailure(true);
        return;
    }
    await summaryStore.setAuthorized();
    if (!summaryStore.isSent) {
        apiStore.setShowSendFailure(true);
    }
    else {
        let newKey = itemsStore.nextKey(apiStore.itemKey);
        if (newKey != '') {
          apiStore.loadItemFromBackend(newKey);
        }
    }
}

async function setAuthorizedAndClose() {
    if (! await apiStore.saveChangesToBackend()) {
        apiStore.setShowSendFailure(true);
        return;
    }
    await summaryStore.setAuthorized();
    if (!summaryStore.isSent) {
    apiStore.setShowSendFailure(true);
    }
    else {
    window.location = apiStore.returnUrl;
    }
}

</script>

<template>
    <div id="app-authorization-wrapper">

      <v-btn v-show="!summaryStore.isAuthorized" :disabled="!taskStore.authorization_allowed" @click="summaryStore.showAuthorization=true">
          <v-icon left icon="mdi-file-certificate-outline"></v-icon>
        <span>Autorisieren...</span>
      </v-btn>

      <v-dialog persistent v-model="summaryStore.showAuthorization">
        <v-card>
          <v-card-text>
            
            <label for="appOwnSummaryPoints"><strong>Eigene Wertung:</strong></label>
            <input class="appPoints" type="number" min="0" :max="settingsStore.max_points" v-model="summaryStore.currentPoints" />Punkte
            &nbsp;
            <strong>Notenstufe:</strong> {{ summaryStore.currentGradeTitle }}

            <p><strong>Eigener Text:</strong></p>
            <div class="appText" v-html="summaryStore.currentContent">
            </div>
            
            <hr>
            <p v-show="summaryStore.isLastRating && summaryStore.getStitchReasonText != '' ">
              <strong>Ihre Punktevergabe wird einen Stichentscheid erfordern:</strong>
              <br>{{ summaryStore.getStitchReasonText }}
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
            <v-btn @click="summaryStore.showAuthorization=false">
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

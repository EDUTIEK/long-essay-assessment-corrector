<script setup>

import { useApiStore } from '@/store/api';
import { useItemsStore } from '@/store/items';
import { useSettingsStore } from '@/store/settings';
import { useSummariesStore } from '@/store/summaries';
import { useLevelsStore } from '@/store/levels';
import { useLayoutStore } from '@/store/layout';
import { usePointsStore } from '@/store/points';
import OwnSummaryIncludes from '@/components/OwnSummaryIncludes.vue';
import { ref } from 'vue';

const apiStore = useApiStore();
const itemsStore = useItemsStore();
const settingsStore = useSettingsStore();
const summariesStore = useSummariesStore();
const levelsStore = useLevelsStore();
const layoutStore = useLayoutStore();
const pointsStore = usePointsStore();

const showIncludes = ref(false);

async function setAuthorizedAndContinue() {

  await summariesStore.setOwnAuthorized();
  if (await apiStore.saveChangesToBackend(true)) {
    apiStore.setShowAuthorization(false);
    let newKey = itemsStore.getNextKey(apiStore.itemKey);
    if (newKey != '') {
      apiStore.loadItemFromBackend(newKey);
    }
  } else {
    apiStore.setShowAuthorization(false);
    apiStore.setShowSendFailure(true);
  }
}

async function setAuthorizedAndClose() {

  await summariesStore.setOwnAuthorized();
  if (await apiStore.saveChangesToBackend(true)) {
    apiStore.setShowAuthorization(false);
    window.location = apiStore.returnUrl;
  } else {
    apiStore.setShowAuthorization(false);
    apiStore.setShowSendFailure(true);
    return;
  }
}

function editSummary() {
  apiStore.showAuthorization = false;
  layoutStore.showOwnSummaryText();
}

</script>

<template>
  <div id="app-authorization-wrapper">

    <v-btn class="app-header-item" v-show="!summariesStore.isOwnDisabled" :disabled="apiStore.isLoading || !itemsStore.authorizationAllowed"
           @click="apiStore.setShowAuthorization(true)">
      <v-icon left icon="mdi-file-certificate-outline"></v-icon>
      <span>Autorisieren...</span>
    </v-btn>

    <v-dialog max-width="60em" persistent v-model="apiStore.showAuthorization">
      <v-card>
        <v-card-title>Korrektur von {{ itemsStore.currentItem.title }} autorisieren</v-card-title>
        <v-card-text>
          <p><strong>Gutachten:</strong>
            <v-btn variant="text" @click="editSummary()">
              <v-icon left icon="mdi-pencil"></v-icon>
              <span class="sr-only">Gutachten bearbeiten</span>
            </v-btn>
          </p>
          <div class="appText long-essay-content headlines-three" v-html="summariesStore.editSummary.text">
          </div>

          <label for="appAuthorizationPoints"><strong>Bewertung:</strong></label>
          <input id="appAuthorizationPoints" class="appPoints" type="number" min="0" :max="settingsStore.max_points"
                 v-model="summariesStore.editSummary.points"/>Punkte
          &nbsp;
          <strong>Notenstufe:</strong> {{ summariesStore.currentGradeTitle }}

          <own-summary-includes v-if="settingsStore.inclusionsPossible"></own-summary-includes>

          <v-alert v-show="summariesStore.editSummary.text == ''"
                   color="#0000A0" type="info" variant="text" density="compact">
            Bitte geben Sie einen Gutachten-Text ein.
          </v-alert>

          <v-alert v-show="(levelsStore.hasLevels && (summariesStore.editSummary.points === null))"
                   color="#0000A0" type="info" variant="text" density="compact">
            Bitte geben Sie eine Bewertung ein, damit eine Notenstufe vergeben werden kann.
          </v-alert>

          <v-alert v-show="(summariesStore.currentPartialPointsAreIncluded
                                    && summariesStore.editSummary.points !== null
                                    && summariesStore.editSummary.points != pointsStore.ownSumOfPoints)"
                   color="#0000A0" type="info" variant="text" density="compact">
            Ihre Bewertung weicht von der einbezogenen Summe der Teilpunkte ({{ pointsStore.ownSumOfPoints }})
            ab!
          </v-alert>

          <v-alert v-show="summariesStore.areOthersAuthorized && summariesStore.stitchReasonText != '' "
                   color="#0000A0" type="info" variant="text" density="compact">
            Ihre Punktevergabe wird einen Stichentscheid erfordern: {{ summariesStore.stitchReasonText }}
          </v-alert>
          <br>
          <p>
            Durch die Autorisierung wird Ihre Korrektur festgeschrieben. Sie können sie anschließend nicht mehr ändern.
            Möchten Sie Ihre Korrektur autorisieren?
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
  border: 1px solid lightgray;
}

</style>

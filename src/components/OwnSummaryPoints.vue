<script setup>

import {useSummariesStore} from '@/store/summaries';
import {useSettingsStore} from '@/store/settings';
import OwnSummaryIncludes from '@/components/OwnSummaryIncludes.vue';
import { ref } from 'vue';

const summariesStore = useSummariesStore();
const settingsStore = useSettingsStore();
const showIncludes = ref(false);

</script>

<template>
    <div id="app-own-summary-points-wrapper">
      <label for="appOwnSummaryPoints"><strong>Eigene Wertung:</strong></label>
      &nbsp;
      <input :disabled="summariesStore.isOwnDisabled" id="appOwnSummaryPoints" class="appPoints" type="number" min="0" :max="settingsStore.max_points" v-model="summariesStore.editSummary.points" /> Punkte
      &nbsp;
      <strong>Notenstufe:</strong> {{ summariesStore.currentGradeTitle }}
      
      <p>
        <strong>Einbeziehen:</strong> {{summariesStore.editSummary.getIncludesText()}}
        <v-btn variant="text" :disabled="summariesStore.isOwnDisabled" @click="showIncludes=true">
          <v-icon left icon="mdi-pencil"></v-icon>
        </v-btn>
      </p>
      
      <v-dialog max-width="50em" persistent v-model="showIncludes">
        <v-card>
          <v-card-title>In die Dokumentation der Korrektur einbeziehen</v-card-title>
          <v-card-text>
            <own-summary-includes></own-summary-includes>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="showIncludes=false">
              <v-icon left icon="mdi-close"></v-icon>
              <span>Fertig</span>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
</template>

<style scoped>


</style>

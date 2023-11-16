<script setup>

import {useSummariesStore} from '@/store/summaries';
import {useCriteriaStore} from '@/store/criteria';
import { usePreferencesStore } from '@/store/preferences';
import Summary from '@/data/Summary';
import { ref } from 'vue';

const summariesStore = useSummariesStore();
const criteriaStore = useCriteriaStore();
const preferencesStore = usePreferencesStore();

const showIncludes = ref(false);

const items = ref([
  {title: 'Nicht einbeziehen', value: Summary.INCLUDE_NOT},
  {title: 'informativ', value: Summary.INCLUDE_INFO},
  {title: 'bewertungsrelevant', value: Summary.INCLUDE_RELEVANT}
]);

const includes = ref({});
const updatePreferences = ref(false);

includes.value = summariesStore.currentInclusionSettings;

function save() {
  if (includes.value.include_comments == Summary.INCLUDE_NOT) {
    includes.value.include_comment_ratings = Summary.INCLUDE_NOT;
    includes.value.include_comment_points = Summary.INCLUDE_NOT;
  }
  summariesStore.editSummary.setData(includes.value);

  if (updatePreferences.value) {
    preferencesStore.setSummaryInclusions(includes.value);
    updatePreferences.value = false;
  }
  showIncludes.value=false;
}


</script>

<template>
  <div>
    <strong>Einbeziehen:</strong> {{summariesStore.getInclusionText(summariesStore.editSummary)}}
    <v-btn variant="text" :disabled="summariesStore.isOwnDisabled" @click="showIncludes=true;">
      <v-icon left icon="mdi-pencil"></v-icon>
    </v-btn>

    <v-dialog max-width="50em" persistent v-model="showIncludes">
      <v-card>
        <v-card-title>In die Dokumentation der Korrektur einbeziehen</v-card-title>
        <v-card-text>
          <v-container id='app-own-summary-includescontainer'>
            <v-row>
              <v-col>
                Markierungen und Kommentare
              </v-col>
              <v-col>
                <v-select class="select" variant="outlined" density="compact" v-model="includes.include_comments" :items = "items"></v-select>
              </v-col>
            </v-row>
            <v-row v-show="includes.include_comments > Summary.INCLUDE_NOT">
              <v-col>
                Kardinal und Exzellent
              </v-col>
              <v-col>
                <v-select class="select" variant="outlined" density="compact" v-model="includes.include_comment_ratings" :items = "items"></v-select>
              </v-col>
            </v-row>
            <v-row v-show="includes.include_comments > Summary.INCLUDE_NOT">
              <v-col>
                Teilpunkte
              </v-col>
              <v-col>
                <v-select class="select" variant="outlined" density="compact" v-model="includes.include_comment_points" :items = "items"></v-select>
              </v-col>
            </v-row>
            <v-row v-show="criteriaStore.hasOwnCriteria">
              <v-col>
                Bewertungsschema
              </v-col>
              <v-col>
                <v-select class="select" variant="outlined" density="compact" v-model="includes.include_criteria_points" :items = "items"></v-select>
              </v-col>
            </v-row>
            <!--
            <v-row>
              <v-col>
                Notizen
              </v-col>
              <v-col>
                <v-select class="select" variant="outlined" density="compact" v-model="includes.include_writer_notes" :items = "items"></v-select>
              </v-col>
            </v-row>
            -->
          </v-container>
          <v-checkbox v-model="updatePreferences" label="Als Vorgabe für andere Korekturen übernehmen, bei denen noch keine Auswahl getroffen wurde. Bereits aktiv getroffene Auwahlen bleiben unverändert."></v-checkbox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="save()">
            <v-icon left icon="mdi-check"></v-icon>
            <span>Übernehmen</span>
          </v-btn>
          <v-btn @click="showIncludes=false;">
            <v-icon left icon="mdi-close"></v-icon>
            <span>Abbrechen</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
  
</template>

<style scoped>

#app-own-summary-includes-container {
  font-size: 14px;
}

.select {
  font-size: 12px;
}


</style>

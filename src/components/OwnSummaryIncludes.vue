<script setup>

import { useSummariesStore } from '@/store/summaries';
import { useCriteriaStore } from '@/store/criteria';
import { usePreferencesStore } from '@/store/preferences';
import { useSettingsStore } from '@/store/settings';
import Summary from '@/data/Summary';
import { ref, nextTick} from 'vue';

const summariesStore = useSummariesStore();
const criteriaStore = useCriteriaStore();
const preferencesStore = usePreferencesStore();
const settingsStore = useSettingsStore();

const showIncludes = ref(false);

const items = ref([
  { title: 'Nicht einbeziehen', value: Summary.INCLUDE_NOT },
  { title: 'informativ', value: Summary.INCLUDE_INFO },
  { title: 'bewertungsrelevant', value: Summary.INCLUDE_RELEVANT }
]);

const includes = ref({});
const updatePreferences = ref(false);

includes.value = summariesStore.currentInclusionSettings;


async function show() {
  showIncludes.value=true;
  await nextTick();

  /**
   * Ugly fix for accessibility issues in v-select component of vuetify
   */
  const container = document.getElementById('app-own-summary-includes-container');
  for (const label of container.getElementsByTagName('label')) {
    if (label.classList.contains('v-label')) {
      label.remove();
    }
  }
}


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
  showIncludes.value = false;
}


</script>

<template>
  <div>
    <strong>Einbeziehen:</strong> {{ summariesStore.getInclusionText(summariesStore.editSummary) }}
    <v-btn v-if="!settingsStore.fixed_inclusions" variant="text" :disabled="summariesStore.isOwnDisabled"
           @click="show()">
      <v-icon left icon="mdi-pencil"></v-icon>
      <span class="sr-only">Einbezug bearbeiten</span>
    </v-btn>

    <v-dialog max-width="50em" persistent v-model="showIncludes">
      <v-card>
        <v-card-title>In die Dokumentation der Korrektur einbeziehen</v-card-title>
        <v-card-text>
          <v-container id='app-own-summary-includes-container'>
            <v-row>
              <v-col>
                <label for="appIncludeComments">Markierungen und Kommentare</label>
              </v-col>
              <v-col>
                <select id="appIncludeComments" class="appIncludesSelect" v-model="includes.include_comments">
                  <option :value="Summary.INCLUDE_NOT">Nicht einbeziehen</option>
                  <option :value="Summary.INCLUDE_INFO">informativ</option>
                  <option :value="Summary.INCLUDE_RELEVANT">bewertungsrelevant</option>
                </select>
              </v-col>
            </v-row>
            <v-row v-show="includes.include_comments > Summary.INCLUDE_NOT">
              <v-col>
                <label for="appIncludeRatings">{{ settingsStore.ratingLabels }}</label>
              </v-col>
              <v-col>
                <select id="appIncludeRatings" class="appIncludesSelect" v-model="includes.include_comment_ratings">
                  <option :value="Summary.INCLUDE_NOT">Nicht einbeziehen</option>
                  <option :value="Summary.INCLUDE_INFO">informativ</option>
                  <option :value="Summary.INCLUDE_RELEVANT">bewertungsrelevant</option>
                </select>
              </v-col>
            </v-row>
            <v-row v-show="includes.include_comments > Summary.INCLUDE_NOT">
              <v-col>
                <label for="appIncludeCommentPoints">Punkte zu Kommentaren</label>
              </v-col>
              <v-col>
                <select id="appIncludeCommentPoints" class="appIncludesSelect" v-model="includes.include_comment_points">
                  <option :value="Summary.INCLUDE_NOT">Nicht einbeziehen</option>
                  <option :value="Summary.INCLUDE_INFO">informativ</option>
                  <option :value="Summary.INCLUDE_RELEVANT">bewertungsrelevant</option>
                </select>
              </v-col>
            </v-row>
            <v-row v-show="criteriaStore.hasOwnCriteria">
              <v-col>
                <label for="appIncludeCriteriaPoints">Punkte im Bewertungsschema</label>
              </v-col>
              <v-col>
                <select id="appIncludeCriteriaPoints" class="appIncludesSelect" v-model="includes.include_criteria_points">
                  <option :value="Summary.INCLUDE_NOT">Nicht einbeziehen</option>
                  <option :value="Summary.INCLUDE_INFO">informativ</option>
                  <option :value="Summary.INCLUDE_RELEVANT">bewertungsrelevant</option>
                </select>
              </v-col>
            </v-row>
          </v-container>
          <v-checkbox v-model="updatePreferences"
                      label="Als Vorgabe für andere Korekturen übernehmen, bei denen noch keine Auswahl getroffen wurde. Bereits aktiv getroffene Auwahlen bleiben unverändert."></v-checkbox>
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

<style>

#app-own-summary-includes-container {
  font-size: 1rem;
}

#app-own-summary-includes-container label {
  font-size: 1rem;
}

.appIncludesSelect {
  border: 1px solid gray;
  border-radius: 3px;
  padding: 5px 10px;
  font-size: 1rem;
  width: 100%;
}

.v-label {
  opacity: initial!important;
}

</style>

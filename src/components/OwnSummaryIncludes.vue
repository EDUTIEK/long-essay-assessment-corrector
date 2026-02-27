<script setup>

import {useLayoutStore} from "@/store/layout";
import { useSummariesStore } from '@/store/summaries';
import { useCriteriaStore } from '@/store/criteria';
import { usePreferencesStore } from '@/store/preferences';
import { useSettingsStore } from '@/store/settings';
import Summary from '@/data/Summary';
import {ref, nextTick, onMounted, watch} from 'vue';

const layoutStore = useLayoutStore();
const summariesStore = useSummariesStore();
const criteriaStore = useCriteriaStore();
const preferencesStore = usePreferencesStore();
const settingsStore = useSettingsStore();

const showIncludes = ref(false);
const includes = ref({});
const updatePreferences = ref(false);

includes.value = summariesStore.currentInclusionSettings;

/**
 * Ugly fix for accessibility issues in v-select component of vuetify
 */
async function handlePopup() {
  if (layoutStore.showIncludesPopup) {
    await nextTick();
    const container = document.getElementById('app-own-summary-includes-container');
    for (const label of container.getElementsByTagName('label')) {
      if (label.classList.contains('v-label')) {
        label.remove();
      }
    }
  }
}
watch(() => layoutStore.showIncludesPopup, handlePopup);


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
  layoutStore.showIncludesPopup = false;
}


</script>

<template>
  <span>
    <strong>{{ $t('ownSummaryIncludesLabelInclude') }}</strong> {{ summariesStore.getInclusionText(summariesStore.editSummary) }}
    <v-dialog max-width="50em" persistent v-model="layoutStore.showIncludesPopup">
      <v-card>
        <v-card-title>{{ $t('ownSummaryIncludesTitle') }}</v-card-title>
        <v-card-text>
          <v-container id='app-own-summary-includes-container'>
            <v-row>
              <v-col>
                <label for="appIncludeComments">{{ $t('ownSummaryIncludesMarksAndComments') }}</label>
              </v-col>
              <v-col>
                <select id="appIncludeComments" class="appIncludesSelect" v-model="includes.include_comments">
                  <option :value="Summary.INCLUDE_NOT">{{ $t('ownSummaryIncludesIncludeNot') }}</option>
                  <option :value="Summary.INCLUDE_INFO">{{ $t('ownSummaryIncludesIncludeInfo') }}</option>
                  <option :value="Summary.INCLUDE_RELEVANT">{{ $t('ownSummaryIncludesIncludeRelevant') }}</option>
                </select>
                <small>{{ $t('ownSummaryIncludesMarksAndCommentsInfo') }}</small>
              </v-col>
            </v-row>
            <v-row v-show="includes.include_comments > Summary.INCLUDE_NOT">
              <v-col>
                <label for="appIncludeRatings">
                  {{ $t('ownSummaryIncludesRatings') }}
                  <br />
                  {{ '(' + settingsStore.ratingLabels + ')' }}
                </label>
              </v-col>
              <v-col>
                <select id="appIncludeRatings" class="appIncludesSelect" v-model="includes.include_comment_ratings">
                  <option :value="Summary.INCLUDE_NOT">{{ $t('ownSummaryIncludesIncludeNot') }}</option>
                  <option :value="Summary.INCLUDE_INFO">{{ $t('ownSummaryIncludesIncludeInfo') }}</option>
                  <option :value="Summary.INCLUDE_RELEVANT">{{ $t('ownSummaryIncludesIncludeRelevant') }}</option>
                </select>
                <small>{{ $t('ownSummaryIncludesRatingsInfo') }}</small>
              </v-col>
            </v-row>
            <v-row v-show="includes.include_comments > Summary.INCLUDE_NOT">
              <v-col>
                <label for="appIncludeCommentPoints">{{ $t('ownSummaryIncludesCommentPoints') }}</label>
              </v-col>
              <v-col>
                <select id="appIncludeCommentPoints" class="appIncludesSelect" v-model="includes.include_comment_points">
                  <option :value="Summary.INCLUDE_NOT">{{ $t('ownSummaryIncludesIncludeNot') }}</option>
                  <option :value="Summary.INCLUDE_INFO">{{ $t('ownSummaryIncludesIncludeInfo') }}</option>
                  <option :value="Summary.INCLUDE_RELEVANT">{{ $t('ownSummaryIncludesIncludeRelevant') }}</option>
                </select>
                <small>{{ $t('ownSummaryIncludesCommentPointsInfo') }}</small>
              </v-col>
            </v-row>
            <v-row v-show="criteriaStore.hasOwnCriteria">
              <v-col>
                <label for="appIncludeCriteriaPoints">{{ $t('ownSummaryIncludesCriteriaPoints') }}</label>
              </v-col>
              <v-col>
                <select id="appIncludeCriteriaPoints" class="appIncludesSelect" v-model="includes.include_criteria_points">
                  <option :value="Summary.INCLUDE_NOT">{{ $t('ownSummaryIncludesIncludeNot') }}</option>
                  <option :value="Summary.INCLUDE_INFO">{{ $t('ownSummaryIncludesIncludeInfo') }}</option>
                  <option :value="Summary.INCLUDE_RELEVANT">{{ $t('ownSummaryIncludesIncludeRelevant') }}</option>
                </select>
                <small>{{ $t('ownSummaryIncludesCriteriaPointsInfo') }}</small>
              </v-col>
            </v-row>
          </v-container>
          <v-checkbox v-model="updatePreferences"
                      :label="$t('ownSummaryIncludesUpdatePreferences')"></v-checkbox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="save()">
            <v-icon left icon="mdi-check"></v-icon>
            <span>{{ $t('allApply') }}</span>
          </v-btn>
          <v-btn @click="layoutStore.showIncludesPopup = false">
            <v-icon left icon="mdi-close"></v-icon>
            <span>{{ $t('allCancel') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>

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

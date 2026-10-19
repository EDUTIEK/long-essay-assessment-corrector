<script setup>
import {stores} from "@/store";
import SumOfPoints from "@/components/SumOfPoints.vue";
import { ref } from 'vue';
import i18n from "@/plugins/i18n";

const itemsStore = stores.items();
const settingsStore = stores.settings();
const summariesStore = stores.summaries();
const levelsStore = stores.levels();
const pointsStore = stores.points();
const preferencesStore = stores.preferences();
const { t } = i18n.global;


function getPartialPointsMessage() {
  let points = 0;

  if (!settingsStore.Task.enable_partial_points) {
    return '';
  }

  points = pointsStore.getSumOfPointsForCorrection(stores.corrections().ownKey);
  if (points == 0 || points == summariesStore.editSummary.points) {
    return '';
  }

  return t('authorizationPointsMismatch', [preferencesStore.formatNumber(points)]);
}
</script>

<template>
  <div class="appRow"
       v-if="settingsStore.Task.enable_partial_points"
       v-show = "pointsStore.getSumOfPointsForCorrection(stores.corrections().ownKey)">
    <sum-of-points class='sumOfPoints' :correction_key="stores.corrections().ownKey"></sum-of-points>
  </div>

  <div v-if="summariesStore.editSummary.hasPoints()" class="appRow">
    <strong>{{ $t('ownSummaryPointsRating') }}</strong>
    {{ preferencesStore.formatNumber(summariesStore.editSummary.points) }} {{ $t('authorizationPointsSuffix' ) }}
    &nbsp;
    <strong>{{ $t('authorizationGradeTitle') }}</strong> {{ summariesStore.currentGradeTitle }}

    <p>{{ summariesStore.currentGradeStatement }}</p>

  </div>

  <div class="appRow">
    <v-alert v-show="!summariesStore.editSummary.text && !summariesStore.editSummary.pdf"
             color="#0000A0" type="info" variant="text" density="compact">
      {{ $t('authorizationPleaseEnterSummary') }}
    </v-alert>

    <v-alert v-show="(levelsStore.hasLevels && (!summariesStore.editSummary.hasPoints()))"
             color="#0000A0" type="info" variant="text" density="compact">
      {{ $t('authorizationPleaseEnterPoints') }}
    </v-alert>

    <v-alert v-show="getPartialPointsMessage() != ''" color="#0000A0" type="info" variant="text" density="compact">
      {{getPartialPointsMessage()}}
    </v-alert>

    <v-alert v-show="summariesStore.areOthersAuthorized && summariesStore.pointsDifferText != '' "
             color="#0000A0" type="info" variant="text" density="compact">
      {{ summariesStore.pointsDifferText }}
    </v-alert>

    <v-alert v-show="itemsStore.isInStitch && summariesStore.pointsOutsideCorridorText !== ''"
             color="#0000A0" type="info" variant="text" density="compact">
      {{ summariesStore.pointsOutsideCorridorText }}
    </v-alert>

  </div>

</template>

<style scoped>

.appRow {
  margin-bottom: 10px;
}

.appPoints {
  width: 4em;
  border: 1px solid #aaaaaa;
  border-radius: 5px;
  padding: 3px;
  margin-left: 5px;
  margin-right: 5px;
}
</style>
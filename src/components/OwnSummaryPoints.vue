<script setup>

import {useSummariesStore} from '@/store/summaries';
import {useSettingsStore} from '@/store/settings';

const summariesStore = useSummariesStore();
const settingsStore = useSettingsStore();

</script>

<template>
    <div id="app-own-summary-points-wrapper">
      <label for="appOwnSummaryPoints"><strong>Eigene Wertung:</strong></label>
      <input :disabled="summariesStore.isOwnAuthorized" id="appOwnSummaryPoints" class="appPoints" type="number" min="0" :max="settingsStore.max_points" v-model="summariesStore.editSummary.points" />Punkte
      &nbsp;
      <strong>Notenstufe:</strong> {{ summariesStore.currentGradeTitle }}
    </div>
</template>

<style scoped>

#app-own-summary-points-wrapper {
  font-size: 14px;
}

.appPoints {
    width: 4em;
    border: 0;
    margin-left: 5px;
    margin-right: 5px;
    padding: 5px;
}
</style>

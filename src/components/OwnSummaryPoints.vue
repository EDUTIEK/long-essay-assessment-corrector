<script setup>

import {useSummaryStore} from '@/store/summary';
import {useSettingsStore} from '@/store/settings';

const summaryStore = useSummaryStore();
const settingsStore = useSettingsStore();

</script>

<template>
    <div id="app-own-summary-points-wrapper">
      <label for="appOwnSummaryPoints"><strong>Eigene Wertung:</strong></label>
      <input :disabled="summaryStore.isAuthorized" id="appOwnSummaryPoints" class="appPoints" type="number" min="0" :max="settingsStore.max_points" v-model="summaryStore.currentPoints" />Punkte
      &nbsp;
      <strong>Notenstufe:</strong> {{ summaryStore.currentGradeTitle }}
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

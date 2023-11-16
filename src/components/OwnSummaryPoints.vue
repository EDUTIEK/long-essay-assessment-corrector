<script setup>

import {useSummariesStore} from '@/store/summaries';
import {useSettingsStore} from '@/store/settings';
import OwnSummaryIncludes from '@/components/OwnSummaryIncludes.vue';

const summariesStore = useSummariesStore();
const settingsStore = useSettingsStore();

</script>

<template>
    <div id="app-own-summary-points-wrapper">
      <label for="appOwnSummaryPoints"><strong>Eigene Wertung:</strong></label>
      &nbsp;
      <input :disabled="summariesStore.isOwnDisabled" id="appOwnSummaryPoints" class="appPoints" type="number" min="0" :max="settingsStore.max_points" v-model="summariesStore.editSummary.points" /> Punkte
      &nbsp;
      <strong>Notenstufe:</strong> {{ summariesStore.currentGradeTitle }}

      <own-summary-includes></own-summary-includes>
      
    </div>
</template>

<style scoped>


</style>

<script setup>

import { useApiStore } from '@/store/api';
import { useSummariesStore } from '@/store/summaries';
import { useSettingsStore } from '@/store/settings';
import { useTaskStore } from '@/store/task';
import OwnSummaryIncludes from '@/components/OwnSummaryIncludes.vue';

const apiStore = useApiStore();
const summariesStore = useSummariesStore();
const settingsStore = useSettingsStore();
const taskStore = useTaskStore();

</script>

<template>
    <div id="app-own-summary-points-wrapper">
      <label for="appOwnSummaryPoints"><strong>Bewertung:</strong></label>
      &nbsp;
      <input :disabled="summariesStore.isOwnDisabled" id="appOwnSummaryPoints" class="appPoints" type="number" min="0" :max="settingsStore.max_points" v-model="summariesStore.editSummary.points" /> Punkte
      &nbsp;
      <strong>Notenstufe:</strong> {{ summariesStore.currentGradeTitle }}

      <v-btn variant="text" v-show="!summariesStore.isOwnDisabled" :disabled="!taskStore.authorization_allowed" @click="apiStore.setShowAuthorization(true)">
        <v-icon left icon="mdi-file-certificate-outline"></v-icon>
      </v-btn>

      <own-summary-includes></own-summary-includes>

    </div>
</template>

<style scoped>

.appPoints {
  width: 4em;
}
</style>

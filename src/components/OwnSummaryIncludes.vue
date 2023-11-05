<script setup>

import {useSummariesStore} from '@/store/summaries';
import Summary from '@/data/Summary';

const summariesStore = useSummariesStore();

</script>

<template>
    <div id="app-own-summary-includes-wrapper">

      <strong>In die Dokumentation der Korrektur einbeziehen:</strong>
      
      <v-container>
        <v-row>
          <v-col>
            Markierungen und Kommentare
          </v-col>
          <v-col>
            <select v-model="summariesStore.editSummary.include_comments">
              <option :value="Summary.INCLUDE_NOT">Nicht einbeziehen</option>
              <option :value="Summary.INCLUDE_INFO">informativ</option>
              <option :value="Summary.INCLUDE_RELEVANT">bewertungsrelevant</option>
            </select>
          </v-col>
        </v-row>
      </v-container>

    </div>
</template>

<style scoped>

#app-own-summary-includes-wrapper {
  font-size: 14px;
}

</style>

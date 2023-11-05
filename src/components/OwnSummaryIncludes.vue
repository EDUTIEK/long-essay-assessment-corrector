<script setup>

import {useSummariesStore} from '@/store/summaries';
import {useCriteriaStore} from '@/store/criteria';
import Summary from '@/data/Summary';
import { ref } from 'vue';

const summariesStore = useSummariesStore();
const criteriaStore = useCriteriaStore();

const items = ref([
  {title: 'Nicht einbeziehen', value: Summary.INCLUDE_NOT},
  {title: 'informativ', value: Summary.INCLUDE_INFO},
  {title: 'bewertungsrelevant', value: Summary.INCLUDE_RELEVANT}
]);


</script>

<template>
    <div id="app-own-summary-includes-wrapper">
      <v-container>
        <v-row>
          <v-col>
            Markierungen und Kommentare
          </v-col>
          <v-col>
            <v-select class="select" variant="outlined" density="compact" v-model="summariesStore.editSummary.include_comments" :items = "items"></v-select>
          </v-col>
        </v-row>
        <v-row v-show="summariesStore.editSummary.include_comments > Summary.INCLUDE_NOT">
          <v-col>
            Kardinal und Exzellent
          </v-col>
          <v-col>
            <v-select class="select" variant="outlined" density="compact" v-model="summariesStore.editSummary.include_comment_ratings" :items = "items"></v-select>
          </v-col>
        </v-row>
        <v-row v-show="summariesStore.editSummary.include_comments > Summary.INCLUDE_NOT">
          <v-col>
            Teilpunkte
          </v-col>
          <v-col>
            <v-select class="select" variant="outlined" density="compact" v-model="summariesStore.editSummary.include_comment_points" :items = "items"></v-select>
          </v-col>
        </v-row>
        <v-row v-show="criteriaStore.hasOwnCriteria">
          <v-col>
            Bewertungsschema
          </v-col>
          <v-col>
            <v-select class="select" variant="outlined" density="compact" v-model="summariesStore.editSummary.include_criteria_points" :items = "items"></v-select>
          </v-col>
        </v-row>
        <!--
        <v-row>
          <v-col>
            Notizen
          </v-col>
          <v-col>
            <v-select class="select" variant="outlined" density="compact" v-model="summariesStore.editSummary.include_writer_notes" :items = "items"></v-select>
          </v-col>
        </v-row>
        -->

      </v-container>

    </div>
</template>

<style scoped>

#app-own-summary-includes-wrapper {
  font-size: 14px;
}

.select {
  font-size: 12px;
}


</style>

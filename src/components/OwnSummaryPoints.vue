<script setup>

import {useApiStore} from '@/store/api';
import {useTaskStore} from '@/store/task';
import {useSummaryStore} from '@/store/summary';
import {useLevelsStore} from '@/store/levels';
import {useSettingsStore} from '@/store/settings';
import {useItemsStore} from '@/store/items';

const apiStore = useApiStore();
const taskStore = useTaskStore();
const summaryStore = useSummaryStore();
const levelsStore = useLevelsStore();
const settingsStore = useSettingsStore();
const itemsStore = useItemsStore();

</script>

<template>
    <div id="app-own-summary-points-wrapper">

      <label for="appSummaryPoints">Punkte: </label>
      <input :disabled="summaryStore.storedIsAuthorized" id="appSummaryPoints" class="appRatingControl" type="number" min="0" :max="settingsStore.max_points" v-model="summaryStore.currentPoints" />

      <label for="appSummaryGradeKey">( {{ summaryStore.currentGradeTitle }} ) &nbsp;</label>


    </div>
</template>

<style scoped>

.appRatingControl {
  border: 1px solid lightgray;
  margin-left: 10px;
  margin-right: 10px;
  padding: 5px;
}
</style>

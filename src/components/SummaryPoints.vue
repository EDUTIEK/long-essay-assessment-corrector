<script setup>
import { ref } from 'vue';
import { useSettingsStore} from '@/store/settings';
import { useLevelsStore } from '@/store/levels';
import { useSummariesStore } from '@/store/summaries';

const settingsStore = useSettingsStore();
const levelsStore = useLevelsStore();
const summariesStore = useSummariesStore();

const props = defineProps(['corrector_key']);

const points = ref(0);
const grade = ref('');
const text = ref('');

const summary = summariesStore.getForCorrector(props.corrector_key);
if (summary) {
  points.value = summary.points;
  const level = levelsStore.getLevel(summary.grade_key);
  if (level) {
    grade.value = level.title;
  }
  text.value = summariesStore.getInclusionText(summary);
}


</script>

<template>
    <div id="app-summary-points-wrapper">
      <label for="appSummaryPoints"><strong>Wertung:</strong></label>
      <input :disabled="true" id="appSummaryPoints" class="appPoints" type="number" min="0" :max="settingsStore.max_points" v-model="points" /> Punkte
      &nbsp;
      <strong>Notenstufe:</strong> {{ grade }}

      <p><strong>Einbeziehen:</strong> {{text}}</p>
    </div>
</template>

<style scoped>

#app-summary-points-wrapper {
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

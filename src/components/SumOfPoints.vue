<script setup>
import { useSettingsStore } from "@/store/settings";
import { usePointsStore } from "@/store/points";

const settingsStore = useSettingsStore();
const pointsStore = usePointsStore();

const props = defineProps(['corrector_key']);

function pointsNote() {
  let with_comment = pointsStore.getSumOfPointsWithComment(props.corrector_key);
  let without_comment = pointsStore.getSumOfPointsWithoutComment(props.corrector_key);

  if (with_comment > 0 && without_comment > 0) {
    return '(' + with_comment + ' aus Anmerkungen, ' + without_comment + ' aus Kopfnoten)';
  }
  else if (with_comment > 0) {
    return '(aus allen Anmerkungen)';
  }
  else if (without_comment > 0) {
    return '(aus aus Kopfnoten)';
  }

  return '';
}

</script>

<template>
  <span>
    <strong>Punktesumme: </strong>
    <span :class="pointsStore.getSumOfPointsForCorrector(props.corrector_key) > settingsStore.max_points ? 'red' : ''">
      {{ pointsStore.getSumOfPointsForCorrector(props.corrector_key) }} von max. {{ settingsStore.max_points }}</span> {{ pointsNote() }}
  </span>
</template>

<style scoped>

.red {
  color: red;
}

</style>
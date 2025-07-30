<script setup>
import {useSettingsStore} from "@/store/settings";
import {usePointsStore} from "@/store/points";
import {useCriteriaStore} from "@/store/criteria";
import i18n from "@/plugins/i18n";

const settingsStore = useSettingsStore();
const pointsStore = usePointsStore();
const criteriaStore = useCriteriaStore();

const props = defineProps(['corrector_key']);
const { t } = i18n.global;

const has_general_criteria = criteriaStore.getCorrectorHasGeneralCriteria(props.corrector_key);
const has_comment_criteria = criteriaStore.getCorrectorHasCommentCriteria(props.corrector_key);

function pointsNote() {
  const with_comment = pointsStore.getSumOfPointsForCorrector(props.corrector_key, true);
  const without_comment = pointsStore.getSumOfPointsForCorrector(props.corrector_key, false);

  if (without_comment + with_comment == 0) {
    return '';
  }
  else if (!has_general_criteria) {
    return has_comment_criteria ? t('sumOfPointsToCriteriaInComments') : t('sumOfPointsToComments');
  }
  else  {
    return has_comment_criteria ?
        t('sumOfPointsNCommentCriteriaMGeneralCriteria', [with_comment, without_comment]) :
        t('sumOfPointsNCommentsMGeneralCriteria', [with_comment, without_comment]);
  }
}

</script>

<template>
  <span>
    <strong>{{ $t('sumOfPointsLabel')}}</strong>
    <span :class="pointsStore.getSumOfPointsForCorrector(props.corrector_key) > settingsStore.max_points ? 'red' : ''">
      {{ pointsStore.getSumOfPointsForCorrector(props.corrector_key) }} von max. {{ settingsStore.max_points }}</span> {{ pointsNote() }}
  </span>
</template>

<style scoped>

.red {
  color: red;
}

</style>
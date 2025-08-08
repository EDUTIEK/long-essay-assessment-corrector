<script setup>
import { useCriteriaStore } from "@/store/criteria";
import { useCommentsStore } from "@/store/comments";
import { usePointsStore } from "@/store/points";
import { useApiStore } from "@/store/api";
import { useSettingsStore } from '@/store/settings';
import { useSummariesStore } from '@/store/summaries';
import { useLayoutStore } from '@/store/layout';
import {nextTick, ref, watch} from 'vue';

const criteriaStore = useCriteriaStore();
const commentsStore = useCommentsStore();
const pointsStore = usePointsStore();
const apiStore = useApiStore();
const settingStore = useSettingsStore();
const summariesStore = useSummariesStore();
const layoutStore = useLayoutStore();

let comment_key = ref('');
let corrector_key = ref('');
let criteriaPoints = ref({});

async function loadPoints() {
  const comment = commentsStore.getComment(commentsStore.selectedKey);
  comment_key.value = comment ? comment.key : '';
  corrector_key.value = comment ? comment.corrector_key : apiStore.correctorKey;

  criteriaPoints.value = {};
  for (const criterion of criteriaStore.getCorrectorCommentCriteria(corrector_key.value)) {
    const pointsObject = pointsStore.getObjectByData(corrector_key.value, comment_key.value, criterion.key);
    criteriaPoints.value[criterion.key] = (pointsObject ? pointsObject.points : 0);
  }
}

loadPoints();
watch(() => commentsStore.selectionChange, loadPoints);

function savePoints(criterionKey) {
  pointsStore.setValueByCommentOrCriterion(commentsStore.selectedKey, criterionKey, criteriaPoints.value[criterionKey]);
}

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'markingCommentCriteria') {
    await nextTick();
    document.getElementById('appMarkingCommentCriteriaStart').focus();
  }
}
watch(() => layoutStore.focusChange, handleFocusChange);


async function handleKeyDown(event) {
  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      layoutStore.focusMarkingCommentCriteriaSum();
      break;
  }
}


</script>


<template>
  <div>
    <p class="info" v-if="comment_key == ''">
      {{ $t('markingCommentCriteriaPleaseSelect') }}
    </p>
    <v-table v-if="comment_key != ''" density="compact">
      <thead>
      <tr>
        <th class="col-left">
          <span id="appMarkingCommentCriteriaStart" tabindex="0" @keydown="handleKeyDown">{{ $t('markingCommentsCriteriaCriterion') }}</span>
        </th>
        <th class="col-mid text-right">
          {{ $t('allPoints', 0) }}
        </th>
        <th class="col-right text-right">
          {{ $t('markingCommentCriteriaSumOfMax') }}
        </th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="criterion in criteriaStore.getCorrectorCommentCriteria(corrector_key)" :key="criterion.key">
        <td class="col-left">
          <label tabindex="0" @keydown="handleKeyDown" :for="'app-points-input-' + criterion.key">{{ criterion.title }}</label>
        </td>
        <td class="col-mid text-right">
          <input class="appPoints" type="number" v-model="criteriaPoints[criterion.key]"
                 :id="'app-points-input-' + criterion.key"
                 :disabled="summariesStore.isOwnDisabled || comment_key == '' || corrector_key != apiStore.correctorKey"
                 :max="criterion.points"
                 @change="savePoints(criterion.key)"
                 @keydown="handleKeyDown"
          />
        </td>
        <td :class="'col-right text-right ' + (pointsStore.getPointsOfCriterionExceeded(criterion, corrector_key) ? 'red' : '')">
          {{ pointsStore.getSumOfPointsForCriterion(criterion, corrector_key) }} / {{ criterion.points }}
        </td>
      </tr>
       </tbody>
    </v-table>
  </div>
</template>

<style scoped>

th, td {
  font-size: 14px;
}

.commentLabel {
  background-color: #606060;
  color: white;
  padding: 3px;
  font-size: 14px;
}

.appPoints {
  width: 4em;
  border: 1px solid #aaaaaa;
  border-radius: 5px;
  padding: 3px;
}

.col-left {
  width: 70%;
}

.col-mid {
  width: 15%;
}

.col-right {
  width: 15%;
}

.info {
  padding: 10px;
  color: #555555;
}

.red {
  color: red;
}


</style>

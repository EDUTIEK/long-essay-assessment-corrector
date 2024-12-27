<script setup>
import { useCriteriaStore } from "@/store/criteria";
import { useCommentsStore } from "@/store/comments";
import { usePointsStore } from "@/store/points";
import { useApiStore } from "@/store/api";
import { useSummariesStore } from '@/store/summaries';
import { useLayoutStore } from '@/store/layout';
import {nextTick, ref, watch} from 'vue';

const criteriaStore = useCriteriaStore();
const commentsStore = useCommentsStore();
const pointsStore = usePointsStore();
const apiStore = useApiStore();
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
    criteriaPoints.value[criterion.key] = pointsStore.getValueByRelation(commentsStore.selectedKey, criterion.key);
  }
}

loadPoints();
watch(() => commentsStore.selectionChange, loadPoints);

function savePoints(criterionKey) {
  pointsStore.setValueByRelation(commentsStore.selectedKey, criterionKey, criteriaPoints.value[criterionKey]);
}

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'markingPoints') {
    await nextTick();
    document.getElementById('appMarkingPointsStart').focus();
  }
}
watch(() => layoutStore.focusChange, handleFocusChange);


async function handleKeyDown(event) {
  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      layoutStore.focusMarkingPointsSum();
      break;
  }
}


</script>


<template>
  <div>
    <p class="info" v-if="corrector_key == ''">
      Bitte Kommentar auswählen.
    </p>
    <v-table v-if="corrector_key != ''" density="compact">
      <thead>
      <tr>
        <th class="col-left">
          <span id="appMarkingPointsStart" tabindex="0" @keydown="handleKeyDown">Kriterium</span>
        </th>
        <th class="col-mid text-right">
          Punkte <span v-show="commentsStore.selectedKey != ''"
                       class="commentLabel">{{ commentsStore.selectedLabel }}</span>
        </th>
        <th class="col-right text-right">
          Summe / max.
        </th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="criterion in criteriaStore.getCorrectorCommentCriteria(corrector_key)" :key="criterion.key">
        <td class="col-left">
          <label tabindex="0" @keydown="handleKeyDown" :for="'app-points-input-' + criterion.key">{{ criterion.title }}</label>
        </td>
        <td class="col-mid text-right">
          <input class="appPoints" type="number" min="0" v-model="criteriaPoints[criterion.key]"
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
      <tr>
        <td class="col-left">
          <strong>Summe</strong>
        </td>
        <td class="col-mid text-right">
          <strong class="sum-points">{{ pointsStore.getSumOfPointsForComment(comment_key) }}</strong>
        </td>
        <td class="col-right text-right">
          <strong>{{ pointsStore.getSumOfPointsForCorrector(corrector_key) + ' / ' + criteriaStore.sumOfMaxPoints }}</strong>
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
  border: 0;
  margin-left: 5px;
  margin-right: 5px;
  padding: 5px;
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

.sum-points {
  margin-right: 50px;
}

</style>

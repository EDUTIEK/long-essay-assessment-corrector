<script setup>
import { useCriteriaStore } from "@/store/criteria";
import { usePointsStore } from "@/store/points";
import { useApiStore } from "@/store/api";
import { useSettingsStore } from '@/store/settings';
import { useSummariesStore } from '@/store/summaries';
import { useLayoutStore } from '@/store/layout';
import {nextTick, ref, watch} from 'vue';

const criteriaStore = useCriteriaStore();
const pointsStore = usePointsStore();
const apiStore = useApiStore();
const settingStore = useSettingsStore();
const summariesStore = useSummariesStore();
const layoutStore = useLayoutStore();

let corrector_key = ref('');
let criteriaPoints = ref({});

async function loadPoints() {
  corrector_key.value = apiStore.correctorKey;
  criteriaPoints.value = {};
  for (const criterion of criteriaStore.getCorrectorGeneralCriteria(corrector_key.value)) {
    const pointsObject = pointsStore.getObjectByData(corrector_key.value, '', criterion.key);
    criteriaPoints.value[criterion.key] = pointsObject ? pointsObject.points : 0;
  }
}
loadPoints();

function savePoints(criterionKey) {
  pointsStore.setValueByCommentOrCriterion('', criterionKey, criteriaPoints.value[criterionKey]);
}

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'markingGeneralCriteria') {
    await nextTick();
    document.getElementById('appMarkingGeneralCriteriaStart').focus();
  }
}
watch(() => layoutStore.focusChange, handleFocusChange);

</script>


<template>
  <div>
    <v-table density="compact">
      <thead>
      <tr>
        <th class="col-left">
          <span id="appMarkingGeneralCriteriaStart" tabindex="0" @keydown="handleKeyDown">Kriterium</span>
        </th>
        <th class="col-right text-right">
          Punkte
        </th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="criterion in criteriaStore.getCorrectorGeneralCriteria(corrector_key)" :key="criterion.key">
        <td class="col-left">
          <label tabindex="0" :for="'app-points-input-' + criterion.key">{{ criterion.title }}</label>
        </td>
        <td class="col-mid text-right">
          <input class="appPoints" type="number" min="0" v-model="criteriaPoints[criterion.key]"
                 :id="'app-points-input-' + criterion.key"
                 :disabled="summariesStore.isOwnDisabled || corrector_key != apiStore.correctorKey"
                 :max="criterion.points"
                 @change="savePoints(criterion.key)"
          />
        </td>
      </tr>
      <tr>
        <td class="col-left">
          <strong>Summe</strong>
        </td>
        <td class="col-mid text-right">
          <strong class="sum-points">{{ pointsStore.getSumOfPointsWithoutComment(corrector_key) + ' / ' + settingStore.max_points}}</strong>
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

.col-right {
  width: 30%;
}


.red {
  color: red;
}

.sum-points {
  margin-right: 50px;
}

</style>

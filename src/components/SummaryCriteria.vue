<script setup>
import { nextTick, reactive, ref, watch } from 'vue';
import { useApiStore } from '@/store/api';
import { useCriteriaStore } from "@/store/criteria";
import { useCommentsStore } from "@/store/comments";
import { usePointsStore } from "@/store/points";
import { useLayoutStore } from '@/store/layout';
import { useSettingsStore } from '@/store/settings';

const apiStore = useApiStore();
const criteriaStore = useCriteriaStore();
const commentsStore = useCommentsStore();
const pointsStore = usePointsStore();
const layoutStore = useLayoutStore();
const settingsStore = useSettingsStore();

const props = defineProps(['corrector_key']);
watch(() => props, loadCriteria);
watch(() => apiStore.itemKey, loadCriteria);

const criteriaPoints = reactive({});
const criteriaSum = ref(0);
const criteriaMax = ref(0);


async function loadCriteria() {
  await nextTick();

  criteriaSum.value = 0;
  criteriaMax.value = 0;

  criteriaStore.getCorrectorCommentCriteria(props.corrector_key).forEach(criterion => {
    criteriaPoints[criterion.key] = {
      key: criterion.key,
      title: criterion.title,
      max_points: criterion.points,
      sum_points: 0
    }
    criteriaMax.value += criterion.points
  });

  pointsStore.getObjectsByCommentKeys(commentsStore.getKeysOfCorrector(props['corrector_key'])).forEach(points => {
    if (criteriaPoints[points.criterion_key] !== undefined) {
      criteriaPoints[points.criterion_key].sum_points += points.points;
    }
    criteriaSum.value += points.points
  });
}

if (criteriaStore.getCorrectorHasCommentCriteria(props.corrector_key)) {
  loadCriteria();
}


function getPointsColor(comment) {
  const sum = commentsStore.getPointsOfCorrector(props.corrector_key);

  if (sum > settingsStore.max_points) {
    return 'red';
  }

  return 'black';
}

async function filterByRating(rating_excellent, rating_cardinal) {
  commentsStore.setFilterByRating(props.corrector_key, rating_excellent, rating_cardinal);
  if (!props.corrector_key == apiStore.correctorKey) {
    commentsStore.setShowOtherCorrectors(true);
  }
  await nextTick();
  layoutStore.showEssay();
  layoutStore.showMarking();
}

async function filterByPointsInComment() {
  commentsStore.setFilterByPoints(props.corrector_key);
  if (!props.corrector_key == apiStore.correctorKey) {
    commentsStore.setShowOtherCorrectors(true);
  }
  await nextTick();
  layoutStore.showEssay();
  layoutStore.showMarking();
}

async function filterByCriterion(criterion_key) {
  commentsStore.setFilterByCriterion(props.corrector_key, criterion_key);
  if (!props.corrector_key == apiStore.correctorKey) {
    commentsStore.setShowOtherCorrectors(true);
  }
  await nextTick();
  layoutStore.showEssay();
  layoutStore.showMarking();
}


</script>

<template>
  <div>
    <v-table class="table" density="compact">
      <thead>
      <tr>
        <th>Markierung</th>
        <th class="text-right">Anzahl</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>
          <v-btn density="compact" size="small" variant="text" prepend-icon="mdi-filter-outline"
                 :disabled="commentsStore.getCountOfExcellent(props.corrector_key) == 0"
                 @click="filterByRating(true, false)">
            <span class="sr-only">{{ settingsStore.positive_rating }}</span>
          </v-btn>
          <span aria-hidden="true">{{ settingsStore.positive_rating }}</span>

        </td>
        <td class="text-right">
          {{ commentsStore.getCountOfExcellent(props.corrector_key) }}
        </td>
      </tr>
      <tr>
        <td>
          <v-btn density="compact" size="small" variant="text" prepend-icon="mdi-filter-outline"
                 :disabled="commentsStore.getCountOfCardinal(props.corrector_key) == 0"
                 @click="filterByRating(false, true)">
            <span class="sr-only">{{ settingsStore.negative_rating }}</span>
          </v-btn>
          <span aria-hidden="true">{{ settingsStore.negative_rating }}</span>
        </td>
        <td class="text-right">
          {{ commentsStore.getCountOfCardinal(props.corrector_key) }}
        </td>
      </tr>
      </tbody>
    </v-table>

    <!-- Points are asigned to comments -->
    <v-table v-if="!criteriaStore.getCorrectorHasCommentCriteria(props.corrector_key)" class="table" density="compact">
      <thead>
      <tr>
        <th><strong>Bewertung</strong></th>
        <th class="text-right">Punkte / max</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>
          <v-btn density="compact" size="small" variant="text" prepend-icon="mdi-filter-outline"
                 :disabled="commentsStore.getPointsOfCorrector(props.corrector_key) == 0"
                 @click="filterByPointsInComment(true)">
            <span class="sr-only">Punkte in Kommentaren</span>
          </v-btn>
          <span aria-hidden="true">Punkte in Kommentaren</span>

        </td>
        <td class="text-right">
                <span :style="'color: ' + getPointsColor() + ';'">
                    {{ commentsStore.getPointsOfCorrector(props.corrector_key) }} / {{ settingsStore.max_points }}
                </span>
        </td>
      </tr>
      </tbody>
    </v-table>

    <!-- Points are asigned to criteria -->
    <v-table v-if="criteriaStore.getCorrectorHasCommentCriteria(props.corrector_key)" class="table" density="compact">
      <thead>
      <tr>
        <th>Kriterium</th>
        <th class="text-right">Punkte / max</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="criterion in criteriaPoints" :key="criterion.key">
        <td>
          <v-btn density="compact" size="small" variant="text" prepend-icon="mdi-filter-outline"
                 :disabled="criterion.sum_points == 0"
                 @click="filterByCriterion(criterion.key)">
            <span class="sr-only">{{ criterion.title }}</span>
          </v-btn>
          <span aria-hidden="true">{{ criterion.title }}</span>
        </td>
        <td class="text-right">{{ criterion.sum_points }} / {{ criterion.max_points }}</td>
      </tr>
      <tr>
        <td>
          <strong>Summe</strong>
        </td>
        <td class="text-right"><strong>{{ criteriaSum }} / {{ criteriaMax }}</strong></td>
      </tr>
      </tbody>
    </v-table>
  </div>
</template>

<style scoped>

.table {
  margin-bottom: 10px;
}

.label {
  display: inline-block;
}

td {
  font-size: 14px;
}
</style>

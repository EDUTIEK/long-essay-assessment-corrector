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

const generalCriteriaPoints = reactive({});
const commentCriteriaPoints = reactive({});


async function loadCriteria() {
  await nextTick();

  criteriaStore.getCorrectorCommentCriteria(props.corrector_key).forEach(criterion => {
    commentCriteriaPoints[criterion.key] = {
      key: criterion.key,
      title: criterion.title,
      max_points: criterion.points,
      sum_points: 0
    }
  });

  criteriaStore.getCorrectorGeneralCriteria(props.corrector_key).forEach(criterion => {
    generalCriteriaPoints[criterion.key] = {
      key: criterion.key,
      title: criterion.title,
      max_points: criterion.points,
      sum_points: 0
    }
  });

  pointsStore.getObjectsForCorrector(props['corrector_key']).forEach(points => {
    if (commentCriteriaPoints[points.criterion_key] !== undefined) {
      commentCriteriaPoints[points.criterion_key].sum_points += points.points;
    }
    if (generalCriteriaPoints[points.criterion_key] !== undefined) {
      generalCriteriaPoints[points.criterion_key].sum_points += points.points;
    }
  });
}

if (criteriaStore.getCorrectorHasCriteria(props.corrector_key)) {
  loadCriteria();
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

async function filterByPoints() {
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
        <th>{{ $t('summaryCriteriaMarkings') }}</th>
        <th class="text-right">{{ $t('summaryCriteriaNumber') }}</th>
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

    <!-- Points for comments directly -->
    <v-table v-if="!criteriaStore.getCorrectorHasCommentCriteria(props.corrector_key)" class="table" density="compact">
      <thead>
      <tr>
        <th><strong>{{ $t('summaryCriteriaRating') }}</strong></th>
        <th class="text-right">{{ $t('allPoints') }}</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>
          <v-btn density="compact" size="small" variant="text" prepend-icon="mdi-filter-outline"
                 :disabled="pointsStore.getSumOfPointsForCorrector(props.corrector_key, true, false) == 0"
                 @click="filterByPoints()">
            <span class="sr-only">{{ $t('summaryCriteriaPointsInComments') }}</span>
          </v-btn>
          <span aria-hidden="true">{{ $t('summaryCriteriaPointsInComments') }}</span>
        </td>
        <td class="text-right">
          {{ pointsStore.getSumOfPointsForCorrector(props.corrector_key, true, false) }}
        </td>
      </tr>
      </tbody>
    </v-table>

    <!-- Points for criteria in comments -->
    <v-table v-if="criteriaStore.getCorrectorHasCommentCriteria(props.corrector_key)" class="table" density="compact">
      <thead>
      <tr>
        <th>{{ $t('Kriterium bei Anmerkungen') }}</th>
        <th class="text-right">{{ $t('summaryCriteriaPointsOfMax') }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="criterion in commentCriteriaPoints" :key="criterion.key">
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
      </tbody>
    </v-table>

    <!-- Points for general criteria -->
    <v-table v-if="criteriaStore.getCorrectorHasGeneralCriteria(props.corrector_key)" class="table" density="compact">
      <thead>
      <tr>
        <th>{{ $t('summaryCriteriaGeneralCriteria') }}</th>
        <th class="text-right">{{ $t('summaryCriteriaPointsOfMax') }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="criterion in generalCriteriaPoints" :key="criterion.key">
        <td>
          <span class="generalCriterion">{{ criterion.title }}</span>
        </td>
        <td class="text-right">{{ criterion.sum_points }} / {{ criterion.max_points }}</td>
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

.generalCriterion {
  margin-left: 50px;
}
</style>

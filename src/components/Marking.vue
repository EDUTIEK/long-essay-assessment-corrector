<script setup>
import MarkingComments from "@/components/MarkingComments.vue";
import MarkingPoints from "@/components/MarkingPoints.vue";
import OwnSummaryText from "@/components/OwnSummaryText.vue";

import { useApiStore } from '@/store/api';
import { useLayoutStore } from "@/store/layout";
import { useCriteriaStore } from '@/store/criteria';
import { useSummariesStore } from '@/store/summaries';

const apiStore = useApiStore();
const layoutStore = useLayoutStore();
const criteriaStore = useCriteriaStore();
const summariesStore = useSummariesStore();

function markingCommentsShown() {
  return layoutStore.showMarkingComments && (!apiStore.isForReviewOrStitch || summariesStore.isOneAuthorized)
}

function markingPointsShown() {
  return layoutStore.showMarkingPoints && criteriaStore.hasAnyCriteria && (!apiStore.isForReviewOrStitch || summariesStore.isOneAuthorized)
}

function markingTextShown() {
  return layoutStore.showMarkingText && (!apiStore.isForReviewOrStitch || summariesStore.isOneAuthorized)
}

function expansionClass() {
  const sum = (markingCommentsShown() ? 1 : 0) + (markingPointsShown() ? 1 : 0) + (markingTextShown() ? 1 : 0);
  switch (sum) {
    case 0:
      return 'hidden';
    case 1:
      return 'full';
    case 2:
      return 'half';
    case 3:
      return 'third';
  }
}

</script>

<template>
  <div id="app-marking-wrapper">
    <div v-if="markingCommentsShown()" :class="expansionClass()">
      <h2 class="headline">Anmerkungen</h2>
      <marking-comments class="content"></marking-comments>
    </div>

    <div v-if="markingPointsShown()" :class="expansionClass()">
      <h2 class="headline">Bewertung</h2>
      <marking-points class="content"></marking-points>
    </div>

    <!-- v-if neeed to avoid simultaneous data binding with summary text  -->
    <div v-if="markingTextShown()" :class="expansionClass()">
      <h2 class="headline">Gutachten</h2>
      <own-summary-text class="content" :editorId="'marking'"></own-summary-text>
    </div>

    <div v-if="apiStore.isForReviewOrStitch && !summariesStore.isOneAuthorized">
      Für diese Abgabe ist noch keine Korrektur autorisiert.
    </div>
  </div>
</template>

<style scoped>

#app-marking-wrapper {
  height: 100%;
}

.headline {
  font-size: 1rem;
  font-weight: normal;
  height: 40px;
  padding-top: 10px;
  padding-left: 10px;
  background-color: #f0f0f0;
}

.content {
  height: calc(100% - 40px);
  overflow-y: scroll;
}

.hidden {
  display: none;
}

.full {
  height: 100%;
}

.half {
  height: 50%;
}

.third {
  height: 33%;
}

</style>

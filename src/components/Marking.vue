<script setup>
import MarkingComments from "@/components/MarkingComments.vue";
import MarkingCommentCriteria from "@/components/MarkingCommentCriteria.vue";
import MarkingGeneralCriteria from "@/components/MarkingGeneralCriteria.vue";
import OwnSummaryText from "@/components/OwnSummaryText.vue";
import SumOfPoints from "@/components/SumOfPoints.vue";

import { useApiStore } from '@/store/api';
import { useLayoutStore } from "@/store/layout";
import { useCommentsStore } from "@/store/comments";
import { useCriteriaStore } from '@/store/criteria';
import { useSummariesStore } from '@/store/summaries';

const apiStore = useApiStore();
const layoutStore = useLayoutStore();
const commentsStore = useCommentsStore();
const criteriaStore = useCriteriaStore();
const summariesStore = useSummariesStore();

function markingCommentsShown() {
  return layoutStore.showMarkingComments && (!apiStore.isForReviewOrStitch || summariesStore.isOneAuthorized)
}

function markingGeneralCriteriaShown() {
  return layoutStore.showMarkingGeneralCriteria && criteriaStore.hasOwnGeneralCriteria && (!apiStore.isForReviewOrStitch || summariesStore.isOneAuthorized)
}

function markingCommentCriteriaShown() {
  return layoutStore.showMarkingCommentCriteria && criteriaStore.hasCommentCriteria && (!apiStore.isForReviewOrStitch || summariesStore.isOneAuthorized)
}

function markingTextShown() {
  return layoutStore.showMarkingText && (!apiStore.isForReviewOrStitch || summariesStore.isOneAuthorized)
}

function expansionClass() {
  const sum = (markingCommentsShown() ? 1 : 0)
      + (markingGeneralCriteriaShown() ? 1 : 0)
      + (markingCommentCriteriaShown() ? 1 : 0)
      + (markingTextShown() ? 1 : 0);
  switch (sum) {
    case 0:
      return 'hidden';
    case 1:
      return 'full';
    case 2:
      return 'half';
    case 3:
      return 'third';
    case 4:
      return 'quart';
  }
}

</script>

<template>
  <div id="app-marking-wrapper">
    <div v-if="markingCommentsShown()" :class="expansionClass()">
      <h2 class="headline">{{ $t('allComments') }}</h2>
      <marking-comments class="content"></marking-comments>
    </div>

    <div v-if="markingCommentCriteriaShown()" :class="expansionClass()">
      <h2 class="headline">{{ $t('allPartialPointsLong') }}<span v-show="commentsStore.selectedKey != ''"
                                                          class="commentLabel">{{ commentsStore.selectedLabel }}</span> </h2>
      <marking-comment-criteria class="content"></marking-comment-criteria>
    </div>


    <div v-if="markingGeneralCriteriaShown()" :class="expansionClass()">
      <h2 class="headline">{{ $t('allGeneralPointsLong') }}</h2>
      <marking-general-criteria class="content"></marking-general-criteria>
    </div>

    <!-- v-if neeed to avoid simultaneous data binding with summary text  -->
    <div v-if="markingTextShown()" :class="expansionClass()">
      <h2 class="headline">{{ $t('allOwnSummary') }}</h2>
      <own-summary-text class="content" :editorId="'marking'"></own-summary-text>
    </div>

    <div v-if="apiStore.isForReviewOrStitch && !summariesStore.isOneAuthorized">
      {{ $t('allEssayNoCorrectionAuthorized') }}
    </div>
    <sum-of-points class='sumOfPoints' :corrector_key="apiStore.correctorKey"></sum-of-points>
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
  width: 100%;
}

.commentLabel {
  display: inline-block;
  background-color: #606060;
  color: white;
  padding: 3px;
  font-size: 14px;
  border-radius: 5px;
  position:relative;
  top: -2px;
  margin-left: 10px;
}

.content {
  height: calc(100% - 40px);
  overflow-y: scroll;
}

.hidden {
  display: none;
}

.full {
  height: 100% - 30px;
}

.half {
  height: calc((100% - 40px) / 2);
}

.third {
  height: calc((100% - 40px) / 3);
}

.quart {
  height: calc((100% - 40px) / 4);
}

.sumOfPoints {
  position: absolute;
  bottom: 0;
  color: #555555;
  padding: 10px;
  height: 40px;
}

</style>

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

const props = defineProps(['pointsExpansion', 'textExpansion']);

function expansionClass(expansion) {
  switch (expansion) {
    case 0: return 'hidden';
    case 1: return 'full';
    default: return 'half';
  }
}

</script>

<template>
    <div id="app-marking-wrapper">
        <marking-comments  v-if="!apiStore.isForReviewOrStitch || summariesStore.isOneAuthorized" id="app-marking-comments"></marking-comments>
        <div  v-if="!apiStore.isForReviewOrStitch || summariesStore.isOneAuthorized" v-show="criteriaStore.hasAnyCriteria && layoutStore.isMarkingPointsExpanded" :class="expansionClass(props.pointsExpansion)">
          <marking-points id="app-marking-points"></marking-points>
        </div>
        <div  v-if="!apiStore.isForReviewOrStitch && layoutStore.isMarkingTextExpanded" :class="expansionClass(props.textExpansion)">
          <own-summary-text :editorId="'marking'"></own-summary-text>
        </div><!-- v-if neeed to avoid simultaneous data binding with summary text  -->
        <div v-if="apiStore.isForReviewOrStitch && !summariesStore.isOneAuthorized">
        Für diese Abgabe ist noch keine Korrektur autorisiert.
      </div>
    </div>
</template>

<style scoped>

#app-marking-wrapper {
    height: 100%;
  display: flex;
    flex-direction: column;
}

#app-marking-comments {
    flex-grow: 1;
    overflow-y: scroll;
}

#app-marking-points {
    height:100%;
    overflow-y: scroll;
}


.hidden {
  display: none;
}

.full {
  min-height: 100%;
}

.half {
  min-height: 50%;
}


</style>

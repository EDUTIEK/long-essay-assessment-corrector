<script setup>
import MarkingComments from "@/components/MarkingComments.vue";
import MarkingPoints from "@/components/MarkingPoints.vue";
import OwnSummaryText from "@/components/OwnSummaryText.vue";

import { useLayoutStore } from "@/store/layout";
import { useCriteriaStore } from '@/store/criteria';

const layoutStore = useLayoutStore();
const criteriaStore = useCriteriaStore();

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
        <marking-comments id="app-marking-comments"></marking-comments>
        <div v-show="criteriaStore.hasOwnCriteria && layoutStore.isMarkingPointsExpanded" :class="expansionClass(props.pointsExpansion)">
          <marking-points id="app-marking-points"></marking-points>
        </div>
        <div v-if="layoutStore.isMarkingTextExpanded" :class="expansionClass(props.textExpansion)">
          <own-summary-text :editorId="'marking'"></own-summary-text>
        </div><!-- v-if neeed to avoid simulaneous data binding with summary text  -->
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

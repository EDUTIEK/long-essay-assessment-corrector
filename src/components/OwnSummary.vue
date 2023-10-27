<script setup>
import SummaryCriteria from '@/components/SummaryCriteria.vue';
import OwnSummaryPoints from "@/components/OwnSummaryPoints.vue";
import OwnSummaryText from "@/components/OwnSummaryText.vue";

import {useApiStore} from "@/store/api";
const apiStore = useApiStore();

const props = defineProps(['textExpansion']);

function expansionClass(expansion) {
  switch (expansion) {
    case 0: return 'hidden';
    case 1: return 'full';
    default: return 'half';
  }
}

</script>

<template>
    <div id="app-own-summary-wrapper">
        <summary-criteria id="app-own-summary-criteria" :corrector_key="apiStore.correctorKey"></summary-criteria>
        <div :class="expansionClass(props.textExpansion)">
          <own-summary-text :editorId="'summary'"></own-summary-text>
        </div>
        <own-summary-points id="app-own-summary-points"></own-summary-points>
    </div>
</template>

<style scoped>

#app-own-summary-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
}

#app-own-summary-criteria {
    flex-grow: 1;
    overflow-y: scroll;
}

#app-own-summary-points {
    min-height: 50px;
}

.hidden {
  display: none;
}

.full {
  min-height: calc(100% - 50px);
}

.half {
  min-height: 50%;
}



</style>

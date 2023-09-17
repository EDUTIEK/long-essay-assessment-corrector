<script setup>
import SummaryCriteria from '@/components/SummaryCriteria.vue';
import SummaryPoints from "@/components/SummaryPoints.vue";
import SummaryText from "@/components/SummaryText.vue";

import { useCorrectorsStore } from '@/store/correctors';
const correctorsStore = useCorrectorsStore();

const props = defineProps(['corrector_key', 'textExpansion']);

function textExpansionClass() {
  switch (props.textExpansion) {
    case 0: return 'hidden';
    case 1: return 'full';
    default: return 'half';
  }
}
</script>

<template>
    <div id="app-other-summary-wrapper">
        <summary-criteria id="app-other-summary-criteria" :corrector_key="props.corrector_key"></summary-criteria>
      <div :class="textExpansionClass()">  
        <summary-text :corrector_key="props.corrector_key"></summary-text>
      </div>  
      <summary-points id="app-summary-points" :corrector_key="props.corrector_key"></summary-points>
    </div>
</template>

<style scoped>

#app-other-summary-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
}

#app-other-summary-criteria {
    flex-grow: 1;
    overflow-y: scroll;
}

#app-summary-points {
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

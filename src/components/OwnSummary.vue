<script setup>
import SummaryCriteria from '@/components/SummaryCriteria.vue';
import OwnSummaryPoints from "@/components/OwnSummaryPoints.vue";
import OwnSummaryText from "@/components/OwnSummaryText.vue";

import { useApiStore } from "@/store/api";

const apiStore = useApiStore();

const props = defineProps(['showCriteria', 'showText']);

function expansionClass() {
  const sum = (props.showCriteria ? 1 : 0) + (props.showText ? 1 : 0);
  switch (sum) {
    case 0:
      return 'hidden';
    case 1:
      return 'full';
    case 2:
      return 'half';
  }
}

</script>

<template>
  <div id="app-own-summary-wrapper">
    <div v-if="props.showCriteria" :class="expansionClass()">
      <div class="headline">Übersicht</div>
      <summary-criteria class="content" :corrector_key="apiStore.correctorKey"></summary-criteria>
    </div>
    <div v-if="props.showText" :class="expansionClass()">
      <div class="headline">Gutachten</div>
      <own-summary-text class="content" :editorId="'summary'"></own-summary-text>
    </div>
    <div id="app-own-summary-points">
      <div class="headline">Gesamtbewertung</div>
      <own-summary-points class="content"></own-summary-points>
    </div>
  </div>
</template>

<style scoped>

#app-own-summary-wrapper {
  height: 100%;
}

#app-own-summary-points {
  height: 100px;
}

.headline {
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
  height: calc(100% - 100px);
}

.half {
  height: calc((100% - 100px) / 2);
}


</style>

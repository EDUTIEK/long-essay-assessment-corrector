<script setup>

import { useSummariesStore } from '@/store/summaries';
import { reactive } from 'vue';
const summariesStore = useSummariesStore();

const props = defineProps(['corrector_key']);

function text() {
    let summary = summariesStore.getForCorrector(props.corrector_key);
    if (summary) {
        return summary.text;
    }
}
</script>



<template>
  <div class="headline">Gutachten</div>
  <div class="app-summary-text-wrapper">
    <div class="app-summary-text-display long-essay-content headlines-three" v-html="text()">
    </div>
  </div>
</template>

<style scoped>

.headline {
  font-weight: bold;
  height: 40px;
  padding-top: 10px;
}

.app-summary-text-wrapper {
    height: calc(100% - 40px);
    border: 1px solid #cccccc;
    padding: 10px;
    overflow-y: scroll;
}

.app-summary-text-display {
    height:100%;
}

</style>

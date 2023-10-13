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
  <div class="app-summary-text-wrapper">
    <div class="app-summary-text-display" v-html="text()">
    </div>
  </div>
</template>

<style scoped>

.app-summary-text-wrapper {
    height:100%;
    border: 1px solid #cccccc;
    padding: 10px;
    overflow-y: scroll;
}

.app-summary-text-display {
    height:100%;
    font-family: Serif;
    font-size: 16px;

}

</style>

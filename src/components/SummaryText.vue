<script setup>

import { useCorrectorsStore } from '@/store/correctors';
import { reactive } from 'vue';
const correctorsStore = useCorrectorsStore();

const props = defineProps(['corrector_key']);

function text() {
    let corrector = correctorsStore.getCorrector(props.corrector_key);
    if (corrector) {
        return corrector.text;
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
    heigh:100%;
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

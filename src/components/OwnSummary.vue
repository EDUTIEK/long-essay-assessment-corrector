<script setup>
import SummaryCriteria from '@/components/SummaryCriteria.vue';
import OwnSummaryPoints from "@/components/OwnSummaryPoints.vue";
import OwnSummaryText from "@/components/OwnSummaryText.vue";

import {useApiStore} from "@/store/api";
import {useLayoutStore} from "../store/layout";
const apiStore = useApiStore();
const layoutStore = useLayoutStore();

</script>

<template>
    <div id="app-own-summary-wrapper">
        <summary-criteria id="app-own-summary-criteria" :corrector_key="apiStore.correctorKey"></summary-criteria>
        <own-summary-text id="app-own-summary-text" v-if="layoutStore.isSummaryTextExpanded"></own-summary-text>
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

#app-own-summary-text {
    height: 50%;
}

</style>

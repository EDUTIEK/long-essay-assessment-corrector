<script setup>
import SummaryCriteria from '@/components/SummaryCriteria.vue';
import OwnSummaryPoints from "@/components/OwnSummaryPoints.vue";
import OwnSummaryText from "@/components/OwnSummaryText.vue";
import SummaryText from '@/components/SummaryText.vue';

import {useApiStore} from "@/store/api";
import {useLayoutStore} from "../store/layout";
import { useSummaryStore } from '@/store/summary';
const apiStore = useApiStore();
const layoutStore = useLayoutStore();
const summaryStore = useSummaryStore();

const props = defineProps(['isTextExpanded']);


</script>

<template>
    <div id="app-own-summary-wrapper">
        <summary-criteria id="app-own-summary-criteria" :corrector_key="apiStore.correctorKey"></summary-criteria>
        <own-summary-text id="app-own-summary-text" v-if="props.isTextExpanded && !summaryStore.isAuthorized"></own-summary-text>
        <summary-text id="app-own-summary-text" v-if="props.isTextExpanded && summaryStore.isAuthorized"></summary-text>
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


#app-own-summary-text {
    height: 50%;
}

#app-own-summary-points {
    min-height: 50px;
}

</style>

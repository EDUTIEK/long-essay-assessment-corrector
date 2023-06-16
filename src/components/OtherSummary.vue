<script setup>
import SummaryCriteria from '@/components/SummaryCriteria.vue';
import SummaryPoints from "@/components/SummaryPoints.vue";
import SummaryText from "@/components/SummaryText.vue";

import { useCorrectorsStore } from '@/store/correctors';
import {useLayoutStore} from "../store/layout";
const correctorsStore = useCorrectorsStore();
const layoutStore = useLayoutStore();

</script>

<template>
    <div id="app-other-summary-wrapper">
        <summary-criteria id="app-other-summary-criteria" :corrector_key="correctorsStore.activeKey"></summary-criteria>
        <summary-text id="app-other-summary-text" :corrector_key="correctorsStore.activeKey" v-if="layoutStore.isOtherSummaryTextExpanded"></summary-text>
        <summary-points id="app-summary-points" :corrector_key="correctorsStore.activeKey"></summary-points>

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

#app-other-summary-text {
    height: 50%;
}

#app-other-summary-points {
    min-height: 50px;
}


</style>

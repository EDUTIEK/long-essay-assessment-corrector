<script setup>
import OwnSummaryPoints from "@/components/OwnSummaryPoints.vue";
import OwnSummaryText from "@/components/OwnSummaryText.vue";

import {useLayoutStore} from "../store/layout";
const layoutStore = useLayoutStore();

</script>

<template>
    <div id="app-own-summary-wrapper">
        <own-summary-points id="app-own-summary-points"></own-summary-points>
        <own-summary-text id="app-own-summary-text" v-show="layoutStore.isSummaryTextExpanded"></own-summary-text>
    </div>
</template>

<style scoped>

#app-own-summary-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
}

#app-own-summary-points {
    flex-grow: 1;
    overflow-y: scroll;
}

#app-own-summary-text {
    height: 50%;
}

</style>

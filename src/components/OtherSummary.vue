<script setup>
import SummaryCriteria from '@/components/SummaryCriteria.vue';
import SummaryPoints from "@/components/SummaryPoints.vue";
import SummaryText from "@/components/SummaryText.vue";
import { useSummariesStore } from '@/store/summaries';
import OwnSummaryPoints from '@/components/OwnSummaryPoints.vue';
import OwnSummaryText from '@/components/OwnSummaryText.vue';

const props = defineProps(['corrector_key', 'showCriteria', 'showText']);
const summariesStore = useSummariesStore();

function expansionClass() {
    const sum = (props.showCriteria ? 1 : 0) + (props.showText ? 1 : 0) ;
    switch (sum) {
        case 0: return 'hidden';
        case 1: return 'full';
        case 2: return 'half';
    }
}
</script>

<template>
    <div id="app-other-summary-wrapper">

        <div v-if="props.showCriteria && summariesStore.getAuthorizationForCorrector(props.corrector_key)" :class="expansionClass()">
            <div class="headline">Übersicht</div>
            <summary-criteria class="content" :corrector_key="props.corrector_key"></summary-criteria>
        </div>
        <div v-if="props.showText && summariesStore.getAuthorizationForCorrector(props.corrector_key)" :class="expansionClass()">
            <div class="headline">Gutachten</div>
            <summary-text class="content" :corrector_key="props.corrector_key"></summary-text>
        </div>
        <div v-if="summariesStore.getAuthorizationForCorrector(props.corrector_key)">
            <div class="headline">Gesamtbewertung</div>
            <summary-points class="content" :corrector_key="props.corrector_key"></summary-points>
        </div>

        <div v-if="!summariesStore.getAuthorizationForCorrector(props.corrector_key)">
            Diese Korrektur ist noch nicht autorisiert.
        </div>
    </div>
</template>

<style scoped>

#app-other-summary-wrapper {
    height: 100%;
}
#app-summary-points {
    min-height: 100px;
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

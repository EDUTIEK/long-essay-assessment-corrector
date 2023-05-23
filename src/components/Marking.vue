<script setup>
import MarkingComments from "@/components/MarkingComments.vue";
import MarkingPoints from "@/components/MarkingPoints.vue";
import {useLayoutStore} from "../store/layout";
const layoutStore = useLayoutStore();

</script>

<template>
    <div class="appMarkingWrapper">
        <marking-comments class="appMarkingComments"></marking-comments>
        <marking-points class="appMarkingPoints" v-show="layoutStore.isPointsExpanded"></marking-points>

    </div>
</template>

<style scoped   >

.appMarkingWrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.appMarkingComments {
    flex-grow: 1;
    overflow-y: scroll;
}

.appMarkingPoints {
    height: 50%;
}

</style>

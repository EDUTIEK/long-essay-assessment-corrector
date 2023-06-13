<script setup>
import MarkingComments from "@/components/MarkingComments.vue";
import MarkingPoints from "@/components/MarkingPoints.vue";
import {useLayoutStore} from "../store/layout";
const layoutStore = useLayoutStore();

</script>

<template>
    <div id="app-marking-wrapper">
        <marking-comments id="app-marking-comments"></marking-comments>
        <marking-points id="app-marking-points" v-show="layoutStore.isMarkingPointsExpanded"></marking-points>
    </div>
</template>

<style scoped>

#app-marking-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
}

#app-marking-comments {
    flex-grow: 1;
    overflow-y: scroll;
}

#app-marking-points {
    height: 50%;
    overflow-y: scroll;
}

</style>

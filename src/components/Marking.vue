<script setup>
import MarkingComments from "@/components/MarkingComments.vue";
import MarkingPoints from "@/components/MarkingPoints.vue";
import {useLayoutStore} from "../store/layout";
import { useCriteriaStore } from '@/store/criteria';

const layoutStore = useLayoutStore();
const criteriaStore = useCriteriaStore();

const props = defineProps(['textExpansion']);

function textExpansionClass() {
  switch (props.textExpansion) {
    case 0: return 'hidden';
    case 1: return 'full';
    default: return 'half';
  }
}

</script>

<template>
    <div id="app-marking-wrapper">
        <marking-comments id="app-marking-comments"></marking-comments>
        <div :class="textExpansionClass()">
          <marking-points id="app-marking-points" v-show="criteriaStore.hasOwnCriteria && layoutStore.isMarkingPointsExpanded"></marking-points>
        </div>
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
    height:100%;
    overflow-y: scroll;
}


.hidden {
  display: none;
}

.full {
  min-height: 100%;
}

.half {
  min-height: 50%;
}


</style>

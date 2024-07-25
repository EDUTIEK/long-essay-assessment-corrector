<script setup>
import {useCriteriaStore} from "@/store/criteria";
import {useCommentsStore} from "@/store/comments";
import {usePointsStore} from "@/store/points";
import {useApiStore} from "@/store/api";
import {useSummariesStore} from '@/store/summaries';
import { ref, watch, nextTick} from 'vue';
import TextMarker from '@/lib/TextMarker';

const criteriaStore = useCriteriaStore();
const commentsStore = useCommentsStore();
const pointsStore = usePointsStore();
const apiStore = useApiStore();
const summariesStore = useSummariesStore();

let corrector_key = ref('');
let criteriaPoints = ref({});

async function loadPoints() {
    const comment = commentsStore.getComment(commentsStore.selectedKey);
    corrector_key.value = comment ? comment.corrector_key :  '';

    criteriaPoints.value = {};
    for (const criterion of criteriaStore.getCorrectorCriteria(corrector_key.value)) {
      criteriaPoints.value[criterion.key] = pointsStore.getValueByRelation(commentsStore.selectedKey, criterion.key);
    }
}
watch(() => commentsStore.selectionChange, loadPoints);


function savePoints(criterionKey) {
    pointsStore.setValueByRelation(commentsStore.selectedKey, criterionKey, criteriaPoints.value[criterionKey]);
}

</script>


<template>
    <div class="appMarkingPointsWrapper">
        <hr>
        <v-table density="compact">
            <thead>
            <tr>
                <th class="text-left">
                    Bewertungskriterien <span class="commentLabel" v-show="commentsStore.selectedKey != ''">{{commentsStore.selectedLabel}}</span>
                </th>
                <th class="text-right">
                    Punkte / max
                </th>
            </tr>
            </thead>
            <tbody>
                <tr v-for="criterion in criteriaStore.getCorrectorCriteria(corrector_key)" :key="criterion.key">
                    <td class="text-rigth">
                        <label :for="'pointsInput' + criterion.key">{{ criterion.title}}</label>
                    </td>
                    <td  class="text-right">
                        <input class="appPoints" type="number" min="0" v-model="criteriaPoints[criterion.key]"
                               :disabled="summariesStore.isOwnDisabled || corrector_key != apiStore.correctorKey"
                               :max="criterion.points"
                               @change="savePoints(criterion.key)"
                        /> / {{criterion.points}}
                    </td>
                </tr>
            </tbody>
        </v-table>
     </div>
</template>

<style scoped>

th, td {
  font-size: 14px;
}

.commentLabel {
    background-color: grey;
    color: white;
    padding: 3px;
    font-size: 14px;
}

.appPoints {
    width: 4em;
    border: 0;
    margin-left: 5px;
    margin-right: 5px;
    padding: 5px;
}

</style>

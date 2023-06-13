<script setup>
import {useCriteriaStore} from "@/store/criteria";
import {useCommentsStore} from "@/store/comments";
import {usePointsStore} from "@/store/points";
import {useApiStore} from "@/store/api";
import { watch} from 'vue';
import TextMarker from '@/lib/TextMarker';

const criteriaStore = useCriteriaStore();
const commentsStore = useCommentsStore();
const pointsStore = usePointsStore();
const apiStore = useApiStore();

function loadPoints() {
    console.log('loadPoints');
    let commentKey = commentsStore.selectedKey;
    let comment = commentsStore.getComment(commentKey);
    criteriaStore.getCriteria.forEach((criterion) => {
        let value = pointsStore.getValueByRelation(commentKey, criterion.key);
        let el = document.getElementById('pointsInput' + criterion.key);
        el.value = value;
        if (!comment || comment.corrector_key != apiStore.userKey) {
            el.setAttribute('disabled', 'disabled');
        }
        else {
            el.removeAttribute('disabled');
        }
    });
}
watch(() => commentsStore.selectedKey, loadPoints);

function savePoints(criterionKey) {
    let commentKey = commentsStore.selectedKey;
    let el = document.getElementById('pointsInput' + criterionKey);
    let value = el.value;
    pointsStore.setValueByRelation(commentKey, criterionKey, value);
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
                <tr v-for="criterion in criteriaStore.getCriteria" :key="criterion.key">
                    <td class="text-rigth">
                        <label :for="'pointsInput' + criterion.key">{{ criterion.title}}</label>
                    </td>
                    <td  class="text-right">
                        <input class="appPoints" type="number" min="0"
                               :id="'pointsInput' + criterion.key"
                               :max="criterion.points"
                               @change="savePoints(criterion.key)" /> / {{criterion.points}}
                    </td>
                </tr>
            </tbody>
        </v-table>
     </div>
</template>

<style scoped>

.commentLabel {
    background-color: grey;
    color: white;
    padding: 3px;
    border: 1px solid lightgrey;
    box-shadow: 1px 1px lightgrey;
    font-size: 12px;
}

.appPoints {
    width: 4em;
    border: 0;
    margin-left: 5px;
    margin-right: 5px;
    padding: 5px;
}

</style>

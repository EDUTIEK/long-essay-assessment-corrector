<script setup>
import {useCriteriaStore} from "@/store/criteria";
import {useCommentsStore} from "@/store/comments";
import {usePointsStore} from "@/store/points";
import {useApiStore} from "@/store/api";
import {useSummaryStore} from '@/store/summary';
import { ref, watch} from 'vue';
import TextMarker from '@/lib/TextMarker';

const criteriaStore = useCriteriaStore();
const commentsStore = useCommentsStore();
const pointsStore = usePointsStore();
const apiStore = useApiStore();
const summaryStore = useSummaryStore();

let corrector_key = ref('');

function loadPoints() {
    const comment = commentsStore.getComment(commentsStore.selectedKey);
    if (comment) {
      corrector_key.value = comment.corrector_key;
    }
    else {
      corrector_key.value = '';
    }

    criteriaStore.getCriteria(corrector_key.value).forEach(criterion => {
      let value = pointsStore.getValueByRelation(commentsStore.selectedKey, criterion.key);
      let el = document.getElementById('pointsInput' + criterion.key);
      if (el !== undefined && el !== null) {
        el.value = value;
        if (corrector_key.value == '' || corrector_key.value != apiStore.correctorKey) {
          el.setAttribute('disabled', 'disabled');
        }
        else {
          el.removeAttribute('disabled');
        }
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
                <tr v-for="criterion in criteriaStore.getCriteria(corrector_key)" :key="criterion.key">
                    <td class="text-rigth">
                        <label :for="'pointsInput' + criterion.key">{{ criterion.title}}</label>
                    </td>
                    <td  class="text-right">
                        <input class="appPoints" type="number" min="0"
                               :disabled="summaryStore.isAuthorized"
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

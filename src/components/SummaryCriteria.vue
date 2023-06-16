<script setup>
import { ref, reactive, watch, nextTick} from 'vue';
import { useApiStore } from '@/store/api';
import {useCriteriaStore} from "@/store/criteria";
import {useCommentsStore} from "@/store/comments";
import {usePointsStore} from "@/store/points";

const apiStore = useApiStore();
const criteriaStore = useCriteriaStore();
const commentsStore = useCommentsStore();
const pointsStore = usePointsStore();

const props = defineProps(['corrector_key']);
watch(() => props, loadCriteria);
watch(() => apiStore.itemKey, loadCriteria);

const criteriaPoints = reactive({});
const criteriaSum = ref(0);
const criteriaMax = ref(0);


async function loadCriteria() {
    await nextTick();

    criteriaSum.value = 0;
    criteriaMax.value = 0;

    criteriaStore.getCriteria.forEach(criterion => {
        criteriaPoints[criterion.key] = {
            key: criterion.key,
            title: criterion.title,
            max_points: criterion.points,
            sum_points: 0
        }
        criteriaMax.value += criterion.points
    })

    pointsStore.getObjectsByCommentKeys(commentsStore.getKeysOfCorrector(props['corrector_key'])).forEach(points => {
        criteriaPoints[points.criterion_key].sum_points += points.points;
        criteriaSum.value += points.points
    });
}

loadCriteria();


</script>

<template>
    <div>
        <v-table class="table" density="compact">
            <thead>
            <tr>
                <th>Markierung</th>
                <th class="text-right">Anzahl</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td><span class="label">Exzellente Stellen</span></td>
                <td class="text-right">{{commentsStore.getCountOfExcellent(props.corrector_key)}}</td>
            </tr>
            <tr>
                <td><span class="label">Kardinalfehler</span></td>
                <td class="text-right">{{commentsStore.getCountOfCardinal(props.corrector_key)}}</td>
            </tr>
            </tbody>
        </v-table>


        <v-table class="table" density="compact">
            <thead>
            <tr>
                <th>Kriterium</th>
                <th class="text-right">Punkte / max</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="criterion in criteriaPoints" :key="criterion.key">
                <td><span class="label">{{ criterion.title}}</span></td>
                <td class="text-right">{{criterion.sum_points}} / {{criterion.max_points}}</td>
            </tr>
            <tr>
                <td><strong class="label">Summe</strong></td>
                <td class="text-right"><strong>{{ criteriaSum }} / {{ criteriaMax }}</strong></td>
            </tr>
            </tbody>
        </v-table>
    </div>
</template>

<style scoped>

.table {
   margin-bottom: 10px;
}
.label {
    display: inline-block;
    margin-left: 20px;
}

td {
    font-size: 14px;
}
</style>

<script setup>

import {useCriteriaStore} from "@/store/criteria";
import {useCommentsStore} from "@/store/comments";
import {usePointsStore} from "@/store/points";

const criteriaStore = useCriteriaStore();
const commentsStore = useCommentsStore();
const pointsStore = usePointsStore();


</script>

<template>
    <div id="app-own-summary-criteria-wrapper">

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
                <td class="text-right"></td>
            </tr>
            <tr>
                <td><span class="label">Kardinalfehler</span></td>
                <td  class="text-right"></td>
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
            <tr v-for="criterion in criteriaStore.getCriteria" :key="criterion.key">
                <td><span class="label">{{ criterion.title}}</span></td>
                <td  class="text-right">{{criterion.points}}</td>
            </tr>
            <tr>
                <td><strong class="label">Summe</strong></td>
                <td></td>
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

<script setup>
import {useCriteriaStore} from "@/store/criteria";
const criteriaStore = useCriteriaStore();

</script>


<template>
    <div class="">
        <h2 class="text-h6">Bewertungen</h2>

        <v-list>
            <v-list-item v-for="criterion in criteriaStore.getCriteria"
                         :key="criterion.key">
                <label for="appPoints">{{ criterion.title}}</label>
                <input id="appPoints" class="appRatingControl" type="number" min="0" :max="criterion.points" />

            </v-list-item>

        </v-list>
    </div>
</template>

<style scoped>

.appRatingControl {
    border: 1px solid lightgray;
    margin-left: 10px;
    margin-right: 10px;
    padding: 5px;
}

</style>

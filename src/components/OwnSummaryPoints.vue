<script setup>

import {useSummaryStore} from '@/store/summary';
import {useSettingsStore} from '@/store/settings';

const summaryStore = useSummaryStore();
const settingsStore = useSettingsStore();

</script>

<template>
    <div id="app-own-summary-points-wrapper">
        <v-container>
            <v-row>
                <v-col>
                    <label for="appSummaryPoints"><strong>Eigene Wertung:</strong></label>
                    <input :disabled="summaryStore.storedIsAuthorized" id="appSummaryPoints" class="appPoints" type="number" min="0" :max="settingsStore.max_points" v-model="summaryStore.currentPoints" /> Punkte
                </v-col>
                <v-col>
                    <strong>Notenstufe:</strong> {{ summaryStore.currentGradeTitle }}
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<style scoped>

.appPoints {
    width: 4em;
    border: 0;
    margin-left: 5px;
    margin-right: 5px;
    padding: 5px;
}
</style>

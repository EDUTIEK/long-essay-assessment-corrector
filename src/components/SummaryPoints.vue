<script setup>
import { ref, reactive, watch, nextTick} from 'vue';
import { useCorrectorsStore } from '@/store/correctors';
import {useSummaryStore} from '@/store/summary';
import {useSettingsStore} from '@/store/settings';
import { useLevelsStore } from '@/store/levels';

const correctorsStore = useCorrectorsStore();
const settingsStore = useSettingsStore();
const levelsStore = useLevelsStore();

const props = defineProps(['corrector_key']);

const points = ref(0);
const grade = ref('');

function load() {
    let corrector = correctorsStore.getCorrector(props.corrector_key);
    if (corrector) {
        points.value = corrector.points;
        let level = levelsStore.getLevel(corrector.grade_key);
        if (level) {
            grade.value = level.title;
        }
    }
}
load();

</script>

<template>
    <div id="app-own-summary-points-wrapper">
        <v-container>
            <v-row>
                <v-col>
                    <label for="appSummaryPoints"><strong>Wertung:</strong></label>
                    <input :disabled="true" id="appSummaryPoints" class="appPoints" type="number" min="0" :max="settingsStore.max_points" v-model="points" /> Punkte
                </v-col>
                <v-col>
                    <strong>Notenstufe:</strong> {{ grade }}
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

<script setup>

import { useApiStore } from '@/store/api';
import {useSummaryStore} from '@/store/summary';
import { useCommentsStore } from '@/store/comments';
import {usePointsStore} from '@/store/points';

const apiStore = useApiStore();
const summaryStore = useSummaryStore();
const commentsStore = useCommentsStore();
const pointsStore = usePointsStore();

function isSent() {
    return summaryStore.openSending == false
    && commentsStore.countUnsentChanges == 0
    && pointsStore.countUnsentChanges == 0
}

</script>

<template>
    <v-app-bar location="bottom" height="48" color="grey-lighten-5" elevation="1">
        Pilot | Letzte Änderung: {{ isSent() ? 'gesendet' : 'nicht  gesendet' }}
        <v-btn :disabled="isSent()" @click="apiStore.saveChangesToBackend()">Senden</v-btn>
    </v-app-bar>
</template>

<style scoped>
.v-toolbar {
    padding-left: 10px;
}
</style>

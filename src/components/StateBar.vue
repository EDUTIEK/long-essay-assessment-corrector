<script setup>

import { useApiStore } from '@/store/api';
import {useSummaryStore} from '@/store/summary';
import { useCommentsStore } from '@/store/comments';

const apiStore = useApiStore();
const summaryStore = useSummaryStore();
const commentsStore = useCommentsStore();

</script>

<template>
    <v-app-bar location="bottom" height="48" color="grey-lighten-5" elevation="1">
        Pilot (alpha) | Letzte Änderung: {{ summaryStore.openSending  || commentsStore.countUnsentChanges > 0 ? 'nicht gesendet' : 'gesendet' }}
        <v-btn @click="apiStore.saveChangesToBackend()">Save Changes</v-btn>
    </v-app-bar>
</template>

<style scoped>
.v-toolbar {
    padding-left: 10px;
}
</style>

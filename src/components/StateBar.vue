<script setup>
  import {useSummaryStore} from '@/store/summary';
  const summaryStore = useSummaryStore();
</script>

<template>
  <v-app-bar location="bottom" height="48" color="grey-lighten-5" elevation="1">
    Pilot (alpha) | Letzte Änderung: {{summaryStore.openSending ? 'nicht gesendet' : 'gesendet'}}
  </v-app-bar>
</template>

<style scoped>
.v-toolbar {
  padding-left: 10px;
}
</style>

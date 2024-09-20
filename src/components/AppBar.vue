<script setup>
/**
 * Application bar
 */
import Items from "@/components/Items.vue";
import StitchDecision from "@/components/StitchDecision.vue";
import Authorization from '@/components/Authorization.vue';
import { useApiStore } from '@/store/api';
import { useTaskStore } from '@/store/task';
import { useChangesStore } from '@/store/changes';

const apiStore = useApiStore();
const taskStore = useTaskStore();
const changesStore = useChangesStore();

async function returnToBackend() {
  if (!(await changesStore.hasChangesInStorage()) || await apiStore.saveChangesToBackend(true)) {
    window.location = apiStore.returnUrl;
  } else {
    apiStore.setShowSendFailure(true);
  }
}

</script>

<template>
  <v-app-bar elevation="1" color="white" density="compact">
    <v-app-bar-title>{{ taskStore.title }}</v-app-bar-title>
    <v-spacer></v-spacer>
    <items/>
    <authorization v-if="!apiStore.isReview && !apiStore.isStitchDecision"/>
    <stitch-decision v-if="apiStore.isStitchDecision"/>
    <v-btn @click="returnToBackend()">
      <v-icon left icon="mdi-logout-variant"></v-icon>
      <span>Korrekturen</span>
    </v-btn>
  </v-app-bar>

</template>

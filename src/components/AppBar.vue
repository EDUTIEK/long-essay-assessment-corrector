<script setup>
/**
 * Application bar
 */
import Items from "@/components/Items.vue";
import StitchDecision from "@/components/StitchDecision.vue";
import Authorization from '@/components/Authorization.vue';
import {useApiStore} from '@/store/api';
import {useChangesStore} from '@/store/changes';
import {useTaskStore} from '@/store/task';


const apiStore = useApiStore();
const changesStore = useChangesStore();
const taskStore = useTaskStore();


async function returnToBackend() {
  
  if (changesStore.countChanges > 0) {
    await apiStore.saveChangesToBackend();
  }
  if (changesStore.countChanges > 0) {
    apiStore.setShowSendFailure(true);
  }
  else {
    window.location = apiStore.returnUrl;
  }
}

</script>

<template>
  <v-app-bar elevation="1" color="white" density="compact" >
    <v-app-bar-title>{{ taskStore.title}}</v-app-bar-title>
    <v-spacer></v-spacer>
    <items />
    <authorization v-if="!apiStore.isReview && !apiStore.isStitchDecision" />
    <stitch-decision v-if="apiStore.isStitchDecision"/>
    <v-btn @click="returnToBackend()">
      <v-icon left icon="mdi-logout-variant"></v-icon>
      <span>Korrekturen</span>
    </v-btn>
  </v-app-bar>

</template>

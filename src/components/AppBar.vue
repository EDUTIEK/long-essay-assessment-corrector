<script setup>
/**
 * Application bar
 */
import Help from "@/components/Help.vue";
import Items from "@/components/Items.vue";
import StitchDecision from "@/components/StitchDecision.vue";
import Authorization from '@/components/Authorization.vue';
import { useApiStore } from '@/store/api';
import { useTaskStore } from '@/store/task';
import { useChangesStore } from '@/store/changes';
import { useLayoutStore } from '@/store/layout';
import { nextTick, watch } from 'vue';

const apiStore = useApiStore();
const taskStore = useTaskStore();
const changesStore = useChangesStore();
const layoutStore = useLayoutStore();

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'header') {
    await nextTick();
    for (const element of document.getElementsByClassName('app-header-item')) {
      if (!element.disabled) {
        element.focus();
        break;
      }
    }
  }
}

watch(() => layoutStore.focusChange, handleFocusChange);


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
    <help></help>
    <authorization v-if="!apiStore.isReview && !apiStore.isStitchDecision"/>
    <stitch-decision v-if="apiStore.isStitchDecision"/>
    <v-btn class="app-header-item" @click="returnToBackend()">
      <v-icon left icon="mdi-logout-variant"></v-icon>
      <span>{{ $t('appBarReturn') }}</span>
    </v-btn>
  </v-app-bar>

</template>

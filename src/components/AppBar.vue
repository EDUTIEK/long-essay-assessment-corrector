<script setup>
/**
 * Application bar
 */
import Help from "@/components/Help.vue";
import Items from "@/components/Items.vue";
import Tasks from "@/components/Tasks.vue";
import {stores} from "@/store";
import { nextTick, watch } from 'vue';

async function handleFocusChange() {
  if (stores.layout().focusTarget == 'header') {
    await nextTick();
    for (const element of document.getElementsByClassName('app-header-item')) {
      if (!element.disabled) {
        element.focus();
        break;
      }
    }
  }
}

watch(() => stores.layout().focusChange, handleFocusChange);


async function returnToBackend() {
  if (stores.changes().countChanges == 0 || await stores.api().saveChangesToBackend(true)) {
    if (stores.config().returnUrl) {
      window.location = stores.config().returnUrl;
    } else {
      stores.api().sendLogout();
    }

  } else {
    stores.layout().showSendFailure = true;
  }
}

</script>

<template>
  <v-app-bar elevation="1" color="white" density="compact">
    <tasks v-if="stores.tasks().countTasks > 1"/>
    <items/>
    <v-spacer></v-spacer>
    <help></help>
    <v-btn class="app-header-item" @click="returnToBackend()">
      <v-icon left icon="mdi-logout-variant"></v-icon>
      <span>{{ $t('appBarReturn') }}</span>
    </v-btn>
  </v-app-bar>

</template>

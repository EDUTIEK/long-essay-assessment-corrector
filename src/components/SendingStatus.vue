<script setup>
import {useApiStore} from "@/store/api";
import {useChangesStore} from "@/store/changes";

const apiStore = useApiStore();
const changesStore = useChangesStore();

function isSent() {
  return changesStore.countChanges == 0;
}

function isSending() {
  return apiStore.lastSendingTry > 0;
}
</script>

<template>
  <v-list tabindex="-1">
    <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                 @click="apiStore.saveChangesToBackend()"
                 :disabled="isSent()"
                 :aria-label="isSending() ? $t('SendingStatusSending') : (isSent() ? $t('SendingStatusSent') : $t('SendingStatusSend'))"
                 :title="isSending() ? $t('SendingStatusSending') : (isSent() ? $t('SendingStatusSent') : $t('SendingStatusSend'))"
                 :ripple="false"
    >
      <template v-slot:prepend>
        <v-icon aria-role="hidden"
                :icon="isSending() ? 'mdi-cloud-upload' : (isSent() ? 'mdi-cloud-check-outline' : 'mdi-cloud-outline')"></v-icon>
      </template>
    </v-list-item>
  </v-list>
</template>

<style scoped>

</style>
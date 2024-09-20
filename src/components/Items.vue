<script setup>
import { useApiStore } from '@/store/api';
import { useItemsStore } from '@/store/items';
import { useSummariesStore } from "@/store/summaries";
import { useEssayStore } from "@/store/essay";
import { useCorrectorsStore } from '@/store/correctors';
import { useChangesStore } from '@/store/changes';
import { nextTick, ref } from 'vue';
import { useLayoutStore } from '@/store/layout';

const apiStore = useApiStore();
const itemsStore = useItemsStore();
const summariesStore = useSummariesStore();
const essayStore = useEssayStore();
const correctorsStore = useCorrectorsStore();
const changesStore = useChangesStore();
const layoutStore = useLayoutStore();

const menuOpen = ref(false);
const selectionShown = ref(false);
const selectedKey = ref('');
const loading = ref(false);


async function showSelection() {
  await nextTick();
  if (menuOpen.value) {
    selectionShown.value = true;
    selectedKey.value = '';
  }
}

async function selectItem() {
  menuOpen.value = false;
  if (!apiStore.isLoading && selectedKey.value != '') {
    changeItem(selectedKey.value);
  }
}

async function changeItem(newKey) {
  if (!apiStore.isLoading) {
    if (!(await changesStore.hasChangesInStorage()) || await apiStore.saveChangesToBackend(true)) {
      await apiStore.loadItemFromBackend(newKey);
    } else {
      apiStore.setShowSendFailure(true);
    }
  }
}


</script>

<template>

  <v-btn :disabled="apiStore.isLoading || apiStore.itemKey == itemsStore.firstKey"
         @click="changeItem(itemsStore.getPreviousKey(apiStore.itemKey))">
    <v-icon left icon="mdi-arrow-left-bold"></v-icon>
  </v-btn>

  <v-btn :disabled="apiStore.isLoading" id="app-items-menu-activator">
      <span v-show="apiStore.isLoading">
        Lade Daten ...
      </span>
    <span v-show="!apiStore.isLoading && itemsStore.currentItem !== undefined">
       {{ itemsStore.currentItem.title }}
        {{ correctorsStore.getPositionText(apiStore.correctorKey) }}
        {{
        apiStore.isForReviewOrStitch
            ? (essayStore.isFinalized ? ' - finalisiert' : ' - offen')
            : (summariesStore.isOwnAuthorized ? ' - autorisiert' : ' - offen')
      }}

      </span>
  </v-btn>

  <v-menu :disabled="apiStore.isLoading" v-model="menuOpen" activator="#app-items-menu-activator"
          :close-on-content-click="false" @update:modelValue="showSelection()">
    <v-autocomplete
        id="app-items-autocomplete"
        v-if="selectionShown"
        v-model="selectedKey"
        :items="itemsStore.items"
        :menu=true
        item-title="title"
        item-value="key"
        autofocus
        auto-select-first
        class="flex-full-width"
        density="comfortable"
        item-props
        menu-icon=""
        placeholder="Teilnehmer/in"
        prepend-inner-icon="mdi-magnify"
        theme="light"
        variant="solo"
        @update:modelValue="selectItem()"
    ></v-autocomplete>
  </v-menu>

  <v-btn :disabled="apiStore.isLoading || apiStore.itemKey == itemsStore.lastKey"
         @click="changeItem(itemsStore.getNextKey(apiStore.itemKey))">
    <v-icon left icon="mdi-arrow-right-bold"></v-icon>
  </v-btn>
</template>


<style scoped>

</style>

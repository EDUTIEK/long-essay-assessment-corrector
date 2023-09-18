<script setup>
  import {useApiStore} from '@/store/api';
  import {useItemsStore} from '@/store/items';
  import {useSummaryStore} from "@/store/summary";
  import {useEssayStore} from "@/store/essay";
  import {ref, nextTick} from 'vue';

  const apiStore = useApiStore();
  const itemsStore = useItemsStore();
  const summaryStore = useSummaryStore();
  const essayStore = useEssayStore();

  const menuOpen = ref(false);
  const selectionShown=ref(false);
  const selectedKey=ref('');
  const loading=ref(false);


  async function showSelection() {
    await nextTick();
    if (menuOpen.value) {
      console.log('menu is open');
      selectionShown.value=true;
      selectedKey.value='';
    }
  }

  async function previousItem(key) {
    loading.value = true;
    if (!summaryStore.isSent) {
      await summaryStore.sendUpdate(true);
    }
    if (!summaryStore.isSent) {
      apiStore.setShowSendFailure(true);
    }
    else {
      let newKey = itemsStore.previousKey(key);
      await apiStore.loadItemFromBackend(newKey);
    }
    loading.value = false;
  }

  async function nextItem(key) {
    loading.value = true;
    if (!summaryStore.isSent) {
      await summaryStore.sendUpdate(true);
    }
    if (!summaryStore.isSent) {
      apiStore.setShowSendFailure(true);
    }
    else {
      let newKey = itemsStore.nextKey(key);
      await apiStore.loadItemFromBackend(newKey);
    }
    loading.value = false;
  }

  async function selectItem() {
    menuOpen.value=false;
    if (selectedKey.value != '') {
      loading.value = true;
      if (!summaryStore.isSent) {
        await summaryStore.sendUpdate(true);
      }
      if (!summaryStore.isSent) {
        apiStore.setShowSendFailure(true);
      }
      else {
        await apiStore.loadItemFromBackend(selectedKey.value);
      }
      loading.value = false;
    }
  }

</script>

<template>
  
   <v-btn :disabled="apiStore.itemKey == itemsStore.firstKey" @click="previousItem(apiStore.itemKey)">
     <v-icon left icon="mdi-arrow-left-bold"></v-icon>
   </v-btn>
  
    <v-btn id="app-items-menu-activator">
      <span v-show="loading">
        Lade Daten ...
      </span>
      <span v-show="!loading">
       {{ itemsStore.getItem(apiStore.itemKey).title }}
        {{ apiStore.isForReviewOrStitch
          ? (essayStore.isFinalized ? ' - finalisiert' : ' - offen')
          : (summaryStore.isAuthorized ? ' - autorisiert' : ' - offen')}}

      </span>
    </v-btn>

  <v-menu v-model="menuOpen" activator="#app-items-menu-activator" :close-on-content-click="false" @update:modelValue="showSelection()">
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
  
   <v-btn :disabled="apiStore.itemKey == itemsStore.lastKey" @click="nextItem(apiStore.itemKey)">
     <v-icon left icon="mdi-arrow-right-bold"></v-icon>
   </v-btn>
</template>


<style scoped>

</style>

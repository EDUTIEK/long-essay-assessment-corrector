<script setup>
  import { useApiStore } from '@/store/api';
  import { useItemsStore } from '@/store/items';
  import { useSummariesStore } from "@/store/summaries";
  import { useEssayStore } from "@/store/essay";
  import { useCorrectorsStore } from '@/store/correctors';
  import { ref, nextTick } from 'vue';

  const apiStore = useApiStore();
  const itemsStore = useItemsStore();
  const summariesStore = useSummariesStore();
  const essayStore = useEssayStore();
  const correctorsStore = useCorrectorsStore();

  const menuOpen = ref(false);
  const selectionShown=ref(false);
  const selectedKey=ref('');
  const loading=ref(false);


  async function showSelection() {
    await nextTick();
    if (menuOpen.value) {
      selectionShown.value=true;
      selectedKey.value='';
    }
  }

  async function selectItem() {
    menuOpen.value=false;
    if (selectedKey.value != '') {
      changeItem(selectedKey.value);
    }
  }
  
  async function changeItem(newKey) {
    loading.value = true;
    if (await apiStore.saveChangesToBackend(true)) {
      await apiStore.loadItemFromBackend(newKey);
    }
    else {
      apiStore.setShowSendFailure(true);
    }
    loading.value = false;
  }



</script>

<template>
  
   <v-btn :disabled="apiStore.itemKey == itemsStore.firstKey" @click="changeItem(itemsStore.getPreviousKey(apiStore.itemKey))">
     <v-icon left icon="mdi-arrow-left-bold"></v-icon>
   </v-btn>
  
    <v-btn id="app-items-menu-activator">
      <span v-if="loading">
        Lade Daten ...
      </span>
      <span v-if="!loading && itemsStore.currentItem !== undefined">
       {{ itemsStore.currentItem.title }}
        {{ correctorsStore.getPositionText(apiStore.correctorKey) }}
        {{ apiStore.isForReviewOrStitch
          ? (essayStore.isFinalized ? ' - finalisiert' : ' - offen')
          : (summariesStore.isOwnAuthorized ? ' - autorisiert' : ' - offen')}}

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
  
   <v-btn :disabled="apiStore.itemKey == itemsStore.lastKey" @click="changeItem(itemsStore.getNextKey(apiStore.itemKey))">
     <v-icon left icon="mdi-arrow-right-bold"></v-icon>
   </v-btn>
</template>


<style scoped>

</style>

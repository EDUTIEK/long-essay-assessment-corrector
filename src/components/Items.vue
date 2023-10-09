<script setup>
  import { useApiStore } from '@/store/api';
  import { useItemsStore } from '@/store/items';
  import { useSummariesStore } from "@/store/summaries";
  import { useEssayStore } from "@/store/essay";
  import { useChangesStore } from '@/store/changes';
  import { ref, nextTick } from 'vue';

  const apiStore = useApiStore();
  const itemsStore = useItemsStore();
  const summariesStore = useSummariesStore();
  const essayStore = useEssayStore();
  const changesStore = useChangesStore();

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

  async function selectItem() {
    menuOpen.value=false;
    if (selectedKey.value != '') {
      changeItem(selectedKey.value);
    }
  }
  
  async function changeItem(newKey) {
    loading.value = true;
    await apiStore.saveChangesToBackend();
    if (changesStore.countChanges > 0) {
      apiStore.setShowSendFailure(true);
    }
    else {
      await apiStore.loadItemFromBackend(newKey);
    }
    loading.value = false;
  }



</script>

<template>
  
   <v-btn :disabled="apiStore.itemKey == itemsStore.firstKey" @click="changeItem(itemsStore.previousKey(apiStore.itemKey))">
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
  
   <v-btn :disabled="apiStore.itemKey == itemsStore.lastKey" @click="changeItem(itemsStore.nextKey(apiStore.itemKey))">
     <v-icon left icon="mdi-arrow-right-bold"></v-icon>
   </v-btn>
</template>


<style scoped>

</style>

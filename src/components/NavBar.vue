<script setup>
import { useApiStore } from '@/store/api';
import { useLayoutStore } from "@/store/layout";
import { useResourcesStore } from "@/store/resources";
import { useCorrectorsStore } from "@/store/correctors";
import { useTaskStore } from '@/store/task';
import { useChangesStore } from '@/store/changes';

const apiStore = useApiStore();
const layoutStore = useLayoutStore();
const resourcesStore = useResourcesStore();
const correctorsStore = useCorrectorsStore();
const taskStore = useTaskStore();
const changesStore = useChangesStore();

function isSent() {
  return changesStore.countChanges == 0;
}

function isSending() {
  return apiStore.lastSendingTry > 0;
}

function openNavigation() {
  document.getElementById('app-navigation-drawer').dispatchEvent(new Event('mouseenter'));
}

function closeNavigation() {
  document.getElementById('app-navigation-drawer').dispatchEvent(new Event('mouseleave'));
}

function selectResource(resource) {
  if (resource.type == 'url') {
    window.open(resource.source, 'long-essay-writer-resource-' + resource.key)
  } else {
    resourcesStore.selectResource(resource);
    layoutStore.showResources();
  }
}

function selectCorrector(corrector) {
  layoutStore.selectCorrector(corrector.corrector_key);
}

function getResourceIcon(resource) {
  switch (resource.type) {
    case "url":
      return (resourcesStore.getResourceIsActive(resource) && layoutStore.isResourcesVisible) ? "mdi-file-link" : "mdi-file-link-outline"
    default:
      return (resourcesStore.getResourceIsActive(resource) && layoutStore.isResourcesVisible) ? "mdi-file" : "mdi-file-outline"
  }
}

function getCorrectorIcon(corrector) {
  return (layoutStore.getCorrectorIsVisible(corrector.corrector_key)) ? "mdi-account-school" : "mdi-account-school-outline"
}


</script>

<template>
  <v-navigation-drawer id="app-navigation-drawer" elevation="2" width="500" permanent rail expand-on-hover>

    <v-list>
      <v-list-item v-show="taskStore.hasInstructions" @click="layoutStore.showInstructions(); closeNavigation();"
                   :prepend-icon="layoutStore.isInstructionsVisible ? 'mdi-text-box': 'mdi-text-box-outline'"
                   title="Aufgabenstellung">
      </v-list-item>

      <v-list-item v-show="resourcesStore.hasInstruction" @click="layoutStore.showInstructionsPdf(); closeNavigation();"
                   :prepend-icon="layoutStore.isInstructionsPdfVisible ? 'mdi-text-box': 'mdi-text-box-outline'"
                   title="Aufgabenstellung (PDF)">
      </v-list-item>


      <v-list-item v-show="taskStore.hasSolution" @click="layoutStore.showSolution(); closeNavigation();"
                   :prepend-icon="layoutStore.isSolutionVisible ? 'mdi-text-box-check': 'mdi-text-box-check-outline'"
                   title="Lösungshinweise">
      </v-list-item>

      <v-list-item v-show="resourcesStore.hasSolution" @click="layoutStore.showSolutionPdf(); closeNavigation();"
                   :prepend-icon="layoutStore.isSolutionPdfVisible ? 'mdi-text-box-check': 'mdi-text-box-check-outline'"
                   title="Lösungshinweise (PDF)">
      </v-list-item>

      <v-divider class="border-opacity-75"></v-divider>

      <v-list-group v-show="resourcesStore.hasFileOrUrlResources">
        <template v-slot:activator="{ props }">
          <v-list-item active-class="appNavActive" v-bind="props"
                       @mouseenter="openNavigation()"
                       :prepend-icon="layoutStore.isResourcesVisible ? 'mdi-book-open' : 'mdi-book-open-outline'"
                       title="Material">
          </v-list-item>
        </template>

        <v-list-item v-for="resource in resourcesStore.fileOrUrlResources"
                     @click="selectResource(resource); closeNavigation();"
                     :prepend-icon="getResourceIcon(resource)"
                     :title="resource.title"
                     :key="resource.key">
        </v-list-item>

      </v-list-group>

      <v-divider class="border-opacity-75"></v-divider>

      <v-list-item @click="layoutStore.showEssay(); closeNavigation();"
                   :prepend-icon="layoutStore.isEssayVisible ? 'mdi-file': 'mdi-file-outline'"
                   title="Abgegebener Text">
      </v-list-item>


      <v-list-item @click="layoutStore.showMarking(); closeNavigation();"
                   :prepend-icon="layoutStore.isMarkingVisible ? 'mdi-comment-edit': 'mdi-comment-edit-outline'"
                   title="Korrektur">
      </v-list-item>

      <v-divider class="border-opacity-75"></v-divider>

      <v-list-item v-for="corrector in correctorsStore.otherCorrectors"
                   @click="selectCorrector(corrector); closeNavigation();"
                   :prepend-icon="getCorrectorIcon(corrector)"
                   :title="corrector.title + ' - ' + corrector.initials + ' ' + correctorsStore.getPositionText(corrector.corrector_key)"
                   :key="corrector.corrector_key">
      </v-list-item>


      <v-list-item v-if="!apiStore.isForReviewOrStitch" @click="layoutStore.showSummary();  closeNavigation();"
                   :prepend-icon="layoutStore.isSummaryVisible ? 'mdi-file-edit': 'mdi-file-edit-outline'"
                   title="Gesamteindruck">
      </v-list-item>

      <v-divider class="border-opacity-75"></v-divider>


    </v-list>

    <template v-slot:append>
      <v-list>
        <v-list-item
            :disabled="isSent()"
            :prepend-icon="isSending() ? 'mdi-cloud-upload' : (isSent() ? 'mdi-cloud-check-outline' : 'mdi-cloud-outline')"
            :title="isSending() ? 'Änderungen werden gesendet' : (isSent() ? 'Alles gesendet' : 'Letzte Änderung senden')"
            @click="apiStore.saveChangesToBackend()"></v-list-item>
      </v-list>
    </template>


  </v-navigation-drawer>
</template>

<style scoped>

.v-list {
  overflow-x: hidden;
  background-color: #fafafa;
}

/* avoid highlight, when selected, see also App.vue */
.v-list-item, v-list-group {
  color: #000000 !important;
}

</style>

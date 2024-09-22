<script setup>
import { useApiStore } from '@/store/api';
import { useLayoutStore } from "@/store/layout";
import { useResourcesStore } from "@/store/resources";
import { useCorrectorsStore } from "@/store/correctors";
import { useTaskStore } from '@/store/task';
import { useChangesStore } from '@/store/changes';
import { nextTick, watch } from 'vue';

const apiStore = useApiStore();
const layoutStore = useLayoutStore();
const resourcesStore = useResourcesStore();
const correctorsStore = useCorrectorsStore();
const taskStore = useTaskStore();
const changesStore = useChangesStore();

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'navigation') {
    await nextTick();
    for (const element of document.getElementsByClassName('app-navigation-item')) {
      element.focus();
      break;
    }
  }
}
watch(() => layoutStore.focusChange, handleFocusChange);

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

function handleKey(event) {
  if (event.keyCode == 27) {
    closeNavigation();
  } else {
    layoutStore.handleKeyDown(event);
  }
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

function getCorrectorTitle(corrector) {
  return (corrector.title + ' - ' + corrector.initials + ' ' + correctorsStore.getPositionText(corrector.corrector_key))
    + (layoutStore.getCorrectorIsVisible(corrector.corrector_key) ? ' (ausgewählt)' : '');
}

function getCorrectorIcon(corrector) {
  return (layoutStore.getCorrectorIsVisible(corrector.corrector_key) ? "mdi-account-school" : "mdi-account-school-outline");
}


</script>

<template>
  <v-navigation-drawer id="app-navigation-drawer" elevation="2" width="500" permanent rail expand-on-hover
                       @focusin="openNavigation"
                       @focusout="closeNavigation"
                       @keydown="handleKey"
  >
    <!--
      Put list items instead of the whole list in the tab sequence
      https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
    -->
    <v-list tabindex="-1">
      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-show="taskStore.hasInstructions"
                   @click="closeNavigation; layoutStore.showInstructions();"
                   :aria-label="'Aufgabenstellung' + layoutStore.isInstructionsVisible ? ', ist ausgewählt' : ''"
                   :title="'Aufgabenstellung' + (layoutStore.isInstructionsVisible ? ' (ausgewählt)' : '')"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.isInstructionsVisible ? 'mdi-text-box': 'mdi-text-box-outline'"></v-icon>
        </template>
      </v-list-item>

      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-show="resourcesStore.hasInstruction"
                   @click="closeNavigation; layoutStore.showInstructionsPdf();"
                   :aria-label="'Aufgabenstellung als PDF' + (layoutStore.isInstructionsPdfVisible ? ', ist ausgewählt' : '')"
                   :title="'Aufgabenstellung als PDF' + (layoutStore.isInstructionsPdfVisible ? ' (ausgewählt)' : '')"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.isInstructionsPdfVisible ? 'mdi-text-box': 'mdi-text-box-outline'"></v-icon>
        </template>
      </v-list-item>


      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-show="taskStore.hasSolution"
                   @click="closeNavigation; layoutStore.showSolution();"
                   :aria-label="'Lösungshinweise' + (layoutStore.isSolutionVisible ? ', ist ausgewählt' : '')"
                   :title="'Lösungshinweise' + (layoutStore.isSolutionVisible ? ' (ausgewählt)' : '')"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.isSolutionVisible ? 'mdi-text-box-check': 'mdi-text-box-check-outline'"></v-icon>
        </template>
      </v-list-item>

      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-show="resourcesStore.hasSolution"
                   @click="closeNavigation; layoutStore.showSolutionPdf();"
                   :aria-label="'Lösungshinweise als PDF' + (layoutStore.isSolutionPdfVisible ? ', ist ausgewählt' : '')"
                   :title="'Lösungshinweise als PDF' + (layoutStore.isSolutionPdfVisible ? ' (ausgewählt)' : '')"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.isSolutionPdfVisible ? 'mdi-text-box-check': 'mdi-text-box-check-outline'"></v-icon>
        </template>
      </v-list-item>

      <v-divider class="border-opacity-75"></v-divider>

      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-for="resource in resourcesStore.fileOrUrlResources"
                   @click="closeNavigation; selectResource(resource);"
                   :aria-label="resource.title + (resourcesStore.getResourceIsActive(resource) && layoutStore.isResourcesVisible ? ', ist ausgewählt' : '')"
                   :title="resource.title + (resourcesStore.getResourceIsActive(resource) && layoutStore.isResourcesVisible ? ' (ausgewählt)' : '')"
                   :key="resource.key"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="getResourceIcon(resource)"></v-icon>
        </template>
      </v-list-item>

      <v-divider class="border-opacity-75"></v-divider>

      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   @click="closeNavigation; layoutStore.showEssay();"
                   :aria-label="'Abgegebener Text' + (layoutStore.isEssayVisible ? ', ist ausgewählt' : '')"
                   :title="'Abgegebener Text' + (layoutStore.isEssayVisible ? ' (ausgewählt)' : '')"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.isEssayVisible ? 'mdi-comment-edit': 'mdi-comment-edit-outline'"></v-icon>
        </template>
      </v-list-item>


      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   @click="closeNavigation; layoutStore.showMarking();"
                   :aria-label="'Korrektur' + (layoutStore.isMarkingVisible ? ', ist ausgewählt' : '')"
                   :title="'Korrektur' + (layoutStore.isMarkingVisible ? ' (ausgewählt)' : '')"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.isMarkingVisible ? 'mdi-comment-edit': 'mdi-comment-edit-outline'"></v-icon>
        </template>
      </v-list-item>

      <v-divider class="border-opacity-75"></v-divider>

      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-for="corrector in correctorsStore.otherCorrectors"
                   @click="closeNavigation; selectCorrector(corrector);"
                   :aria-label="getCorrectorTitle(corrector) + (layoutStore.getCorrectorIsVisible(corrector.corrector_key) ? ', ist ausgewählt' : '')"
                   :title="getCorrectorTitle(corrector) + (layoutStore.getCorrectorIsVisible(corrector.corrector_key) ? ' (ausgewählt)' : '')"
                   :key="corrector.corrector_key"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="getCorrectorIcon(corrector)"></v-icon>
        </template>
      </v-list-item>

      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-if="!apiStore.isForReviewOrStitch"
                   @click="closeNavigation; layoutStore.showSummary();"
                   :aria-label="'Gesamteindruck' + (layoutStore.isSummaryVisible ? ', ist ausgewählt' : '')"
                   :title="'Gesamteindruck' + (layoutStore.isSummaryVisible ? ' (ausgewählt)' : '')"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.isSummaryVisible ? 'mdi-file-edit': 'mdi-file-edit-outline'"></v-icon>
        </template>
      </v-list-item>

      <v-divider class="border-opacity-75"></v-divider>
    </v-list>

    <template v-slot:append>
      <v-list tabindex="-1">
        <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                     @click="closeNavigation; apiStore.saveChangesToBackend()"
                     :disabled="isSent()"
                     :aria-label="isSending() ? 'Änderungen werden gesendet' : (isSent() ? 'Alles gesendet' : 'Letzte Änderung senden')"
                     :title="isSending() ? 'Änderungen werden gesendet' : (isSent() ? 'Alles gesendet' : 'Letzte Änderung senden')"
                     :ripple="false"
        >
          <template v-slot:prepend>
            <v-icon aria-role="hidden"
                    :icon="isSending() ? 'mdi-cloud-upload' : (isSent() ? 'mdi-cloud-check-outline' : 'mdi-cloud-outline')"></v-icon>
          </template>
        </v-list-item>
      </v-list>
    </template>


  </v-navigation-drawer>
</template>

<style scoped>

.v-list {
  overflow-x: hidden;
  background-color: #fafafa;
}

.v-list-item {
  background-color: #fafafa !important;
}
</style>

<script setup>

import { useApiStore } from '@/store/api';
import { useItemsStore } from '@/store/items';
import { useSummariesStore } from '@/store/summaries';
import { useSettingsStore } from '@/store/settings';
import { useLayoutStore} from "@/store/layout";
import OwnSummaryIncludes from '@/components/OwnSummaryIncludes.vue';
import SumOfPoints from "@/components/SumOfPoints.vue";

const apiStore = useApiStore();
const itemsStore = useItemsStore();
const summariesStore = useSummariesStore();
const settingsStore = useSettingsStore();
const layoutStore = useLayoutStore();

</script>

<template>
  <div id="app-own-summary-points-wrapper">
    <v-container>
      <v-row dense>
        <v-col cols="10">
          <sum-of-points class='sumOfPoints' :corrector_key="apiStore.correctorKey"></sum-of-points>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col cols="10">
          <label for="appOwnSummaryPoints"><strong>{{ $t('OwnSummaryPointsRating') }}</strong></label>
          &nbsp;
          <input :disabled="summariesStore.isOwnDisabled" id="appOwnSummaryPoints" class="appPoints" type="number" min="0"
                 :max="settingsStore.max_points" v-model="summariesStore.editSummary.points"/> {{ $t('allPoints') }}
          &nbsp;
          <strong>{{ $t('OwnSummaryPointsGrade') }}</strong> {{ summariesStore.currentGradeTitle }}
        </v-col>
        <v-col cols="2">
          <v-btn density="compact" variant="text" v-show="!summariesStore.isOwnDisabled" :disabled="!itemsStore.authorizationAllowed"
                 @click="apiStore.setShowAuthorization(true)">
            <v-icon left icon="mdi-file-certificate-outline"></v-icon>
            <span>{{ $t('allAuthorize') }}</span>
          </v-btn>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col cols="10">
          <own-summary-includes v-if="settingsStore.inclusionsPossible"></own-summary-includes>
        </v-col>
        <v-col cols="2">
          <v-btn density="compact" v-if="settingsStore.inclusionsChangeable" variant="text" :disabled="summariesStore.isOwnDisabled"
                 @click="layoutStore.showIncludesPopup = true">
            <v-icon left icon="mdi-pencil"></v-icon>
            <span>{{ $t('allChange') }}</span>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>



  </div>
</template>

<style scoped>

.appPoints {
  width: 4em;
}
</style>

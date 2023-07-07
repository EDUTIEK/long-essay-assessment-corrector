<script setup>
  import Instructions from "@/components/Instructions.vue";
  import Resources from "@/components/Resources.vue";
  import Essay from "@/components/Essay.vue";
  import OwnSummary from "@/components/OwnSummary.vue";
  import OtherSummary from '@/components/OtherSummary.vue';
  import Marking from "@/components/Marking.vue";
  import {useApiStore} from "../store/api";
  import {useLayoutStore} from "../store/layout";
  import {useResourcesStore} from "../store/resources";
  import { useCommentsStore } from '@/store/comments';
  import { useCriteriaStore} from '@/store/criteria';

  const apiStore = useApiStore();
  const layoutStore = useLayoutStore();
  const resourcesStore = useResourcesStore();
  const commentsStore = useCommentsStore();
  const criteriaStore = useCriteriaStore();

</script>

<template>
  <v-main fill-height>
    <div class="container">

      <!--
        Left Column
      -->
      <div  class="column" :class="{ colExpanded: layoutStore.isLeftExpanded, colNormal: !layoutStore.isLeftExpanded}" v-show="layoutStore.isLeftVisible">
        <!-- Header -->
        <div class="col-header">
            <h2 class="text-h6">{{
                    layoutStore.isInstructionsVisible ? "Aufgabenstellung"
                        : layoutStore.isEssayVisible ? "Abgegebener Text"
                            : layoutStore.isResourcesVisible ? resourcesStore.activeTitle
                                : layoutStore.isLeftCorrectorVisible ? layoutStore.leftCorrectorTitle : ""
                }}
            </h2>
        </div>
        <!-- Content -->
        <div class="col-content">
          <instructions v-if="layoutStore.isInstructionsVisible" />
          <essay v-if="layoutStore.isEssayVisible" />
          <resources v-if="layoutStore.isResourcesVisible" />
          <other-summary v-if= "layoutStore.isLeftCorrectorVisible" :corrector_key="layoutStore.leftCorrectorKey" :isTextExpanded="layoutStore.isLeftSummaryTextExpanded" />
        </div>
        <!--Footer -->
        <div class="col-footer text-right" :class="{ footerExpanded: layoutStore.isLeftExpanded, footerNormal: !layoutStore.isLeftExpanded}" >
            <!-- toggle left summary text  -->
            <v-btn class="ma-2" v-show="layoutStore.isLeftCorrectorVisible" @click="layoutStore.setLeftSummaryTextExpanded(!layoutStore.isLeftSummaryTextExpanded)">
                <v-icon :icon="layoutStore.isLeftSummaryTextExpanded ? 'mdi-chevron-down' : 'mdi-chevron-up'"></v-icon>
                <span>Zusammenfassung</span>
            </v-btn>
            <!-- expand right column -->
          <v-btn class="ma-2" @click="layoutStore.setLeftExpanded(false)" v-show="layoutStore.isLeftExpanded">
            <v-icon icon="mdi-chevron-left"></v-icon>
              <span> {{
                      layoutStore.isMarkingSelected ? "Anmerkungen"
                          : layoutStore.isSummarySelected ? "Gesamteindruck"
                              : layoutStore.isRightCorrectorSelected ? layoutStore.rightCorrectorTitle : ""
                  }}
            </span>
          </v-btn>
          <!-- expand left column -->
          <v-btn class="ma-2" @click="layoutStore.setLeftExpanded(true)" v-show="!layoutStore.isLeftExpanded">
            <span>Erweitern</span>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </v-btn>
        </div>
      </div>

        <!--
            Right Column
        -->
        <div class="column" :class="{ colExpanded: layoutStore.isRightExpanded, colNormal: !layoutStore.isRightExpanded}" v-show="layoutStore.isRightVisible" >
          <!-- Header -->
          <div class="col-header">
              <h2 class="text-h6"> {{
                      layoutStore.isMarkingVisible ? "Anmerkungen"
                          : layoutStore.isSummaryVisible ? "Eigener Gesamteindruck"
                              : layoutStore.isRightCorrectorVisible ? layoutStore.rightCorrectorTitle : ""
                  }}
                  <!-- show other correctors -->
                  <v-btn variant="plain" v-if="layoutStore.isMarkingVisible"
                         @click="commentsStore.setShowOtherCorrectors(!commentsStore.isOtherCorrectorsShown)">
                      <v-icon :icon="commentsStore.isOtherCorrectorsShown ? 'mdi-account-school' : 'mdi-account-school-outline'"></v-icon>
                  </v-btn>

                  <!-- reset comments filter -->
                  <v-btn variant="plain" v-if="layoutStore.isMarkingVisible"
                         :disabled="!commentsStore.isFilterActive"
                         @click="commentsStore.resetFilter()">
                      <v-icon :icon="commentsStore.isFilterActive ? 'mdi-filter' : 'mdi-filter-outline'"></v-icon>
                  </v-btn>
              </h2>

          </div>
        <!-- Content -->
        <div class="col-content">
          <own-summary v-if="layoutStore.isSummaryVisible" :isTextExpanded="layoutStore.isRightSummaryTextExpanded"/>
          <other-summary v-if= "layoutStore.isRightCorrectorVisible" :corrector_key="layoutStore.rightCorrectorKey" :isTextExpanded="layoutStore.isRightSummaryTextExpanded" />
          <marking v-show="layoutStore.isMarkingVisible"/> <!-- v-show neeed to keep points displayed when switching right content) -->
        </div>
        <!-- Footer -->
        <div class="col-footer text-left" :class="{ footerExpanded: layoutStore.isRightExpanded, footerNormal: !layoutStore.isRightExpanded}">
          <!-- expand right column -->
          <v-btn class="ma-2" @click="layoutStore.setRightExpanded(true)" v-show="!layoutStore.isRightExpanded">
            <v-icon icon="mdi-chevron-left"></v-icon>
            <span>Erweitern</span>
          </v-btn>
          <!-- expand left column -->
          <v-btn class="ma-2" @click="layoutStore.setRightExpanded(false)" v-show="layoutStore.isRightExpanded">
              <span> {{
                      layoutStore.isInstructionsSelected ? "Aufgabenstellung"
                          : layoutStore.isEssaySelected ? "Abgegebener Text"
                              : layoutStore.isResourcesSelected ? resourcesStore.activeTitle
                                  : layoutStore.isLeftCorrectorSelected ? layoutStore.leftCorrectorTitle : ""
                  }}
              </span>
                <v-icon icon="mdi-chevron-right"></v-icon>
          </v-btn>
          <!-- toggle marking points -->
          <v-btn class="ma-2" v-show=" criteriaStore.hasCriteria && layoutStore.isMarkingVisible" @click="layoutStore.setMarkingPointsExpanded(!layoutStore.isMarkingPointsExpanded)">
                <v-icon :icon="layoutStore.isMarkingPointsExpanded ? 'mdi-chevron-down' : 'mdi-chevron-up'"></v-icon>
                <span>Bewertungen</span>
          </v-btn>
          <!-- toggle right summary text  -->
          <v-btn class="ma-2" v-show="layoutStore.isSummaryVisible || layoutStore.isRightCorrectorVisible" @click="layoutStore.setRightSummaryTextExpanded(!layoutStore.isRightSummaryTextExpanded)">
              <v-icon :icon="layoutStore.isRightSummaryTextExpanded ? 'mdi-chevron-down' : 'mdi-chevron-up'"></v-icon>
              <span>Zusammenfassung</span>
          </v-btn>
        </div>
      </div>
    </div>
  </v-main>


  <v-dialog persistent v-model="apiStore.showSendFailure">
    <v-card>
      <v-card-text>
        <p>Ihre letzen Änderungen zu dieser Korrektur konnten nicht übertragen werden, sind aber lokal gespeichert.</p>
        <p>Sie können diese Meldung schließen und warten bis Ihre Änderungen wieder automatisch gespeichert werden (Siehe Seitenfuß).</p>
        <p>Alternativ können Sie die Korrektur jetzt abbrechen und später wieder aufrufen, um die Änderungen nachträglich zu speichern.</p>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="apiStore.setShowSendFailure(false)">
          <v-icon left icon="mdi-close"></v-icon>
          <span>Meldung schließen</span>
        </v-btn>
        <v-btn :href="apiStore.returnUrl">
          <v-icon left icon="mdi-logout-variant"></v-icon>
          <span>Korrektur abbrechen</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>


</template>

<style scoped>

/* Structure */

.container {
  position: fixed;
  height: calc((100% - 50px) - 50px);
  width: calc(100% - 72px);
  display: flex;
}

.column {
  flex: 1;
}

.col-header {
  height: 50px;
  width: 100%;
  padding:10px;
}

.col-content {
  height: calc(((100% - 50px)) - 70px);
  background-color: white;
  overflow: hidden;
  width: 100%;
  padding:10px;
}

.col-footer {
  position: fixed;
  bottom: 48px;
  padding:20px;
}

/* Dynamic Properties */

.colNormal {
  width: 50%;
}

.colExpanded {
  width: 100%;
}

.footerNormal {
  width: calc(50% - 50px);
}
.footerExpanded {
  width: calc(100% - 100px);
}


</style>

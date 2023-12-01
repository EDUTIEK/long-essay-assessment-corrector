<script setup>
  import Instructions from "@/components/Instructions.vue";
  import InstructionsPdf from '@/components/InstructionsPdf.vue';
  import Solution from '@/components/Solution.vue';
  import SolutionPdf from '@/components/SolutionPdf.vue';
  import Resources from "@/components/Resources.vue";
  import Essay from "@/components/Essay.vue";
  import EssayImage from '@/components/EssayImage.vue';
  import OwnSummary from "@/components/OwnSummary.vue";
  import OtherSummary from '@/components/OtherSummary.vue';
  import Marking from "@/components/Marking.vue";
  import { useApiStore } from "@/store/api";
  import { useLayoutStore } from "@/store/layout";
  import { useResourcesStore} from "@/store/resources";
  import { useCommentsStore } from '@/store/comments';
  import { useCriteriaStore} from '@/store/criteria';
  import { usePagesStore } from '@/store/pages';

  const apiStore = useApiStore();
  const layoutStore = useLayoutStore();
  const resourcesStore = useResourcesStore();
  const commentsStore = useCommentsStore();
  const criteriaStore = useCriteriaStore();
  const pagesStore = usePagesStore();

</script>

<template>
  <v-main fill-height>
    <div id="app-main-container">

      <!--
        Left Column
      -->
      <div  class="column" :class="{ colExpanded: layoutStore.isLeftExpanded, colNormal: !layoutStore.isLeftExpanded}" v-show="layoutStore.isLeftVisible">
        <!-- Header -->
        <div class="col-header">
            <span class="headline">{{
                    layoutStore.isInstructionsVisible ? "Aufgabenstellung"
                        : layoutStore.isInstructionsPdfVisible ? "Aufgabenstellung (PDF)"
                            : layoutStore.isSolutionVisible ? "Lösungshinweise"
                                : layoutStore.isSolutionPdfVisible ? "Lösungshinweise (PDF)"
                                    : layoutStore.isEssayVisible ? "Abgegebener Text"
                                            : layoutStore.isResourcesVisible ? resourcesStore.activeTitle
                                                : layoutStore.isLeftCorrectorVisible ? layoutStore.leftCorrectorTitle : ""
                }}
            </span>
            <v-btn-group density="comfortable">
              <!-- toggle left summary text  -->
              <v-btn size="x-small" v-show="layoutStore.isLeftCorrectorVisible" @click="layoutStore.changeLeftSummaryTextExpansion()">
                <v-icon icon="mdi-arrow-up-down"></v-icon>
                <span>Abschlussvotum</span>
              </v-btn>
              <!-- expand right column -->
              <v-btn size="x-small" @click="layoutStore.setLeftExpanded(false)" v-show="layoutStore.isLeftExpanded">
                <v-icon icon="mdi-chevron-left"></v-icon>
                <span> {{
                    layoutStore.isMarkingSelected ? "Anmerkungen"
                        : layoutStore.isSummarySelected ? "Gesamteindruck"
                            : layoutStore.isRightCorrectorSelected ? layoutStore.rightCorrectorTitle : ""
                  }}
                </span>
              </v-btn>
              <!-- expand left column -->
              <v-btn size="x-small" @click="layoutStore.setLeftExpanded(true)" v-show="!layoutStore.isLeftExpanded">
                <span>Erweitern</span>
                <v-icon icon="mdi-chevron-right"></v-icon>
              </v-btn>
              
            </v-btn-group>
        </div>
        <!-- Content -->
        <div class="col-content">
          <instructions v-if="layoutStore.isInstructionsVisible" />
          <instructions-pdf v-if="layoutStore.isInstructionsPdfVisible" />
          <solution v-if="layoutStore.isSolutionVisible" />
          <solution-pdf v-if="layoutStore.isSolutionPdfVisible" />
          <essay v-if="layoutStore.isEssayVisible && !pagesStore.hasPages" />
          <essay-image v-if="layoutStore.isEssayVisible && pagesStore.hasPages" />
          <resources v-if="layoutStore.isResourcesVisible" />
          <other-summary v-if= "layoutStore.isLeftCorrectorVisible" :corrector_key="layoutStore.leftCorrectorKey" :textExpansion="layoutStore.leftSummaryTextExpansion" />
        </div>
      </div>

        <!--
            Right Column
        -->
        <div class="column" :class="{ colExpanded: layoutStore.isRightExpanded, colNormal: !layoutStore.isRightExpanded}" v-show="layoutStore.isRightVisible" >
          <!-- Header -->
          <div class="col-header">
            <span class="headline"> {{
                      layoutStore.isMarkingVisible ? "Anmerkungen"
                          : layoutStore.isSummaryVisible ? "Eigener Gesamteindruck"
                              : layoutStore.isRightCorrectorVisible ? layoutStore.rightCorrectorTitle : ""
                  }}
            </span>

            <v-btn-group density="comfortable">
              
              <!-- show points and ratings in comments -->
              <v-btn  size="x-small" variant="plain" v-if="layoutStore.isMarkingVisible"
                      @click="commentsStore.setShowPointsAndRatings(!commentsStore.isPointsAndRatingsShown)">
                <v-icon :icon="commentsStore.isPointsAndRatingsShown ? 'mdi-check-bold' : 'mdi-check-outline'"></v-icon>
              </v-btn>
              
              <!-- show other correctors -->
              <v-btn  size="x-small" variant="plain" v-if="layoutStore.isMarkingVisible"
                     @click="commentsStore.setShowOtherCorrectors(!commentsStore.isOtherCorrectorsShown)">
                <v-icon :icon="commentsStore.isOtherCorrectorsShown ? 'mdi-account-school' : 'mdi-account-school-outline'"></v-icon>
              </v-btn>
              
              <!-- reset comments filter -->
              <v-btn  size="x-small" variant="plain" v-if="layoutStore.isMarkingVisible"
                     :disabled="!commentsStore.isFilterActive"
                     @click="commentsStore.resetFilter()">
                <v-icon :icon="commentsStore.isFilterActive ? 'mdi-filter' : 'mdi-filter-outline'"></v-icon>
              </v-btn>
              
              <!-- toggle marking points -->
              <v-btn size="x-small" v-show="criteriaStore.hasAnyCriteria && layoutStore.isMarkingVisible" @click="layoutStore.changeMarkingPointsExpansion()">
                <v-icon icon="mdi-arrow-up-down"></v-icon>
                <span>Bewertungen</span>
              </v-btn>
              
              <!-- toggle marking text -->
              <v-btn size="x-small" v-show="!apiStore.isForReviewOrStitch && layoutStore.isMarkingVisible" @click="layoutStore.changeMarkingTextExpansion()">
                <v-icon icon="mdi-arrow-up-down"></v-icon>
                <span>Abschlussvotum</span>
              </v-btn>


              <!-- toggle right summary text  -->
              <v-btn size="x-small" v-show="layoutStore.isSummaryVisible || layoutStore.isRightCorrectorVisible" @click="layoutStore.changeRightSummaryTextExpansion()">
                <v-icon icon="mdi-arrow-up-down"></v-icon>
                <span>Abschlussvotum</span>
              </v-btn>

              <!-- expand left column -->
              <v-btn size="x-small" @click="layoutStore.setRightExpanded(false)" v-show="layoutStore.isRightExpanded">
                <span> {{
                    layoutStore.isInstructionsSelected ? "Aufgabenstellung"
                        : layoutStore.isEssaySelected ? "Abgegebener Text"
                            : layoutStore.isResourcesSelected ? resourcesStore.activeTitle
                                : layoutStore.isLeftCorrectorSelected ? layoutStore.leftCorrectorTitle : ""
                  }}
                </span>
                <v-icon icon="mdi-chevron-right"></v-icon>
              </v-btn>

              <!-- expand right column -->
              <v-btn size="x-small" @click="layoutStore.setRightExpanded(true)" v-show="!layoutStore.isRightExpanded">
                <v-icon icon="mdi-chevron-left"></v-icon>
                <span>Erweitern</span>
              </v-btn>
              
            </v-btn-group>
          </div>
        <!-- Content -->
        <div class="col-content">
          <own-summary v-if="layoutStore.isSummaryVisible" :textExpansion="layoutStore.rightSummaryTextExpansion"/>
          <other-summary v-if= "layoutStore.isRightCorrectorVisible" :corrector_key="layoutStore.rightCorrectorKey" :textExpansion="layoutStore.rightSummaryTextExpansion" />
          <marking v-show="layoutStore.isMarkingVisible" 
                   :pointsExpansion="layoutStore.markingPointsExpansion"
                   :textExpansion="layoutStore.markingTextExpansion"
          /> <!-- v-show neeed to keep points displayed when switching right content) -->
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

#app-main-container {
  position: fixed;
  height: calc(100% - 50px);
  width: calc(100% - 72px);

  display: flex;
  flex-direction: row;

}

.column {
  height:100%;
  display: flex;
  flex-direction: column;
}

.col-header {
  min-height: 40px;
  width: 100%;
  padding:10px;
}

.col-content {
  flex-grow: 1;
  background-color: white;
  width: 100%;
  padding:10px;
  overflow-y: hidden;
}

.headline {
  font-weight: bold;
}

.v-btn-group {
  margin-top: -6px;
  float: right;
}

/* Dynamic Properties */

.colNormal {
  width: 50%;
}

.colExpanded {
  width: 100%;
}


</style>

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
import Snippets from "@/components/Snippets.vue";
import { useApiStore } from "@/store/api";
import { useLayoutStore } from "@/store/layout";
import { useResourcesStore } from "@/store/resources";
import { useCommentsStore } from '@/store/comments';
import { useCriteriaStore } from '@/store/criteria';
import { usePagesStore } from '@/store/pages';
import { nextTick, watch } from 'vue';

const apiStore = useApiStore();
const layoutStore = useLayoutStore();
const resourcesStore = useResourcesStore();
const commentsStore = useCommentsStore();
const criteriaStore = useCriteriaStore();
const pagesStore = usePagesStore();

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'appHeadLeft') {
    await nextTick();
    document.getElementById('appHeadLeft').focus();
  }
  if (layoutStore.focusTarget == 'appHeadRight') {
    await nextTick();
    document.getElementById('appHeadRight').focus();
  }
}

watch(() => layoutStore.focusChange, handleFocusChange);

//Enable keyboard hotkeys
document.addEventListener('keydown', layoutStore.handleKeyDown);

</script>

<template>
  <v-main fill-height>
    <div id="app-main-container">

      <!--
        Left Column
      -->
      <section class="column" :class="{ colExpanded: layoutStore.isLeftExpanded, colNormal: !layoutStore.isLeftExpanded}"
           v-show="layoutStore.isLeftVisible">
        <!-- Header -->
        <div class="col-header">
            <h1 id="appHeadLeft" tabindex="0" class="headline">{{
                layoutStore.isInstructionsVisible ? $t('allInstructions')
                    : layoutStore.isInstructionsPdfVisible ? $t('allInstructionsPdf')
                        : layoutStore.isSolutionVisible ? $t('allSolution')
                            : layoutStore.isSolutionPdfVisible ? $t('allSolutionPdf')
                                : layoutStore.isEssayVisible ? $t('allEssay')
                                    : layoutStore.isResourcesVisible ? resourcesStore.activeTitle
                                        : layoutStore.isLeftCorrectorVisible ? layoutStore.leftCorrectorTitle : $t('mainContentLeftColumn')
              }}
            </h1>
          <v-btn-group density="comfortable">

            <!-- toggle left summary criteria  -->
            <v-btn size="small" v-show="layoutStore.isLeftCorrectorVisible"
                   @click="layoutStore.toggleLeftSummaryCriteria()">
              <v-icon v-show="layoutStore.showLeftSummaryCriteria" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showLeftSummaryCriteria" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allOverview') }}</span>
            </v-btn>

            <!-- toggle left summary text  -->
            <v-btn size="small" v-show="layoutStore.isLeftCorrectorVisible"
                   @click="layoutStore.toggleLeftSummaryText()">
              <v-icon v-show="layoutStore.showLeftSummaryText" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showLeftSummaryText" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allSummary') }}</span>
            </v-btn>

            <!-- expand right column -->
            <v-btn size="small" @click="layoutStore.setLeftExpanded(false)" v-show="layoutStore.isLeftExpanded">
              <v-icon icon="mdi-chevron-left"></v-icon>
              <span> {{
                  layoutStore.isMarkingSelected ? $t('allCorrection')
                      : layoutStore.isSummarySelected ? $t('allSummary')
                          : layoutStore.isRightCorrectorSelected ? layoutStore.rightCorrectorTitle : $t('mainContentExpandRightColumn')
                }}
                </span>
            </v-btn>
            <!-- expand left column -->
            <v-btn size="small" @click="layoutStore.setLeftExpanded(true)" v-show="!layoutStore.isLeftExpanded">
              <span aria-hidden="true">{{ $t('mainContentExpand') }}</span>
              <span id="app-expand-left-column" class="sr-only">{{ $t('mainContentExpandLeftColumn') }}</span>
              <v-icon icon="mdi-chevron-right"></v-icon>
            </v-btn>
          </v-btn-group>
        </div>
        <!-- Content -->
        <div class="col-content">
          <instructions v-if="layoutStore.isInstructionsVisible"/>
          <instructions-pdf v-if="layoutStore.isInstructionsPdfVisible"/>
          <solution v-if="layoutStore.isSolutionVisible"/>
          <solution-pdf v-if="layoutStore.isSolutionPdfVisible"/>
          <essay v-if="layoutStore.isEssayVisible && !pagesStore.hasPages"/>
          <essay-image v-if="layoutStore.isEssayVisible && pagesStore.hasPages"/>
          <resources v-if="layoutStore.isResourcesVisible"/>
          <other-summary v-if="layoutStore.isLeftCorrectorVisible"
                         :corrector_key="layoutStore.leftCorrectorKey"
                         :showCriteria="layoutStore.showLeftSummaryCriteria"
                         :showText="layoutStore.showLeftSummaryText"
          />
        </div>
      </section>

      <!--
          Right Column
      -->
      <section class="column" :class="{ colExpanded: layoutStore.isRightExpanded, colNormal: !layoutStore.isRightExpanded}"
           v-show="layoutStore.isRightVisible">
        <!-- Header -->
        <div class="col-header">
            <h1 id="appHeadRight" tabindex="0" class="headline"> {{
                layoutStore.isMarkingVisible ? $t("allCorrection")
                    : layoutStore.isSummaryVisible ? $t("allOwnSummaryAndRating")
                        : layoutStore.isRightCorrectorVisible ? layoutStore.rightCorrectorTitle : $t('mainContentRightColumn')
              }}
            </h1>

          <v-btn-group density="comfortable">

            <!-- show other correctors -->
            <v-btn size="small" variant="plain" v-if="layoutStore.isMarkingVisible"
                   @click="commentsStore.setShowOtherCorrectors(!commentsStore.isOtherCorrectorsShown)">
              <v-icon
                  :icon="commentsStore.isOtherCorrectorsShown ? 'mdi-account-school' : 'mdi-account-school-outline'"></v-icon>
              <span class="sr-only">{{$t('mainContentShowOtherCorrectors') + (commentsStore.isOtherCorrectorsShown ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- reset comments filter -->
            <v-btn size="small" variant="plain" v-if="layoutStore.isMarkingVisible"
                   :disabled="!commentsStore.isFilterActive"
                   @click="commentsStore.resetFilter()">
              <v-icon :icon="commentsStore.isFilterActive ? 'mdi-filter' : 'mdi-filter-outline'"></v-icon>
              <span class="sr-only">{{'Filter aktiv' + (commentsStore.isFilterActive ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle marking Comments -->
            <v-btn size="small" v-show="layoutStore.isMarkingVisible" @click="layoutStore.toggleMarkingComments()">
              <v-icon v-show="layoutStore.showMarkingComments" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showMarkingComments" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allComments') }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showMarkingComments ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle marking comment criteria -->
            <v-btn size="small" v-show="criteriaStore.hasCommentCriteria && layoutStore.isMarkingVisible"
                   @click="layoutStore.toggleMarkingCommentCriteria()">
              <v-icon v-show="layoutStore.showMarkingCommentCriteria" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showMarkingCommentCriteria" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allPartialPoints') }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showMarkingCommentCriteria ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle marking general criteria -->
            <v-btn size="small" v-show="criteriaStore.hasOwnGeneralCriteria && layoutStore.isMarkingVisible"
                   @click="layoutStore.toggleMarkingGeneralCriteria()">
              <v-icon v-show="layoutStore.showMarkingGeneralCriteria" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showMarkingGeneralCriteria" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allGeneralPoints') }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showMarkingGeneralCriteria ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle marking text -->
            <v-btn size="small" v-show="!apiStore.isForReviewOrStitch && layoutStore.isMarkingVisible"
                   @click="layoutStore.toggleMarkingText()">
              <v-icon v-show="layoutStore.showMarkingText" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showMarkingText" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allSummary') }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showMarkingText ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle right summary criteria  -->
            <v-btn size="small" v-show="layoutStore.isSummaryVisible || layoutStore.isRightCorrectorVisible"
                   @click="layoutStore.toggleRightSummaryCriteria()">
              <v-icon v-show="layoutStore.showRightSummaryCriteria" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showRightSummaryCriteria" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allOverview') }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showRightSummaryCriteria ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle right summary text  -->
            <v-btn size="small" v-show="layoutStore.isSummaryVisible || layoutStore.isRightCorrectorVisible"
                   @click="layoutStore.toggleRightSummaryText()">
              <v-icon v-show="layoutStore.showRightSummaryText" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showRightSummaryText" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allSummary') }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showRightSummaryText ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- expand left column -->
            <v-btn size="small" @click="layoutStore.setRightExpanded(false)" v-show="layoutStore.isRightExpanded">
                <span> {{
                    layoutStore.isInstructionsSelected ? $t('allInstructions')
                        : layoutStore.isEssaySelected ? $t('allEssay')
                            : layoutStore.isResourcesSelected ? resourcesStore.activeTitle
                                : layoutStore.isLeftCorrectorSelected ? layoutStore.leftCorrectorTitle : $t('mainContentExpandLeftColumn')
                  }}
                </span>
              <v-icon icon="mdi-chevron-right"></v-icon>
            </v-btn>

            <!-- expand right column -->
            <v-btn size="small" @click="layoutStore.setRightExpanded(true)" v-show="!layoutStore.isRightExpanded">
              <v-icon icon="mdi-chevron-left"></v-icon>
              <span aria-hidden="true">{{ $t('mainContentExpand') }}</span>
              <span id="app-expand-right-column" class="sr-only">{{ $t('mainContentExpandRightColumn') }}</span>
            </v-btn>

          </v-btn-group>
        </div>
        <!-- Content -->
        <div class="col-content">
          <own-summary v-if="layoutStore.isSummaryVisible"
                       :showCriteria="layoutStore.showRightSummaryCriteria"
                       :showText="layoutStore.showRightSummaryText"
          />
          <other-summary v-if="layoutStore.isRightCorrectorVisible"
                         :corrector_key="layoutStore.rightCorrectorKey"
                         :showCriteria="layoutStore.showRightSummaryCriteria"
                         :showText="layoutStore.showRightSummaryText"
          />
          <marking v-if="layoutStore.isMarkingVisible"/>
        </div>
      </section>
    </div>
  </v-main>


  <v-dialog persistent v-model="apiStore.showSendFailure">
    <v-card>
      <v-card-text>
        <p>{{ $t('mainContentSendFailureLine1') }}</p>
        <p>{{
            $t('mainContentSendFailureLine2') }}</p>
        <p>{{ $t('mainContentSendFailureLine3')}}</p>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="apiStore.setShowSendFailure(false)">
          <v-icon left icon="mdi-close"></v-icon>
          <span>{{ $t('allCloseMessage') }}</span>
        </v-btn>
        <v-btn :href="apiStore.returnUrl">
          <v-icon left icon="mdi-logout-variant"></v-icon>
          <span>{{ $t('mainContentStopCorrection') }}</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <snippets></snippets>
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
  height: 100%;
  display: flex;
  flex-direction: column;
}

.col-header {
  min-height: 40px;
  width: 100%;
  padding: 10px;
}

.col-content {
  flex-grow: 1;
  background-color: white;
  width: 100%;
  padding: 10px;
  overflow-y: hidden;
}

.headline {
  font-size: 1rem;
  font-weight: bold;
  display: inline;
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

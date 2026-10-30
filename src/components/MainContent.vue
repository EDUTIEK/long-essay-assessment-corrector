<script setup>
import {stores} from "@/store";
import Instructions from "@/components/Instructions.vue";
import Solution from '@/components/Solution.vue';
import Resources from "@/components/Resources.vue";
import Essay from "@/components/Essay.vue";
import EssayImage from '@/components/EssayImage.vue';
import EssayPdf from '@/components/EssayPdf.vue';
import SummaryColumn from "@/components/SummaryColumn.vue";
import Marking from "@/components/Marking.vue";
import Snippets from "@/components/Snippets.vue";
import SnippetList from "@/components/SnippetList.vue";
import { nextTick, watch } from 'vue';

const configStore = stores.config();
const essayStore = stores.essay();
const layoutStore = stores.layout();
const itemsStore = stores.items();
const resourcesStore = stores.resources();
const commentsStore = stores.comments();
const criteriaStore = stores.criteria();
const pagesStore = stores.pages();
const settingsStore = stores.settings();
const correctionsStore = stores.corrections();

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
                                    : layoutStore.isResourcesVisible ? resourcesStore.activeResource?.title
                                        : layoutStore.isLeftCorrectionVisible ? layoutStore.leftCorrectionTitle : $t('mainContentLeftColumn')
              }}
            </h1>
          <v-btn-group density="comfortable">

            <!-- toggle left summary criteria  -->
            <v-btn size="small"
                   v-if="settingsStore.hasSummaryOverview"
                   v-show="layoutStore.isLeftCorrectionVisible"
                   @click="layoutStore.toggleLeftSummaryCriteria()">
              <v-icon v-show="layoutStore.showLeftSummaryCriteria" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showLeftSummaryCriteria" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allOverview') }}</span>
            </v-btn>

            <!-- toggle left summary text  -->
            <v-btn size="small" v-show="layoutStore.isLeftCorrectionVisible"
                   @click="layoutStore.toggleLeftSummaryText()">
              <v-icon v-show="layoutStore.showLeftSummaryText" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showLeftSummaryText" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allSummary') }}</span>
            </v-btn>

            <!-- toggle left summary revision  -->
            <v-btn size="small"
                   v-if="stores.summaries().getForCorrection(layoutStore.leftCorrectionKey)?.isRevised()"
                   v-show="layoutStore.isLeftCorrectionVisible"
                   @click="layoutStore.toggleLeftSummaryRevision()">
              <v-icon v-show="layoutStore.showLeftSummaryRevision" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showLeftSummaryRevision" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ settingsStore.procedureText }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showLeftSummaryRevision ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle snippet list  -->
            <v-btn size="small"
                   v-if="correctionsStore.hasCorrection"
                   @click="layoutStore.toggleSnippetList()">
              <v-icon v-show="layoutStore.showSnippetList" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showSnippetList" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('snippetsSnippets') }}</span>
            </v-btn>

            <!-- expand right column -->
            <v-btn size="small" @click="layoutStore.setLeftExpanded(false)" v-show="layoutStore.isLeftExpanded">
              <v-icon icon="mdi-chevron-left"></v-icon>
              <span> {{
                  layoutStore.isMarkingSelected ? $t('allCorrection')
                      : layoutStore.isSummarySelected ? $t('allSummary')
                          : layoutStore.isRightCorrectionSelected ? layoutStore.rightCorrectionTitle : $t('mainContentExpandRightColumn')
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
          <instructions v-show="layoutStore.isInstructionsVisible"/>
          <solution v-if="layoutStore.isSolutionVisible"/>
          <resources v-show="layoutStore.isInstructionsPdfVisible || layoutStore.isSolutionPdfVisible || layoutStore.isResourcesVisible"/>

          <essay v-if="layoutStore.isEssayVisible && !essayStore.hasPdf"/>
          <essay-image v-if="layoutStore.isEssayVisible && essayStore.hasPdf && settingsStore.markingByImages"/>
          <essay-pdf v-if="layoutStore.isEssayVisible && essayStore.hasPdf && settingsStore.markingInPdf"/>

          <summary-column v-if="layoutStore.isLeftCorrectionVisible"
                         :correction_key="layoutStore.leftCorrectionKey"
                         :showCriteria="layoutStore.showLeftSummaryCriteria"
                         :showText="layoutStore.showLeftSummaryText"
                         :showRevision="layoutStore.showLeftSummaryRevision"
          />
        </div>
        <div class="col-extra"
             v-if="correctionsStore.hasCorrection"
             v-show="layoutStore.showSnippetList"
        >
          <snippet-list></snippet-list>
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
                        : layoutStore.isRightCorrectionVisible ? layoutStore.rightCorrectionTitle : $t('mainContentRightColumn')
              }}
            </h1>

          <v-btn-group density="comfortable">

            <!-- show other corrections -->
            <v-btn size="small" variant="plain" v-if="settingsStore.Task.enable_comments && layoutStore.isMarkingVisible"
                   @click="commentsStore.setShowOtherCorrections(!commentsStore.isOtherCorrectionsShown)">
              <v-icon
                  :icon="commentsStore.isOtherCorrectionsShown ? 'mdi-account-school' : 'mdi-account-school-outline'"></v-icon>
              <span class="sr-only">{{$t('mainContentShowOtherCorrections') + (commentsStore.isOtherCorrectionsShown ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- reset comments filter -->
            <v-btn size="small" variant="plain" v-if="settingsStore.hasSummaryOverview && layoutStore.isMarkingVisible"
                   :disabled="!commentsStore.isFilterActive"
                   @click="commentsStore.resetFilter()">
              <v-icon :icon="commentsStore.isFilterActive ? 'mdi-filter' : 'mdi-filter-outline'"></v-icon>
              <span class="sr-only">{{'Filter aktiv' + (commentsStore.isFilterActive ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle marking Comments -->
            <v-btn size="small" v-if="settingsStore.Task.enable_comments && itemsStore.canAct" v-show="layoutStore.isMarkingVisible" @click="layoutStore.toggleMarkingComments()">
              <v-icon v-show="layoutStore.showMarkingComments" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showMarkingComments" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allComments') }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showMarkingComments ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle marking comment points -->
            <v-btn size="small" v-if="settingsStore.Task.enable_partial_points && itemsStore.canAct && settingsStore.Task.enable_partial_points"
                   v-show="layoutStore.isMarkingVisible"
                   @click="layoutStore.toggleMarkingCommentPoints()">
              <v-icon v-show="layoutStore.showMarkingCommentPoints" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showMarkingCommentPoints" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allPartialPoints') }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showMarkingCommentPoints ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle marking general points -->
            <v-btn size="small" v-if="settingsStore.Task.enable_partial_points && criteriaStore.hasOwnGeneralCriteria"
                   v-show="layoutStore.isMarkingVisible"
                   @click="layoutStore.toggleMarkingGeneralPoints()">
              <v-icon v-show="layoutStore.showMarkingGeneralPoints" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showMarkingGeneralPoints" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allGeneralPoints') }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showMarkingGeneralPoints ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle marking text -->
            <v-btn size="small" v-if="itemsStore.canAct" v-show="layoutStore.isMarkingVisible"
                   @click="layoutStore.toggleMarkingText()">
              <v-icon v-show="layoutStore.showMarkingText" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showMarkingText" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allSummary') }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showMarkingText ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle right summary criteria  -->
            <v-btn size="small"
                   v-if="settingsStore.hasSummaryOverview"
                   v-show="layoutStore.isSummaryVisible || layoutStore.isRightCorrectionVisible"
                   @click="layoutStore.toggleRightSummaryCriteria()">
              <v-icon v-show="layoutStore.showRightSummaryCriteria" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showRightSummaryCriteria" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allOverview') }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showRightSummaryCriteria ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle right summary text  -->
            <v-btn size="small" v-show="layoutStore.isSummaryVisible || layoutStore.isRightCorrectionVisible"
                   @click="layoutStore.toggleRightSummaryText()">
              <v-icon v-show="layoutStore.showRightSummaryText" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showRightSummaryText" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ $t('allSummary') }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showRightSummaryText ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- toggle right summary revision  -->
            <v-btn size="small"
                   v-if="stores.summaries().isOwnRevised || stores.items().canRevise"
                   v-show="layoutStore.isSummaryVisible || layoutStore.isRightCorrectionVisible"
                   @click="layoutStore.toggleRightSummaryRevision()">
              <v-icon v-show="layoutStore.showRightSummaryRevision" icon="mdi-checkbox-outline"></v-icon>
              <v-icon v-show="!layoutStore.showRightSummaryRevision" icon="mdi-checkbox-blank-outline"></v-icon>
              <span>{{ settingsStore.procedureText }}</span>
              <span class="sr-only">{{$t('allShow') + (layoutStore.showRightSummaryRevision ? $t('allIsSelected') : '')}}</span>
            </v-btn>

            <!-- expand left column -->
            <v-btn size="small" @click="layoutStore.setRightExpanded(false)" v-show="layoutStore.isRightExpanded">
                <span> {{
                    layoutStore.isInstructionsSelected ? $t('allInstructions')
                        : layoutStore.isEssaySelected ? $t('allEssay')
                            : layoutStore.isResourcesSelected ? resourcesStore.activeResource?.title
                                : layoutStore.isLeftCorrectionSelected ? layoutStore.leftCorrectionTitle : $t('mainContentExpandLeftColumn')
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
          <summary-column v-if="layoutStore.isSummaryVisible"
                       :correction_key="stores.corrections().ownKey"
                       :showCriteria="layoutStore.showRightSummaryCriteria"
                       :showText="layoutStore.showRightSummaryText"
                       :showRevision="layoutStore.showRightSummaryRevision"
          />
          <summary-column v-if="layoutStore.isRightCorrectionVisible"
                         :correction_key="layoutStore.rightCorrectionKey"
                         :showCriteria="layoutStore.showRightSummaryCriteria"
                         :showText="layoutStore.showRightSummaryText"
                         :showRevision="layoutStore.showRightSummaryRevision"
          />
          <marking v-if="layoutStore.isMarkingVisible"/>
        </div>
      </section>
    </div>
  </v-main>


  <v-dialog persistent v-model="stores.layout().showSendFailure">
    <v-card>
      <v-card-text>
        <p>{{ $t('mainContentSendFailureLine1') }}</p>
        <p>{{
            $t('mainContentSendFailureLine2') }}</p>
        <p>{{ $t('mainContentSendFailureLine3')}}</p>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="stores.layout().showSendFailure = false;">
          <v-icon left icon="mdi-close"></v-icon>
          <span>{{ $t('allCloseMessage') }}</span>
        </v-btn>
        <v-btn :href="configStore.returnUrl">
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
  flex: 1 1 0;
  min-height: 0;
  background-color: white;
  width: 100%;
  padding: 10px;
  overflow-y: hidden;
}

.col-extra {
  flex: 0 0 50%;
  min-height: 0;
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

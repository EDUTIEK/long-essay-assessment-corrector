<script setup xmlns="http://www.w3.org/1999/html">
import { useApiStore } from '@/store/api';
import { useCommentsStore } from "@/store/comments";
import { useSummariesStore } from '@/store/summaries';
import { useSettingsStore } from '@/store/settings';
import { useCriteriaStore } from '@/store/criteria';
import { usePointsStore } from '@/store/points';
import { useLayoutStore } from '@/store/layout';
import {nextTick, onMounted, ref, watch} from 'vue';

const apiStore = useApiStore();
const commentsStore = useCommentsStore();
const summariesStore = useSummariesStore();
const settingsStore = useSettingsStore();
const criteriaStore = useCriteriaStore();
const pointsStore = usePointsStore();
const layoutStore = useLayoutStore();

const props = defineProps(['comment']);

const comment = props.comment;

function isSelected(comment) {
  return comment.key == commentsStore.selectedKey;
}

function hasTrash(comment) {
  return comment.corrector_key == apiStore.correctorKey && !summariesStore.isOwnDisabled
}

function hasDetails(comment) {
  return comment.rating_excellent || comment.rating_cardinal ||
      comment.points > 0 || pointsStore.getSumOfPointsForComment(comment.key) > 0;
}


/**
 * Ugly fix for accessibility issue in v-textarea component of vuetify
 */
onMounted(() => {
  const container = document.getElementById('appCommentContainer' + comment.key);
  for (const label of container.getElementsByTagName('label')) {
    if (label.getAttribute('for').includes('app-comment-')) {
      label.classList.add('sr-only');
      if (label.getAttribute('aria-hidden') == 'true') {
        if (!label.getAttribute('for').includes('-sizer')) {
          label.setAttribute('for', label.getAttribute('for') + '-sizer');
        }
      } else {
        label.setAttribute('id', 'app-comment-' + comment.key + '-messages');
      }
    }
  }
  for (const textarea of container.getElementsByTagName('textarea')) {
    textarea.style.marginTop = '-15px';
    textarea.style.fontSize = '0.9rem';
  }
  for (const div of container.getElementsByClassName('v-input__details')) {
   div.style.display ='none';
  }
});


/**
 * Get the background color for the text field of a comment
 * @param comment
 * @return {string}
 */
function getBgColor(comment) {

  if (comment.key == commentsStore.selectedKey) {
    if (comment.rating_excellent) return '#BBEBA5';
    if (comment.rating_cardinal) return '#FCB494';
    return '#94C3FC';
  } else if (comment.prefix == 'own') {
    if (comment.rating_excellent) return '#E3EFDD';
    if (comment.rating_cardinal) return '#FBDED1';
    return '#D8E5F4';
  } else {
    if (comment.rating_excellent) return '#F7F9F7';
    if (comment.rating_cardinal) return '#FCF6F4';
    return '#F5F7FB';
  }
}

function getPointsInputStyle(comment) {
  const sum = commentsStore.getPointsOfCorrector(comment.corrector_key);
  if (sum > settingsStore.max_points) {
    return 'color: red;';
  }
  return '';
}

function getPointsDisplay(comment) {
  if (criteriaStore.getCorrectorHasCriteria(comment.corrector_key)) {
    return pointsStore.getSumOfPointsForComment(comment.key);
  }
  else {
    return comment.points;
  }
}

function getPointsLabel(comment) {
 return getPointsDisplay(comment) == 1 ? 'Punkt' : 'Punkte';
}

async function toggleExcellent(comment) {
  if (comment.rating_excellent) {
    comment.rating_cardinal = false;
  }
  commentsStore.setMarkerChange();
  commentsStore.updateComment(comment);
}

async function toggleCardinal(comment) {
  if (comment.rating_cardinal) {
    comment.rating_excellent = false;
  }
  commentsStore.setMarkerChange();
  commentsStore.updateComment(comment);
}

async function selectComment(comment) {
  commentsStore.selectComment(comment.key);
}

async function handleTextKeydown() {
  if (event.altKey) {
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        layoutStore.showEssay();
        await nextTick();
        commentsStore.setCaretRequest();
        break;
      case "Delete":
        event.preventDefault();
        commentsStore.deleteComment(commentsStore.selectedKey);
        break;
    }
  }
}

async function handleSumOfPointsKeydown() {
  switch (event.key) {
    case "Enter":
      event.preventDefault();
      layoutStore.focusMarkingPoints();
      break;
  }
}

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'markingPointsSum') {
    await nextTick();
    if (comment.key == commentsStore.selectedKey) {
      console.log('pointsInput' + comment.key);
      document.getElementById('pointsInput' + comment.key).focus();
    }
  }
}
watch(() => layoutStore.focusChange, handleFocusChange);

</script>


<template>
  <v-container :id="'appCommentContainer' + comment.key" :key="comment.key" class="commentContainer">

    <v-row dense>

      <!-- icon and label -->
      <v-col cols="2">
        <v-icon size="small" :icon="comment.getMarkIcon()"></v-icon> &nbsp;
        <button tabindex="0"
                :class="'v-btn commentLabel ' + (comment.key == commentsStore.selectedKey ? 'selected' : '')"
                @click="commentsStore.selectComment(comment.key)">
          {{ comment.label }}
        </button>
      </v-col>

      <v-col cols="9">

        <v-container>

          <!-- COMMENT INPUT -->

          <v-row dense v-show="isSelected(comment)">
            <v-col cols="12">
              <v-textarea class="commentInput" :bg-color="getBgColor(comment)" rounded="0" density="compact" variant="solo"
                          :id="'app-comment-' + comment.key"
                          :label="'Anmerkung zu Markierung ' + comment.label"
                          rows="1" auto-grow
                          :readonly="summariesStore.isOwnDisabled || comment.corrector_key != apiStore.correctorKey"
                          @click="commentsStore.selectComment(comment.key)"
                          @change="commentsStore.updateComment(comment)"
                          @keyup="commentsStore.updateComment(comment)"
                          @keydown="handleTextKeydown()"
                          v-model="comment.comment">
              </v-textarea>
            </v-col>
          </v-row>

          <!-- DETAILS INPUT -->

          <v-row dense v-show="isSelected(comment)">

            <!-- enter points -->
            <v-col cols="4">
              <span v-if="criteriaStore.getCorrectorHasCriteria(comment.corrector_key)"
                    v-show="comment.key == commentsStore.selectedKey || pointsStore.getCommentHasPoints(comment.key)"
              >
                  <span tabindex="0"
                        :id="'pointsInput' + comment.key"
                        @keydown="handleSumOfPointsKeydown()"
                  ><span class="pointsInput">{{ getPointsDisplay(comment) }}</span>&nbsp;{{ getPointsLabel(comment) }}</span>
              </span>
              <span v-if="!criteriaStore.getCorrectorHasCriteria(comment.corrector_key)"
                    v-show="comment.key == commentsStore.selectedKey || comment.points > 0"
              >
                <input class="pointsInput"
                       type="number"
                       min="0"
                       :style=getPointsInputStyle(comment)
                       :id="'pointsInput' + comment.key"
                       :max="settingsStore.max_points"
                       :disabled="summariesStore.isOwnDisabled || comment.corrector_key != apiStore.correctorKey"
                       @change="commentsStore.updateComment(comment)"
                       v-model="comment.points"/>
                <label :for="'pointsInput' + comment.key">&nbsp;{{ getPointsLabel(comment) }}</label>
              </span>

            </v-col>

            <!-- enter rating excellent -->
            <v-col cols="4">
              <span v-show="comment.rating_excellent || comment.key == commentsStore.selectedKey">
               <input type="checkbox"
                      class="ratingInput"
                      v-model="comment.rating_excellent"
                      :id="'ratingExcellent' + comment.key"
                      :disabled="summariesStore.isOwnDisabled || comment.corrector_key != apiStore.correctorKey"
                      @change="toggleExcellent(comment)"/>

                <label :for="'ratingExcellent' + comment.key">&nbsp;{{ settingsStore.positive_rating }}</label>
              </span>
            </v-col>

            <!-- enter rating cardinal -->
            <v-col cols="4">
              <span v-show="comment.rating_cardinal || comment.key == commentsStore.selectedKey">
                <input type="checkbox"
                       class="ratingInput"
                       v-model="comment.rating_cardinal"
                       :id="'ratingCardinal' + comment.key"
                       :disabled="summariesStore.isOwnDisabled || comment.corrector_key != apiStore.correctorKey"
                       @change="toggleCardinal(comment)"/>
                <label :for="'ratingCardinal' + comment.key">&nbsp;{{ settingsStore.negative_rating }}</label>
              </span>
            </v-col>

          </v-row>

          <!-- COMMENT DISPLAY -->

          <v-row dense>
            <v-col cols="12" v-show="!isSelected(comment)">
              <div class="commentDisplay"
                   v-show="comment.comment"
                   :style="'background-color: ' + getBgColor(comment) + ';'"
                   @click="commentsStore.selectComment(comment.key)"
              >
                {{comment.comment}}
              </div>
            </v-col>
          </v-row>

          <!-- DETAILS DISPLAY -->

          <v-row dense class="detailsDisplay" v-show="!isSelected(comment) && hasDetails(comment)">

            <!-- show points -->
            <v-col cols=4>
              <span v-show="getPointsDisplay(comment) > 0" @click="commentsStore.selectComment(comment.key)">
                <span class="pointsInput">{{ getPointsDisplay(comment) }}</span>&nbsp;{{ getPointsLabel(comment) }}
              </span>
            </v-col>

            <!-- show excellent -->
            <v-col cols=4>
              <span v-show="comment.rating_excellent" @click="commentsStore.selectComment(comment.key)">
                 <v-icon icon="mdi-checkbox-outline"></v-icon> Exzellent
              </span>
            </v-col>

            <!-- show cardinal -->
            <v-col cols=4>
              <span v-show="comment.rating_cardinal" @click="commentsStore.selectComment(comment.key)">
                <v-icon icon="mdi-checkbox-outline"></v-icon> Kardinal
              </span>
            </v-col>
          </v-row>
        </v-container>
      </v-col>

      <!-- trash -->
      <v-col cols="1" class="trashColumn">
        <v-btn class="trashButton" density="compact" size="small" variant="text" prepend-icon="mdi-delete-outline"
               v-show="hasTrash(comment)"
               :tabindex="isSelected(comment) ? 0 : -1"
               @click="commentsStore.deleteComment(comment.key)">
          <span class="sr-only">Anmerkung löschen</span>
        </v-btn>
      </v-col>

    </v-row>
  </v-container>
</template>

<style scoped>

.v-container {
  padding: 0;
  margin: 0;
}

.v-row {
  font-size: 12px;
  padding: 0;
  margin: 0;
}

.v-col {
  font-size: 12px;
  padding: 0;
  margin: 0;
}

.commentContainer {
  padding: 5px 0;
  border-bottom: 1px dotted gray;
}

.commentLabel {
  font-size: 14px;
  padding: 3px;
}

.commentLabel.selected {
  background-color: #606060;
  font-weight: bold;
  color: white;
}

.commentInput {
  width: 100%;
  font-family: serif;
  margin-bottom: 5px;
}

.commentDisplay {
  width: 100%;
  font-family: serif;
  font-size: 0.9rem;
  padding: 2px 15px;
  margin-bottom: 5px;
}

.detailsDisplay {
  color: #606060;
}

i {
  margin-top: -2px;
}

.pointsInput {
  display: inline-block;
  width: 3rem;
  text-align: left;
  color: #606060;
}

.ratingInput {
  display: inline-block;
  width: 1rem;
}

.trashColumn {
  position: relative;
}

.trashButton {
  position: absolute;
  bottom: 5px;
}

</style>

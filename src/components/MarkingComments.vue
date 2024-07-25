<script setup>
import { useApiStore } from '@/store/api';
import {useCommentsStore} from "@/store/comments";
import { useSummariesStore } from '@/store/summaries';
import { useSettingsStore } from '@/store/settings';
import { useCriteriaStore } from '@/store/criteria';
import { usePointsStore } from '@/store/points';

import Comment from "@/data/Comment";
import { watch } from 'vue';
import { nextTick} from "vue";

const apiStore = useApiStore();
const commentsStore = useCommentsStore();
const summariesStore = useSummariesStore();
const settingsStore = useSettingsStore();
const criteriaStore = useCriteriaStore();
const pointsStore = usePointsStore();

/**
 * Focus the currently selected comment
 */
async function focusSelected() {
    await nextTick();
    let el = document.getElementById('appCommentWrapper' + commentsStore.selectedKey);
    if (el) {
        let tx = el.querySelector('textarea');
        if (tx) {
            tx.focus();
        }
    }
}
watch(() => commentsStore.selectionChange, focusSelected);


/**
 * Set the scrolling so that the complete mark is visible
 * @param {integer} firstWord
 * @param {integer} lastWord
 */
async function scrollToFirstVisible() {
    await nextTick();
    let el = document.getElementById('appCommentContainer' + commentsStore.firstVisibleKey);
    if (el) {
        el.scrollIntoView();
    }
}
watch(() => commentsStore.firstVisibleKey, scrollToFirstVisible);


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
    }
    else if (comment.prefix == 'own') {
        if (comment.rating_excellent)  return '#E3EFDD';
        if (comment.rating_cardinal) return '#FBDED1';
        return '#D8E5F4';
    }
    else {
        if (comment.rating_excellent)  return '#F7F9F7';
        if (comment.rating_cardinal) return '#FCF6F4';
        return '#F5F7FB';
    }
}

function getPointsColor(comment) {
    if (comment.points == 0) {
        return 'white';
    }
    if (comment.corrector_key != apiStore.correctorKey) {
        return 'grey';
    }
    const sum = commentsStore.getPointsOfCorrector(comment.corrector_key);
    if (sum > settingsStore.max_points) {
        return 'red';
    }
    return 'grey';
}

async function toggleExcellent(comment) {
    commentsStore.selectComment(comment.key);
    if (comment.rating_excellent) {
        comment.rating_cardinal = false;
    }
    commentsStore.setMarkerChange();
    commentsStore.updateComment(comment);
}

async function toggleCardinal(comment) {
    commentsStore.selectComment(comment.key);
    if (comment.rating_cardinal) {
        comment.rating_excellent = false;
    }
    commentsStore.setMarkerChange();
    commentsStore.updateComment(comment);
}

async function selectComment(comment) {
    commentsStore.selectComment(comment.key);
}

</script>


<template>
  <div id="appMarkingComments">
    <v-container :id="'appCommentContainer' + comment.key" v-for="comment in commentsStore.activeComments"
                 :key="comment.key">
      <v-row class="row" dense>

        <!-- icon and label -->

        <v-col class="col">
          <v-icon size="small" :icon="comment.getMarkIcon()"></v-icon> &nbsp;
          <span
              :class="'commentLabel ' + (comment.key == commentsStore.selectedKey ? 'selected' : '')"
              @click="commentsStore.selectComment(comment.key)">
                      {{ comment.label }}
                    </span>
        </v-col>

        <!-- trash -->

        <v-col class="col">
          <v-btn density="compact" size="small" variant="text" prepend-icon="mdi-delete-outline"
                 v-show="comment.corrector_key == apiStore.correctorKey && !summariesStore.isOwnDisabled"
                 @click="commentsStore.deleteComment(comment.key)"></v-btn>
        </v-col>

        <!-- points -->

        <v-col class="col">
          <span v-show="commentsStore.isPointsAndRatingsShown || comment.key == commentsStore.selectedKey">
            <input v-if="criteriaStore.getCorrectorHasCriteria(comment.corrector_key)"
                  class="pointsInput"
                  disabled="disabled"
                  :id="'pointsInput' + comment.key"
                  :value="pointsStore.getSumOfPointsForComment(comment.key)"/>

            <input v-if="!criteriaStore.getCorrectorHasCriteria(comment.corrector_key)"
                 class="pointsInput"
                 type="number"
                 min="0"
                 :style="'color: ' + getPointsColor(comment) + ';'"
                 :id="'pointsInput' + comment.key"
                 :max="settingsStore.max_points"
                 :disabled="summariesStore.isOwnDisabled || comment.corrector_key != apiStore.correctorKey"
                 @change="commentsStore.updateComment(comment)"
                 v-model="comment.points"/>

            <label :for="'pointsInput' + comment.key"
                   @click="commentsStore.selectComment(comment.key)"> Pkt.</label>
          </span>

        </v-col>

        <!-- rating excellent -->

        <v-col class="col">
          <span v-show="commentsStore.isPointsAndRatingsShown  || comment.key == commentsStore.selectedKey">
           <input type="checkbox"
                             class="ratingInput"
                             v-model="comment.rating_excellent"
                             :id="'ratingExcellent' + comment.key"
                             :disabled="summariesStore.isOwnDisabled || comment.corrector_key != apiStore.correctorKey"
                             @change="toggleExcellent(comment)"/>

            <label :for="'ratingExcellent' + comment.key"
                 @click="commentsStore.selectComment(comment.key)">&nbsp;{{ settingsStore.positive_rating }}</label>
          </span>

        </v-col>

        <!-- rating cardinal -->

        <v-col class="col">
          <span v-show="commentsStore.isPointsAndRatingsShown  || comment.key == commentsStore.selectedKey">
            <input type="checkbox"
                   class="ratingInput"
                   v-model="comment.rating_cardinal"
                   :id="'ratingCardinal' + comment.key"
                   :disabled="summariesStore.isOwnDisabled || comment.corrector_key != apiStore.correctorKey"
                   @change="toggleCardinal(comment)"/>
            <label :for="'ratingCardinal' + comment.key"
                   @click="commentsStore.selectComment(comment.key)">&nbsp;{{ settingsStore.negative_rating }}</label>
          </span>
        </v-col>
      </v-row>


      <v-row>
        <div :id="'appCommentWrapper' + comment.key" class="commentWrapper">
          <v-textarea class="comment" :bg-color="getBgColor(comment)" rounded="0" density="compact" variant="solo"
                      rows="1" auto-grow
                      :readonly="summariesStore.isOwnDisabled || comment.corrector_key != apiStore.correctorKey"
                      @click="commentsStore.selectComment(comment.key)"
                      @change="commentsStore.updateComment(comment)"
                      @keyup="commentsStore.updateComment(comment)"
                      v-show="comment.comment != '' || comment.key == commentsStore.selectedKey"
                      v-model="comment.comment"></v-textarea>
        </div>
      </v-row>
    </v-container>
  </div>

</template>

<style scoped>

    .v-container {
        margin-top: 1px;
        padding-right: 20px;
        padding-bottom: 8px;
    }

    .row {
        margin-top: -18px;
        margin-bottom: -12px;
        line-height: 12px;
    }

    .col {
      font-size: 12px;
    }

    .commentLabel {
        font-size: 14px;
        padding: 3px;
    }

    .commentLabel.selected {
        background-color: grey;
        color: white;
        padding: 3px;
        font-size: 14px;
    }

    .pointsInput {
      width: 4em;
      text-align: left;
    }

    .commentWrapper {
        width:100%;
    }
    .comment {
        width:100%;
        font-family: serif;
        line-height: 20px;
    }

    textarea {
        padding: 0;
    }



</style>

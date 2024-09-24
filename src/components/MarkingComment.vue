<script setup>
import { useApiStore } from '@/store/api';
import { useCommentsStore } from "@/store/comments";
import { useSummariesStore } from '@/store/summaries';
import { useSettingsStore } from '@/store/settings';
import { useCriteriaStore } from '@/store/criteria';
import { usePointsStore } from '@/store/points';
import { nextTick, watch, onMounted } from 'vue';

const apiStore = useApiStore();
const commentsStore = useCommentsStore();
const summariesStore = useSummariesStore();
const settingsStore = useSettingsStore();
const criteriaStore = useCriteriaStore();
const pointsStore = usePointsStore();

const props = defineProps(['comment']);

const comment = props.comment;

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
      }
      else {
        label.setAttribute('id', 'app-comment-' + comment.key + '-messages');
      }
    }
  }
  for (const textarea of container.getElementsByTagName('textarea')) {
    textarea.style.marginTop='-10px';
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
    <v-container :id="'appCommentContainer' + comment.key" :key="comment.key">
      <v-row class="row" dense>

        <!-- icon and label -->

        <v-col class="col">
          <v-icon size="small" :icon="comment.getMarkIcon()"></v-icon> &nbsp;
          <button tabindex="0"
              :class="'commentLabel ' + (comment.key == commentsStore.selectedKey ? 'selected' : '')"
              @click="commentsStore.selectComment(comment.key)">
                      {{ comment.label }}
          </button>
        </v-col>

        <!-- trash -->

        <v-col class="col">
          <v-btn density="compact" size="small" variant="text" prepend-icon="mdi-delete-outline"
                 v-show="comment.corrector_key == apiStore.correctorKey && !summariesStore.isOwnDisabled"
                 @click="commentsStore.deleteComment(comment.key)">
            <span class="sr-only">Anmerkung löschen</span>
          </v-btn>
        </v-col>

        <!-- points -->

        <v-col class="col">
          <span v-if="criteriaStore.getCorrectorHasCriteria(comment.corrector_key)"
                v-show="comment.key == commentsStore.selectedKey || pointsStore.getCommentHasPoints(comment.key)"
          >
            <input class="pointsInput"
                   disabled="disabled"
                   :id="'pointsInput' + comment.key"
                   :value="pointsStore.getSumOfPointsForComment(comment.key)"/>
            <label :for="'pointsInput' + comment.key"
                   @click="commentsStore.selectComment(comment.key)"> Pkt.</label>
          </span>
          <span v-if="!criteriaStore.getCorrectorHasCriteria(comment.corrector_key)"
                v-show="comment.key == commentsStore.selectedKey || comment.points > 0"
          >
            <input class="pointsInput"
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
          <span v-show="comment.rating_excellent || comment.key == commentsStore.selectedKey">
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
          <span v-show="comment.rating_cardinal || comment.key == commentsStore.selectedKey">
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
                      :id="'app-comment-' + comment.key"
                      :label="'Anmerkung zu Markierung ' + comment.label"
                      rows="1" auto-grow
                      :readonly="summariesStore.isOwnDisabled || comment.corrector_key != apiStore.correctorKey"
                      @click="commentsStore.selectComment(comment.key)"
                      @change="commentsStore.updateComment(comment)"
                      @keyup="commentsStore.updateComment(comment)"
                      v-show="comment.comment != '' || comment.key == commentsStore.selectedKey"
                      v-model="comment.comment">
            </v-textarea>
        </div>
      </v-row>
    </v-container>
</template>

<style scoped>

.v-container {
  margin-top: 2px;
  margin-bottom: 4px;
  padding-right: 20px;
  padding-bottom: 4px;
  border-bottom: 1px dotted gray;
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
  background-color: #606060;
  color: white;
  padding: 3px;
  font-size: 14px;
}

.pointsInput {
  width: 4em;
  text-align: left;
}

.commentWrapper {
  width: 100%;
}

.comment {
  width: 100%;
  font-family: serif;
  line-height: 20px;
}

textarea {
  padding: 0;
}


</style>

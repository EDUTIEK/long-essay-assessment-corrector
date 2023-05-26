<script setup>
import {useCommentsStore} from "@/store/comments";
import Comment from "@/data/Comment";
import { watch } from 'vue';
import { nextTick} from "vue";

const commentsStore = useCommentsStore();

/**
 * Focus the currently selected comment
 */
async function focusSelected() {
    await nextTick();
    let el = document.getElementById('comment' + commentsStore.selectedKey);
    if (el) {
        let tx = el.querySelector('textarea');
        if (tx) {
            tx.focus();
        }
    }
}
watch(() => commentsStore.selectedKey, focusSelected);


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

async function toggleExcellent(comment) {
    await commentsStore.selectComment(comment.key);
    if (comment.rating_excellent) {
        comment.rating_cardinal = false;
        commentsStore.updateComment(comment);
    }
}

async function toggleCardinal(comment) {
    await commentsStore.selectComment(comment.key);
    if (comment.rating_cardinal) {
        comment.rating_excellent = false;
        commentsStore.updateComment(comment);
    }

}

async function scrollText(comment) {
    await commentsStore.selectComment(comment.key);
    commentsStore.setScrollToSelection(true);
}

</script>


<template>
    <div id="appMarkingComments">
        <v-container v-for="comment in commentsStore.getActiveComments" :key="comment.key">
            <v-row class="row" dense>
                <v-col class="leftCol">
                    <v-btn-group density="compact">
                        <v-btn @click="scrollText(comment)" density="compact" variant="text" prepend-icon="mdi-bullseye-arrow">{{comment.label}}</v-btn>
                        <v-btn @click="commentsStore.deleteComment(comment.key)" density="compact" size="small" variant="text" prepend-icon="mdi-delete-outline">Löschen</v-btn>
                    </v-btn-group>
                </v-col>
                <v-col class="rightCol">
                   <span class="checkboxes">
                        <v-checkbox-btn v-model="comment.rating_excellent" label="Exzellent" @change="toggleExcellent(comment)"></v-checkbox-btn>
                        <v-checkbox-btn v-model="comment.rating_cardinal" label="Kardinalfehler" @change="toggleCardinal(comment)"></v-checkbox-btn>
                    </span>

                </v-col>
            </v-row>
            <v-row>
                <div :id="'comment' + comment.key" class="commentWrapper">
                <v-textarea class="comment" :bg-color="getBgColor(comment)" rounded="0" density="compact" variant="solo" rows="1" auto-grow
                            @click="commentsStore.selectComment(comment.key)"
                            @change="commentsStore.updateComment(comment)"
                            v-model="comment.comment"></v-textarea>
                </div>
            </v-row>
        </v-container>
    </div>

</template>

<style scoped>
    #appMarkingComments {
        padding-right: 5px;
    }
    .checkboxes {
        display: inline-block;
        position: relative;
        top: 15px;
        font-size: 10px;
    }

    .row {
        margin-top: -25px;
        margin-bottom: -15px;
    }

    .leftCol {
    }

    .rightCol {
       padding: 0;
       text-align:right;
       margin-top: -15px;
   }

    .commentWrapper {
        width:100%;
    }
    .comment {
        width:100%;
        font-family: Serif;
        font-size: 16px;
    }

    textarea {
        padding: 0;
    }



</style>
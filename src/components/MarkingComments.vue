<script setup>
import {useCommentsStore} from "@/store/comments";
const commentsStore = useCommentsStore();


</script>


<template>
    <div class="appMarkingComments">
        <v-container class="container" v-for="comment in commentsStore.getActiveComments" :key="comment.key">
            <v-row class="row" dense>
                <v-col>{{comment.label}}</v-col>
                <v-col class="rightCol">
                    <v-btn @click="commentsStore.deleteComment(comment.key)" density="compact" variant="text" prepend-icon="mdi-delete">Löschen</v-btn>
                </v-col>
            </v-row>
            <v-row>
                <v-textarea class="comment" variant="solo" rows="1" auto-grow @change="commentsStore.updateComment(comment)" v-model="comment.comment"></v-textarea>
            </v-row>
        </v-container>
    </div>

</template>

<style scoped>
    .appMarkingComments {
        padding-right: 5px;
    }

    .container {
        margin-top: 0;
        mergin-bottom: 0;
        padding-top: 0;
        padding-bottom: 0;
    }

    .row {
    }

    .rightCol {
       text-align:right;
   }

    .comment {
        width:100%;
        font-family: Serif;
        font-size: 16px;
    }

</style>

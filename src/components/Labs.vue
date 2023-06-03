<script setup>
import ImageMarker from 'long-essay-image-marker/ImageMarker';
import Mark from 'long-essay-image-marker/Mark';
import { onMounted, reactive } from 'vue';
import bgb from '@/assets.bgb-hand.png';

let marker;

let demo = {
    key: 'demo-key',
    label: 'demo-label',
    color: '#D8E5F4',
    shape: Mark.SHAPE_RECTANGLE,
    x_position: 100,
    y_position: 100,
    width: 100,
    height: 200,
    poly_path: []
};

function setDemo(data) {
    demo.key = data.key;
    demo.label = data.label;
    demo.shape = data.shape;
    demo.x_position = data.x_position;
    demo.y_position = data.y_position;
    demo.width = data.width;
    demo.height = data.heigth;
    demo.poly_path = data.poly_path;
}

function getDemo() {
    return {
        key: demo.key,
        label: demo.label,
        color: demo.color,
        shape: demo.shape,
        x_position: demo.x_position,
        y_position: demo.y_position,
        width: demo.width,
        height: demo.height,
        poly_path: []
    }
}



onMounted(() => {
    marker = new ImageMarker(document.getElementById('appPlaygroundImageMarker'), onCreation, onSelection);
});

/**
 * Callback for creation
 * @param {Mark} created
 */
function onCreation(created) {
    console.log[Date.now(), 'onCreation', created];
    setDemo(created.getData());
}

/**
 * Callback for selection
 * @param {Mark} created
 */
function onSelection(selected) {
    console.log[Date.now(), 'onSelection', selected];
    setDemo(selected.getData());
}

function showPage() {
    marker.showPage(new URL(bgb, import.meta.url).href, [new Mark(demo.data)])
}

function addMark() {
   marker.addMark(new Mark(getDemo()));
}

function updateMark() {
    marker.updateMark(new Mark(getDemo()));
}

function removeMark() {
    marker.removeMark(demo.key)
}

function updateLabel() {
    marker.updateLabel(demo.key, demo.label);
}

function selectMark() {
    marker.selectMark(demo.key);
}


</script>

<template>
  <v-main fill-height>
    <div class="container">
      <div  class="column">
        <!-- Left Column Header -->
        <div class="col-header">
            <h2>ImageMarker</h2>
        </div>
        <!-- Left Column Content -->
        <div class="col-content">
            <div id="appPlaygroundImageMarker"></div>
        </div>
      </div>
      <div class="column" >
        <div class="col-header">
          <!-- Right Column Header -->
          <h2>Control</h2>
        </div>
        <!-- Right Column Content -->
        <div class="col-content">
            <label for="demoKey">Label</label>: <input id="demoKey" type="text" v-model="demo.key" /><br>
            <label for="demoLabel">Label</label>: <input id="demoLabel" type="text" v-model="demo.label" /><br>
            <label for="demoColor">Color</label>: <input id="demoColor" type="text" v-model="demo.color" /><br>
            <label for="demoShape">Shape</label>: <input id="demoShape" type="text" v-model="demo.shape" /><br>
            <label for="demoXPosition">X Position</label>: <input id="demoXPosition" type="text" v-model="demo.x_position" /><br>
            <label for="demoYPosition">Y Position</label>: <input id="demoYPosition" type="text" v-model="demo.y_position" /><br>
            <label for="demoWidth">Width</label>: <input id="demoWidth" type="text" v-model="demo.width" /><br>
            <label for="demoHeight">Height</label>: <input id="demoHeight" type="text" v-model="demo.height" /><br>
            <hr>
            <v-btn variant="text" @click="showPage()">Show Page</v-btn><br>
            <v-btn variant="text" @click="addMark()">Add Mark</v-btn><br>
            <v-btn variant="text" @click="updateMark()">Update Mark</v-btn><br>
            <v-btn variant="text" @click="removeMark()">Remove Mark</v-btn><br>
            <v-btn variant="text" @click="updateLabel()">Update Label</v-btn><br>
            <v-btn variant="text" @click="selectMark()">Select Mark</v-btn><br>
        </div>
      </div>
    </div>
  </v-main>


</template>

<style scoped>

/* Structure */

.appPlaygroundImageMarker {
    width: 100%;
    height: 100%;
}

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
  width: 50%;
  padding:10px;
}

.col-content {
  height: calc(100% - 50px);
  background-color: white;
  overflow: hidden;
  width: 50%;
  padding:10px;
}

input {
    border: 1px solid grey;
}

</style>

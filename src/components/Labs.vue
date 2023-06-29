<script setup>
import createImageMarker from 'long-essay-image-marker/ImageMarker';
import createMark, { SHAPES } from 'long-essay-image-marker/Mark';
import { onMounted, reactive, ref, computed } from 'vue';
import bgb from '@/assets/bgb-hand.png';

let marker;

const status = reactive({
    data: {
        key: 'demo-key',
        label: 'demo-label',
        color: '#D8E5F4',
        shape: SHAPES.RECTANGLE,
        pos: {x: 10, y: 10},
        width: Number(100),
        height: Number(200),
        polygon: []
    }
});

const mark = computed(() => ({
    ...status.data,
    pos: {x: Number(status.data.pos.x), y: Number(status.data.pos.y)},
    width: Number(status.data.width),
    height: Number(status.data.height),
}));

const markerNode = ref();

onMounted(() => {
    marker = createImageMarker(markerNode.value, onCreation, onSelection);
    showPage();
});

/**
 * Callback for creation
 * @param {Mark} created
 */
function onCreation(created) {
    console.log(Date.now(), 'onCreation', created);
    status.data = created;
}

/**
 * Callback for selection
 * @param {Mark} created
 */
function onSelection(selected) {
    console.log(Date.now(), 'onSelection', selected);
    status.data = selected;
}

function showPage() {
    marker.showPage(new URL(bgb, import.meta.url).href, [])
}

function addMark() {
   marker.addMark(createMark(mark.value));
}

function updateMark() {
    console.log(mark.value);
    marker.updateMark(mark.value);
}

function removeMark() {
    marker.removeMark(mark.value.key);
}

function selectMark() {
    marker.selectMark(mark.value.key);
}

function defaultColor() {
    marker.setDefaultColor(status.data.color);
}

function defaultShape() {
    marker.setDefaultShape(status.data.shape);
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
            <div class="appPlaygroundImageMarker" ref="markerNode"></div>
        </div>
      </div>
      <div class="column" >
        <div class="col-header">
          <!-- Right Column Header -->
          <h2>Control</h2>
        </div>
        <!-- Right Column Content -->
        <div class="col-content">
            <label for="demoKey">Mark key</label>: <input id="demoKey" type="text" v-model="status.data.key" /><br>
            <label for="demoLabel">Label</label>: <input id="demoLabel" type="text" v-model="status.data.label" /><br>
            <label for="demoColor">Color</label>: <input id="demoColor" type="text" v-model="status.data.color" /><br>
            <label for="demoShape">Shape</label>: <input id="demoShape" type="text" v-model="status.data.shape" /><br>
            <label for="demoXPosition">X Position</label>: <input id="demoXPosition" type="text" v-model="status.data.pos.x" /><br>
            <label for="demoYPosition">Y Position</label>: <input id="demoYPosition" type="text" v-model="status.data.pos.y" /><br>
            <label for="demoWidth">Width</label>: <input id="demoWidth" type="text" v-model="status.data.width" /><br>
            <label for="demoHeight">Height</label>: <input id="demoHeight" type="text" v-model="status.data.height" /><br>
            <hr>
            <v-btn variant="text" @click="showPage()">Show Page</v-btn><br>
            <v-btn variant="text" @click="addMark()">Add Mark</v-btn><br>
            <v-btn variant="text" @click="updateMark()">Update Mark</v-btn><br>
            <v-btn variant="text" @click="removeMark()">Remove Mark</v-btn><br>
            <v-btn variant="text" @click="selectMark()">Select Mark</v-btn><br>
            <v-btn variant="text" @click="defaultColor()">Set default color</v-btn><br>
            <v-btn variant="text" @click="defaultShape()">Set default shape</v-btn><br>
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
  padding:10px;
}

input {
    border: 1px solid grey;
}

</style>

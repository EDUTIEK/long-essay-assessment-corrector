<script setup>
import createImageMarker from 'long-essay-image-marker/ImageMarker';
import createMark, { SHAPES } from 'long-essay-image-marker/Mark';
import { onMounted, reactive, ref, computed } from 'vue';
import bgb from '@/assets/bgb-hand.png';

let marker;

const status = reactive({
    data: {
        key: '',
        label: '',
        color: '',
        selectedColor: '',
        shape: SHAPES.RECTANGLE,
        pos: {x: 0, y: 0},
        width: 0,
        height: 0,
        polygon: [],
        end: {x: 0, y: 0}
    }
});

const defaults = reactive({
    data: {
        color: '#0000AAAA',
        selectedColor: '#FF0000AA',
        shape: SHAPES.RECTANGLE,
        zommLevel: 1,
        mode: ''
    }
});

const mark = computed(() => ({
    ...status.data,
    pos: {x: Number(status.data.pos.x), y: Number(status.data.pos.y)},
    end: {x: Number(status.data.end.x), y: Number(status.data.end.y)},
    width: Number(status.data.width),
    height: Number(status.data.height),
}));

const markerNode = ref();

onMounted(() => {
    marker = createImageMarker(markerNode.value, onCreation, onSelection);
    showPage();
    setDefaultColor();
    setDefaultSelectedColor();
    setDefaultShape();
    drawMode();
});

/**
 * Callback for creation
 * @param {Mark} created
 */
function onCreation(created) {
    console.log(Date.now(), 'onCreation', created);
    // merges properties
    Object.assign(status.data, created);
}

/**
 * Callback for selection
 * @param {Mark} created
 */
function onSelection(selected) {
    console.log(Date.now(), 'onSelection', selected);
    // merges properties
    Object.assign(status.data, selected);
}

function showPage() {
    marker.showPage(new URL(bgb, import.meta.url).href, [])
}

function addMark() {
   marker.addMark(createMark(mark.value));
}

function updateMark() {
    marker.updateMark(mark.value);
}

function removeMark() {
    marker.removeMark(mark.value.key);
}

function selectMark() {
    marker.selectMark(mark.value.key);
}

function setAllDefaults() {
    setDefaultColor();
    setDefaultShape();
    setDefaultSelectedColor();
}

function setDefaultColor() {
    marker.setDefaultColor(defaults.data.color);
}

function setDefaultSelectedColor() {
    marker.setDefaultSelectedColor(defaults.data.selectedColor);
}

function setDefaultShape() {
    marker.setDefaultShape(defaults.data.shape);
}

function setZoomLevel() {
    marker.setZoomLevel(Number(defaults.data.zommLevel));
}

function drawMode() {
    marker.drawMode();
    defaults.data.mode = 'draw';
}

function scrollMode() {
    marker.scrollMode();
    defaults.data.mode = 'scroll';
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
        <div class="col-content-left">
            <div class="appPlaygroundImageMarker" ref="markerNode"></div>
        </div>
      </div>
      <div class="column" >
        <div class="col-header">
          <!-- Right Column Header -->
          <h2>Control</h2>
        </div>
        <!-- Right Column Content -->
        <div class="col-content-right">

            <h3>Current Mark</h3>

            <label for="demoKey">Mark key</label>: <input id="demoKey" type="text" v-model="status.data.key" /><br>
            <label for="demoLabel">Label</label>: <input id="demoLabel" type="text" v-model="status.data.label" /><br>
            <label for="demoShape">Shape</label>:
            <select id="demoShape" v-model="status.data.shape">
                <option :value="SHAPES.CIRCLE">Circle</option>
                <option :value="SHAPES.LINE">Line</option>
                <option :value="SHAPES.WAVE">Wave</option>
                <option :value="SHAPES.RECTANGLE">Rectangle</option>
                <option :value="SHAPES.POLYGON">Polygon</option>
            </select><br>
            <label for="demoColor">Color</label>: <input id="demoColor" type="text" v-model="status.data.color" /><br>
            <label for="demoSelectedColor">Selected Color</label>: <input id="demoColor" type="text" v-model="status.data.selectedColor" /><br>
            <label for="demoXPosition">X Position</label>: <input id="demoXPosition" type="text" v-model="status.data.pos.x" /><br>
            <label for="demoYPosition">Y Position</label>: <input id="demoYPosition" type="text" v-model="status.data.pos.y" /><br>
            <label for="demoWidth">Width</label>: <input id="demoWidth" type="text" v-model="status.data.width" /><br>
            <label for="demoHeight">Height</label>: <input id="demoHeight" type="text" v-model="status.data.height" /><br>
            <label for="demoEndXPosition">End X Position</label>: <input id="demoEndXPosition" type="text" v-model="status.data.end.x" /><br>
            <label for="demoEndYPosition">End Y Position</label>: <input id="demoEndYPosition" type="text" v-model="status.data.end.y" /><br>
            <label for="demoPolygon">Polygon</label>:{{JSON.stringify(status.data.polygon)}}<br>
            <hr>
            <v-btn variant="text" @click="showPage()">Show Page</v-btn> |
            <v-btn variant="text" @click="addMark()">Add Mark</v-btn> |
            <v-btn variant="text" @click="updateMark()">Update Mark</v-btn> |
            <v-btn variant="text" @click="removeMark()">Remove Mark</v-btn> |
            <v-btn variant="text" @click="selectMark()">Select Mark</v-btn>
            <hr>

            <h3>Default</h3>

            <label for="defaultColor">Color</label>: <input id="defaultColor" type="text" v-model="defaults.data.color" @change="setDefaultColor()" /><br>
            <label for="defaultSelectedColor">Selected Color</label>: <input id="defaultSelectedColor" type="text" v-model="defaults.data.selectedColor" @change="setDefaultSelectedColor()"/><br>
            <label for="defaultShape">Shape</label>:
            <select id="defaultShape" v-model="defaults.data.shape" @change="setDefaultShape()">
                <option :value="SHAPES.CIRCLE">Circle</option>
                <option :value="SHAPES.LINE">Line</option>
                <option :value="SHAPES.WAVE">Wave</option>
                <option :value="SHAPES.RECTANGLE">Rectangle</option>
                <option :value="SHAPES.POLYGON">Polygon</option>
            </select><br>
            <hr>
            <v-btn variant="text" @click="setAllDefaults()">Set defaults</v-btn>
            <hr>

            <h3>Canvas</h3>
            <label for="currentZoomLevel">Current Zoom Level</label>: <input id="zoomLevel" type="text" v-model="defaults.data.zommLevel" @change="setZoomLevel()" /><br>
            <label for="currentMode">Current Mode</label>: {{ defaults.data.mode }}<br>
            <hr>
            <v-btn variant="text" @click="setZoomLevel()">Set zoom level</v-btn>
            <v-btn variant="text" @click="drawMode()">Set draw mode</v-btn> |
            <v-btn variant="text" @click="scrollMode()">Set scroll mode</v-btn>
            <hr>

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

.col-content-left {
    height: calc(100% - 50px);
    background-color: white;
    overflow-y: hidden;
    padding:10px;
}

.col-content-right {
  height: calc(100% - 50px);
  background-color: white;
  overflow-y: scroll;
  padding:10px;
}

input, select {
    border: 1px solid grey;
    margin-bottom: 3px;
    padding: 3px;
}

</style>

<script setup>
import ImageMarker from 'long-essay-image-marker/ImageMarker';
import Mark from 'long-essay-image-marker/Mark';
import { onMounted, reactive } from 'vue';
import bgb from '@/assets/bgb-hand.png';

let marker;

let status = reactive({
    data: {
        key: 'demo-key',
        label: 'demo-label',
        color: '#D8E5F4',
        shape: Mark.SHAPE_RECTANGLE,
        x_position: 100,
        y_position: 100,
        width: 100,
        height: 200,
        poly_path: []
    }
});

onMounted(() => {
    marker = new ImageMarker(document.getElementById('appPlaygroundImageMarker'), onCreation, onSelection);
});

/**
 * Callback for creation
 * @param {Mark} created
 */
function onCreation(created) {
    console.log[Date.now(), 'onCreation', created];
    status.data = created.getData();
}

/**
 * Callback for selection
 * @param {Mark} created
 */
function onSelection(selected) {
    console.log[Date.now(), 'onSelection', selected];
    status.data = selected.getData();
}

function showPage() {
    marker.showPage(new URL(bgb, import.meta.url).href, [new Mark(status.data)])
}

function addMark() {
   marker.addMark(new Mark(status.data));
}

function updateMark() {
    marker.updateMark(new Mark(status.data));
}

function removeMark() {
    marker.removeMark(status.data.key)
}

function updateLabel() {
    marker.updateLabel(status.data.key, status.data.label);
}

function selectMark() {
    marker.selectMark(status.data.key);
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
            <label for="demoKey">Label</label>: <input id="demoKey" type="text" v-model="status.data.key" /><br>
            <label for="demoLabel">Label</label>: <input id="demoLabel" type="text" v-model="status.data.label" /><br>
            <label for="demoColor">Color</label>: <input id="demoColor" type="text" v-model="status.data.color" /><br>
            <label for="demoShape">Shape</label>: <input id="demoShape" type="text" v-model="status.data.shape" /><br>
            <label for="demoXPosition">X Position</label>: <input id="demoXPosition" type="text" v-model="status.data.x_position" /><br>
            <label for="demoYPosition">Y Position</label>: <input id="demoYPosition" type="text" v-model="status.data.y_position" /><br>
            <label for="demoWidth">Width</label>: <input id="demoWidth" type="text" v-model="status.data.width" /><br>
            <label for="demoHeight">Height</label>: <input id="demoHeight" type="text" v-model="status.data.height" /><br>
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

<script setup>
</script>

<template>
  <v-main fill-height>
    <div class="container">
      <div  class="column">
        <!-- Left Column Header -->
        <div class="col-header">
            <h2>Playground: ImageMarker</h2>
        </div>
        <!-- Left Column Content -->
        <div class="col-content">
        </div>
        <!-- Left Column Footer -->
        <div class="col-footer" >
        </div>
      </div>
      <div class="column" >
        <div class="col-header">
          <!-- Right Column Header -->
          <h2>Playground: Control</h2>
        </div>
        <!-- Right Column Content -->
        <div class="col-content">
        </div>
        <!-- Right Column Footer -->
        <div class="col-footer">
        </div>
      </div>
    </div>
  </v-main>


</template>

<style scoped>

/* Structure */

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
  height: calc(((100% - 50px)) - 70px);
  background-color: white;
  overflow: hidden;
  width: 50%;
  padding:10px;
}

.col-footer {
  width: 50%;
  position: fixed;
  bottom: 48px;
  padding:20px;
}

</style>

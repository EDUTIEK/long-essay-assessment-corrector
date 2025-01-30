<script setup>
import { useResourcesStore } from '@/store/resources';

const resourcesStore = useResourcesStore();

</script>

<template>
  <div class="resources">
    <template v-for="resource in resourcesStore.fileOrUrlResources" :key="resource.key">
      <div v-if="resource.type == 'file'" v-show="resourcesStore.getResourceIsActive(resource)">
        <!--
        <p><a :target= "'long-essay-writer-resource-' + resource.key" :href="apiStore.getResourceUrl(resource.key)">{{ resource.title }}</a></p>
        -->
        <object
            v-if="resource.mimetype =='application/pdf'"
            type="application/pdf"
            :data="resource.url"
            width="100%"
            height="100%">
        </object>
      </div>
      <div v-if="resource.type=='url' && resource.embedded == true" v-show="resourcesStore.getResourceIsActive(resource)">
        <iframe
            :src="resource.source"
            width="100%"
            height="100%"
            frameborder = 0
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
        >
        </iframe>
      </div>
    </template>
  </div>
</template>


<style scoped>

div {
  height: 100%;
}

</style>

<script setup>
import {useResourcesStore} from '@/store/resources';

const resourcesStore = useResourcesStore();
const resource = resourcesStore.getSolution;

</script>

<template>
    <div>
        <object
            v-if="resource.mimetype =='application/pdf'"
            type="application/pdf"
            :data="resource.objectUrl"
            width="100%"
            height="100%">
        </object>
    </div>
</template>


<style scoped>

div {
    height:100%;
}

</style>

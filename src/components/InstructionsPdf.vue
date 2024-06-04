<script setup>
import {useResourcesStore} from '@/store/resources';

const resourcesStore = useResourcesStore();
const resource = resourcesStore.instruction;

</script>

<template>
    <div>
        <object
            v-if="resource.mimetype =='application/pdf'"
            type="application/pdf"
            :data="resource.url"
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

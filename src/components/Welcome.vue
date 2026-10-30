<script setup>
/**
 * Default welcome page.
 * Vite serves public/welcome during development and copies it to dist/welcome
 * on build, so an installation can replace that folder without a rebuild.
 *
 * A replaced page opens the login dialog by posting to its parent:
 * parent.postMessage({ action: 'showLogin' }, location.origin)
 */
import { onMounted, onUnmounted, ref } from "vue";

const emit = defineEmits(['login'])
const frame = ref(null)
const welcomeSrc = `${import.meta.env.BASE_URL}welcome/index.html`

function onMessage(event) {
  if (event.origin !== window.location.origin) {
    return
  }
  if (event.source !== frame.value?.contentWindow) {
    return
  }
  const action = typeof event.data === 'string' ? event.data : event.data?.action
  if (action === 'showLogin') {
    emit('login')
  }
}

onMounted(() => window.addEventListener('message', onMessage))
onUnmounted(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <iframe
      ref="frame"
      class="welcome"
      :src="welcomeSrc"
      title="Willkommen"
  ></iframe>
</template>

<style scoped>
.welcome {
  position: fixed;
  z-index: 0;
  top: var(--v-layout-top, 48px);
  left: 0;
  width: 100%;
  height: calc(100dvh - var(--v-layout-top, 48px) - var(--v-layout-bottom, 0px));
  border: 0;
  display: block;
  background: #eef1f4;
}
</style>

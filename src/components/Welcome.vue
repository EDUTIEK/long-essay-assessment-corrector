<script setup>
/**
 * Default welcome page.
 * Vite serves public/welcome during development and copies it to dist/welcome
 * on build, so an installation can replace that folder without a rebuild.
 */
const welcomeSrc = `${import.meta.env.BASE_URL}welcome/index.html`
</script>

<template>
  <iframe
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

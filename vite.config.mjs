// Plugins
import Components from 'unplugin-vue-components/vite'
import vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  // edu: use a relative path
  // https://vitejs.dev/guide/build.html#public-base-path
  base: './',
  // edu.
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify(),
    Components(),
    ViteFonts({
      google: {
        families: [{
          name: 'Roboto',
          styles: 'wght@100;300;400;500;700;900',
        }],
      },
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
    // edu: needed for hot reload
    strictPort: true,
    hmr: {
      clientPort: 3000
    }
    // edu.
  },
  // edu: needed for tinymce
  // https://stackoverflow.com/questions/73125972/the-requested-module-node-modules-vite-deps-vue-js-does-not-provide-an-expor
  // build: {
  //   /** If you set esmExternals to true, this plugins assumes that
  //    all external dependencies are ES modules */
  //   commonjsOptions: {
  //     esmExternals: true
  //   },
  // }
  // edu.

})

// Plugins
import Components from 'unplugin-vue-components/vite'
import vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import path from 'path'
import fs from 'node:fs'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { resolve, dirname } from 'node:path'

// In development, serve dev.config.json as config.json when it exists.
// The build copies public/config.json unchanged and does not see this file.
function preferDevConfig() {
  const devConfigPath = path.resolve(__dirname, 'dev.config.json')
  return {
    name: 'prefer-dev-config',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/config.json' || !fs.existsSync(devConfigPath)) {
          next()
          return
        }
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        fs.createReadStream(devConfigPath).pipe(res)
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  // edu: use a relative path
  // https://vitejs.dev/guide/build.html#public-base-path
  base: './',
  // edu.
  plugins: [
    preferDevConfig(),
    vue({
      template: { transformAssetUrls }
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify(),
    Components(),
    ViteFonts({
    }),
    viteStaticCopy({targets: [
        {dest: 'annotate-pdf', src: path.resolve(__dirname, 'node_modules/annotate-pdf') + '/*'},
      ]}),
    VueI18nPlugin({
      /* options */
      module: 'petite-vue-i18n',
      // locale messages resource pre-compile option
      include: resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**'),
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

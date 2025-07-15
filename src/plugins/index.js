/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import vuetify from './vuetify'
import pinia from '../store'
import i18n from './i18n'

export function registerPlugins(app) {
  app
    .use(vuetify)
    .use(pinia)
    .use(i18n)
}

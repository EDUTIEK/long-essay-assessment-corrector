import {createI18n} from "petite-vue-i18n";
/*
 * All i18n resources specified in the plugin `include` option can be loaded
 * at once using the import syntax
 */
import messages from '@intlify/unplugin-vue-i18n/messages'

const i18n = createI18n({
    locale: 'de',
    messages
})

export default i18n;
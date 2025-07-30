import tinymce from "tinymce";
import {useSettingsStore} from "@/store/settings";
import {usePreferencesStore} from "@/store/preferences";
import {nextTick, ref, watch} from 'vue';
import i18n from "@/plugins/i18n";

import contentLocalCss from '@/styles/content.css?inline';
import headlinesThreeCss from '@/styles/headlines-three.css?inline';
import {useSnippetsStore} from "@/store/snippets";
import Snippet from "@/data/Snippet";

let settingsStore;
let preferencesStore;
let snippetsStore;

const { t } = i18n.global;

export default class TinyHelper {

    editor_id = null;
    editor = null;
    scroll_top = 0;
    scroll_left = 0;

    wordCount = ref(0);
    characterCount = ref(0);

    constructor(editor_id) {
        this.editor_id = editor_id;

        settingsStore = useSettingsStore();
        preferencesStore = usePreferencesStore();
        snippetsStore = useSnippetsStore();
    }

    getInit() {
        return {
            license_key: 'gpl',
            language: 'de',
            height: '100%',
            menubar: false,
            statusbar: false,
            elementpath: false,
            plugins: 'lists charmap wordcount',
            toolbar: this.toolbar(),
            valid_elements: this.validElements(),
            formats: this.formats(),
            style_formats: this.styleFormats(),
            custom_undo_redo_levels: 10,
            text_patterns: false,
            skin: 'default',
            content_css: 'default',
            content_style: contentLocalCss.toString() + '\n' + headlinesThreeCss.toString(),
            browser_spellcheck: true,
            highlight_on_focus: true,
            iframe_aria_text: t('tinyHelperIframeAriaText'),
            paste_as_text: false,         // keep formats when copying between clipboards
            paste_block_drop: true,       // prevent unfiltered content from drag & drop
            paste_merge_formats: true,    // default
            paste_tab_spaces: 4,          // default
            smart_paste: false,           // don't create hyperlinks automatically
            paste_data_images: false,     // don't paste images
            paste_remove_styles_if_webkit: true,  // default
            paste_webkit_styles: 'none',          // default
            setup: function (editor) {
                editor.ui.registry.addButton('zoomOut', {tooltip: 'Verkleinern', icon: 'zoom-out', onAction: this.zoomOut.bind(this)});
                editor.ui.registry.addButton('zoomIn', {tooltip: 'Vergrößern', icon: 'zoom-in', onAction: this.zoomIn.bind(this)});
                editor.ui.registry.addButton('openSnippets', {tooltip: 'Textbausteine', icon: 'plus', onAction: this.openSnippets.bind(this)});
            }.bind(this)
        }
    }

    toolbar() {
        // corrector always has full formatting options
        return 'zoomOut zoomIn undo redo styles bold italic underline bullist numlist removeformat charmap openSnippets';
    }

    /**
     * @see https://www.tiny.cloud/docs/configure/content-filtering/#valid_elements
     */
    validElements() {
        // corrector always has full formatting options
        return 'p/div,br,strong/b,em/i,u,ol,ul,li,h1,h2,h3,h4,h5,h6,pre';
    }

    /**
     * @see https://www.tiny.cloud/docs/configure/content-formatting/#formats
     */
    formats() {
        return {
            underline: { inline: 'u', remove: 'all' }
        }
    }

    styleFormats() {
        return [
            { title: t('settingsParagraph'), format: 'p' },
            { title: t('settingsHeading1'), format: 'h1' },
            { title: t('settingsHeading2'), format: 'h2' },
            { title: t('settingsHeading3'), format: 'h3' },
            { title: t('settingsTypewriter'), format: 'pre' },
            { title: t('settingsListElement'), block: 'li' },
        ];
    }

    /**
     * Init the editor
     * To be called from the init event handler
     * Can't be used directly used as handler
     */
    init() {
        this.editor = tinymce.get(this.editor_id);
        const window = this.editor.getWin();
        window.addEventListener('scroll', this.saveScrolling.bind(this));

        this.applyZoom();
        this.applyFormat();
    }

    zoomIn() {
        preferencesStore.zoomSummaryTextIn();
        this.applyZoom();
    }

    zoomOut() {
        preferencesStore.zoomSummaryTextOut();
        this.applyZoom();
    }

    openSnippets() {
        snippetsStore.openSelection(Snippet.FOR_SUMMARY, null, this.editor.selection.getContent());
    }


    /**
     * Set the focus to the editor
     */
    async applyFocus() {
        try {
            await nextTick();
            this.editor.focus();
        } catch (e) {
        }
    }

    /**
     * Add classes for the headline styles to the overlay element of the tiny menu
     */
    applyFormat() {
        for (const element of document.getElementsByClassName('tox-tinymce-aux')) {
            element.classList.add('headlines-three');
        }
    }

    /**
     * Apply a zoom level to the elements in the editor
     */
    applyZoom() {
        try {
            const editor = this.editor;
            if (editor) {
                editor.dom.setStyle(editor.dom.doc.body, 'font-size', (preferencesStore.summary_text_zoom) + 'rem');
                editor.dom.setStyle(editor.dom.select('h1'),
                    'font-size',
                    (preferencesStore.summary_text_zoom * 1.3) + 'rem');
                editor.dom.setStyle(editor.dom.select('h2'),
                    'font-size',
                    (preferencesStore.summary_text_zoom * 1.15) + 'rem');
                editor.dom.setStyle(editor.dom.select('h3'), 'font-size', (preferencesStore.summary_text_zoom) + 'rem');
                editor.dom.setStyle(editor.dom.select('h4'), 'font-size', (preferencesStore.summary_text_zoom) + 'rem');
                editor.dom.setStyle(editor.dom.select('h5'), 'font-size', (preferencesStore.summary_text_zoom) + 'rem');
                editor.dom.setStyle(editor.dom.select('h6'), 'font-size', (preferencesStore.summary_text_zoom) + 'rem');
            }
        }
        catch (e) {
            // prevent error when tiny is unloaded
        }
    }

    saveScrolling() {
        const window = this.editor.getWin();
        if (window.scrollX > 0 || window.scrollY > 0) {
            this.scroll_left = window.scrollX;
            this.scroll_top = window.scrollY;
        }
    }

    /**
     * Workaround for a TinyMCE bug in Chrome that set scrolling to top if editor is shown
     * This bug is fixed in TinyMCE 7.9.0
     * It can't be updated before it is supported by tinymce-vue
     */
    restoreScrolling() {
        try {
            const window = this.editor.getWin();
            window.scroll({left: this.scroll_left, top: this.scroll_top});
        }
        catch(e) {
            console.log(e);
        }
    }

    /**
     * Fix for dragon extension in chrome browser
     * CAUTION: this causes strange effects - do not use!
     */
    applyScrolling() {
        try {
            const selection = this.editor.selection.getNode();

            // not available in all browsers
            // if (Element.prototype.scrollIntoViewIfNeeded) {
            // }

            const selRect = selection.getBoundingClientRect();
            const contRect = this.editor.getContentAreaContainer().getBoundingClientRect();
            if (selRect.top < contRect.top || selRect.bottom > contRect.bottom
                || selRect.right > contRect.right || selRect.left < contRect.left) {
                selection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * Insert a content at caret position
     */
    insertContent(content) {
        try {
            this.editor.insertContent(content);
        } catch (e) {
            console.log(e);
        }
    }
}

/**
 * Config Store
 * handles the editor config of the assessment and the connection urls
 */
import {getStorage} from "@/lib/Storage";
import i18n from "@/plugins/i18n";
import {defineStore} from 'pinia';
import Comment from "@/data/Comment";
import Correction from "@/data/Correction";
import {stores} from "@/store/index";
import vuetify from '@/plugins/vuetify';

const storage = getStorage('config');

const { t } = i18n.global

const startState = {
  // saved in storage
  backendUrl: null,                  // url to be used for REST calls
  returnUrl: null,                   // url to be called when the correction is closed
  primary_color: null,            // color for the background of primary actions
  corrector1_color: null,         // marking color of corrector 1
  corrector2_color: null,         // marking color of corrector 2
  corrector3_color: null          // marking color of corrector 3
}

function hexToRgba(hex, alpha) {
  hex = hex.replace(/^#/, '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const useConfigStore = defineStore('config', {
  state: () => {
    return startState;
  },

  getters: {

    getDefaultCommentColor(state) {

      const correctionStore = stores.corrections();
      const own_position = correctionStore.ownCorrection?.position;

      /**
       * Get the default color used for marking an own comment
       */
      const fn = function (selected = false, filled = false) {
        return state.getCommentColor(own_position, selected, filled);
      }
      return fn;
    },

    getCommentColor(state) {

      /**
       * Get the color used for marking a comment
       *
       * @param {number} position the correctors grading position (0 to 2)
       * @param {bool} selected the color is for selected comments
       * @param {bool} filled the color is for filled markup (e.g. text highlight)
       * @returns {string} color hex code with alpha value, e.g. #AABBCC00
       */
      const fn = function (position, selected = false, filled = false) {
        switch (position) {
          case 0:
            return '#' + state.corrector1_color.toUpperCase() + (selected || !filled ? 'FF' : '33');
          case 1:
            return '#' + state.corrector2_color.toUpperCase() + (selected || !filled ? 'FF' : '33');
          case 2:
            return '#' + state.corrector3_color.toUpperCase() + (selected || !filled ? 'FF' : '33');
          default:
            return '#CCCCCC' + (selected || !filled  ? 'FF' : '33');
        }
      }
      return fn;
    },

    getCommentStyle(state) {

      /**
       * Get the style attribute for a comment by correction position and selection
       *
       * @param {number} position
       * @param {bool} selected the color is for selected comments
       * @param {bool} filled the color is for filled markup (e.g. text highlight)
       * @returns {string}
       */
      const fn = function (position, selected = false, filled = false) {
        return 'background-color: ' +  state.getCommentColor(position, selected, filled);
      }
      return fn;
    },

    getCorrectionHeaderStyle(state) {

      /**
       * Get the style attribute for section headers of marking and summary columns
       *
       * @param {number} position
       * @returns {string}
       */
      const fn = function (position) {
        if (Correction.ALLOWED_POSITIONS.includes(position)) {
          return 'background-color: ' +  state.getCommentColor(position, false, true);
        }
        return 'background-color: #f0f0f0';
      }
      return fn;
    },

    getCorrectionIconStyle(state) {

      /**
       * Get the style attribute for the nav bar icon of a corrector
       *
       * @param {number} position
       * @returns {string}
       */
      const fn = function (position) {
        if (Correction.ALLOWED_POSITIONS.includes(position)) {
          return 'background-color: ' +  state.getCommentColor(position, true, false) + '!important;';
        }
        return '';
      }
      return fn;
    }

  },

  actions: {

    async clearStorage() {
      // Don't clear the config store because these values need to be kept for a page reload
    },

    async loadFromConfig() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: 'no-store' });
        if (response.ok) {
          this.applyData(await response.json());
        }
      } catch (err) {
        console.log(err);
      }
    },

    async loadFromStorage() {
      try {
        //this.applyData(await storage.getItem('config'));
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromBackend(data) {
      try {
        this.applyData(data);
        this.saveToStorage();
      }
      catch (err) {
        console.log(err);
      }
    },

    applyData(data) {
      if (data == null) {
        return;
      }

      const patch = {};
      for (const key of Object.keys(this.$state)) {
        if (data[key] !== undefined && data[key] !== null) {
          patch[key] = data[key];
        }
      }
      this.$patch(patch);

      // apply to the theme
      if (this.primary_color !== null) {
        vuetify.theme.themes.value.light.colors.primary = '#' + this.primary_color;
      }
    },

    async saveToStorage() {
      const persisted = Object.assign({}, this.$state);
      await storage.setItem('config', persisted);
    }
  }
});

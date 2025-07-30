import { defineStore } from 'pinia';
import localForage from "localforage";
import Summary from '@/data/Summary';
import i18n from "@/plugins/i18n";

const storage = localForage.createInstance({
  storeName: "corrector-settings",
  description: "Settings data",
});

const { t } = i18n.global;

/**
 * Settings Store
 * Handles the editor settings of the writing task
 */
export const useSettingsStore = defineStore('settings', {
  state: () => {
    return {
      // saved in storage
      mutual_visibility: false,       // corrector sees other correctors
      multi_color_highlight: false,   // text can be highlightes in multi colors
      max_points: 0,                  // maximum points that can be given
      max_auto_distance: 0,           // maximum distance between points to allow an automated points calculation
      stitch_when_distance: false,    // stitch decision is needed when the distance is higher than the max_auto_distance
      stitch_when_decimals: false,    // stitch decision is needed when the average points have decimals
      positive_rating: t('settingsRatingPositive'),   // label of a positive rating
      negative_rating: t('settingsRatingNegative'),    // label of a negative rating
      headline_scheme: null,          // headline scheme of the essay
      fixed_inclusions: false,                        // fix the inclusion settings (don't allow a change)
      include_comments: Summary.INCLUDE_INFO,          // include comments in the authorized correction
      include_comment_ratings: Summary.INCLUDE_INFO,   // include comment ratings in the authorized correction
      include_comment_points: Summary.INCLUDE_INFO,    // include comment points in the authorized correction
      include_criteria_points: Summary.INCLUDE_INFO   // include criteria points in the authorized correction
    }
  },

  getters: {
    ratingLabels: state => '"' + state.positive_rating + '" und "' + state.negative_rating + '"',
    headlineClass: state => state.headline_scheme === 'three' ? 'headlines-three' : '',

    summaryInclusions: state => {
      return {
        include_comments: state.include_comments,
        include_comment_ratings: state.include_comment_ratings,
        include_comment_points: state.include_comment_points,
        include_criteria_points: state.include_criteria_points
      };
    },

    inclusionsChangeable: state => state.fixed_inclusions == false,

    inclusionsPossible: state => {
      return state.fixed_inclusions == false
        || state.include_comments != Summary.INCLUDE_NOT
        || state.include_comment_ratings != Summary.INCLUDE_NOT
        || state.include_comment_points != Summary.INCLUDE_NOT
        || state.include_criteria_points != Summary.INCLUDE_NOT;
    }
  },

  actions: {
    async clearStorage() {
      try {
        await storage.clear();
      }
      catch (err) {
        console.log(err);
      }
      this.$reset();
    },


    async loadFromStorage() {
      try {
        const data = await storage.getItem('settings');
        this.$patch(data);
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromData(data) {
      try {
        await storage.setItem('settings', data);
        this.$patch(data);
      }
      catch (err) {
        console.log(err);
      }
    }
  }
});

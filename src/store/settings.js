import { defineStore } from 'pinia';
import localForage from "localforage";

const storage = localForage.createInstance({
    storeName: "corrector-settings",
    description: "Settings data",
});

/**
 * Settings Store
 * Handles the editor settings of the writing task
 */
export const useSettingsStore = defineStore('settings',{
    state: () => {
        return {
            // saved in storage
            mutual_visibility: false,       // corrector sees other correctors
            multi_color_highlight: false,   // text can be highlightes in multi colors
            max_points: 0,                  // maximum points that can be given
            max_auto_distance: 0,           // maximum distance between points to allow an automated points calculation
            stitch_when_distance: false,    // stitch decision is needed when the distance is higher than the max_auto_distance
            stitch_when_decimals: false,    // stitch decision is needed when the average points have decimals
            positive_rating: 'Exzellent',   // label of a positive rating
            negative_rating: 'Kardinal',    // label of anegative rating

        }
    },

    getters: {
      ratingLabels: state => '"' + state.positive_rating + '" und "' + state.negative_rating + '"'
        
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
            } catch (err) {
                console.log(err);
            }
        },

        async loadFromData(data) {
            try {
                await storage.setItem('settings', data);
                this.$patch(data);
            } catch (err) {
                console.log(err);
            }
        }
    }
});
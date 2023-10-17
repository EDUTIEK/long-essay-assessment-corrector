import { defineStore } from 'pinia';
import localForage from "localforage";
import {useApiStore} from "./api";
import {useLevelsStore} from '@/store/levels';

const storage = localForage.createInstance({
    storeName: "corrector-essay",
    description: "Essay data",
});

/**
 * Essay Store
 * Handles the essay to be corrected
 */
export const useEssayStore = defineStore('essay',{
    state: () => {
        return {
            // saved in storage
            text: null,             // processed essay text
            started: null,          // unix timestamp of writing start
            ended: null,            // unix timestamp of writing end
            authorized: null,       // essay is authorized by the writer

            // for stitch decision
            correction_finalized: null,
            final_points: null,
            stitch_comment: null
        }
    },

    /**
     * Getter functions (with params) start with 'get', simple state queries not
     */
    getters: {

        isFinalized: state => state.correction_finalized,

        grade: state => {
            const levelsStore = useLevelsStore();
            let level = levelsStore.getLevelForPoints(state.final_points);
            if (level !== null) {
                return level.title
            }
            return '';
        },
        
        gradeKey: state => {
            const levelsStore = useLevelsStore();
            let level = levelsStore.getLevelForPoints(state.final_points);
            if (level !== null) {
                return level.key
            }
            return '';
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
        },


        async saveStitchDecision() {

            const apiStore = useApiStore();
            const correction_finalized = apiStore.getServerTime(Date.now());
            const data = {
                'final_points': this.final_points,
                'stitch_comment': this.stitch_comment,
                'grade_key': this.gradeKey,
                'correction_finalized' : correction_finalized,
            }

            if (await apiStore.saveStitchDecisionToBackend(data)) {
                this.correction_finalized = correction_finalized;
                
                await storage.setItem('settings', {
                    text: this.text,
                    started: this.started,
                    ended: this.ended,
                    authorized: this.authorized,

                    correction_finalized: this.correction_finalized,
                    final_points: this.final_points,
                    stitch_comment: this.stitch_comment
                });
            }
        },
    }
});

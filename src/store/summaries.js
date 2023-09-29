import { defineStore } from 'pinia';
import localForage from "localforage";
import api from "js-cookie";
import {useApiStore} from "./api";
import {useCorrectorsStore} from "./correctors";
import {usePointsStore} from "./points";
import {useTaskStore} from "./task";
import {useSettingsStore} from "./settings";
import {useLevelsStore} from "./levels";
import Summary from '@/data/Summary';



const storage = localForage.createInstance({
    storeName: "corrector-summaries",
    description: "Corrector summaries data",
});

// set check interval very short to update the grade level according the points
const checkInterval = 200;      // time (ms) to wait for a new update check (e.g. 0.2s to 1s)

function startState() {

    return {
        // saved in storage
        keys: [],                   // list of string keys of all summaries in the storage
        editSummary: new Summary(), // summary of the acticve corrector that can is edited
        summaries: {},              // list of all summary objects for the currrent correction item, indexed by key
        unsentChanges: {},          // assoc array of changes that have to be sent to the backend: key => timestamp
                                    //  this may inclode own summaries of other items

        lastCheck: 0,               // timestamp (ms) of the last check if an update needs a storage
    }
}

/**
 * Update the grade key from the given points in a summary
 */
function setGradeKeyFromPoints(summary) {
    const levelsStore = useLevelsStore();
    let level = levelsStore.getLevelForPoints(summary.points);
    if (level) {
        summary.grade_key = level.key
    }
    else {
        summary.grade_key = '';
    }
}


let lockUpdate = 0;             // prevent updates during a processing


/**
 * Comments Store
 */
export const useSummariesStore = defineStore('summaries',{
    state: () => {
        return startState();
    },

    /**
     * Getter functions (with params) start with 'get', simple state queries not
     */
    getters: {

        countUnsentChanges: state => Object.keys(state.unsentChanges).length,
        openSending: state => state.countUnsentChanges > 0,

        isAuthorized: state => state.editSummary.is_authorized,
        
        storedSummary: state => state.summaries[state.editSummary.getKey()],

        currentGradeTitle(state) {
            if (state.editSummary.grade_key) {
                const levelsStore = useLevelsStore();
                let level = levelsStore.getLevel(state.editSummary.grade_key);
                if (level) {
                    return level.title;
                }
            }
            return 'ohne Notenstufe';
        },

        getStitchReasonText(state) {
            let min_points = null;
            let max_points = null;
            let sum_points = 0;
            let count_points = 0;
            
            for (key in state.summaries) {
                const points = state.summaries[key].points;
                if (points !== null) {
                    sum_points += points;
                    count_points++;

                    if (min_points === null || points < min_points) {
                        min_points = points;
                    }
                    if (max_points === null || points > max_points) {
                        max_points = points;
                    }
                }
            }

            if (count_points == 0) {
                return '';
            }

            const settingsStore = useSettingsStore();
            if (settingsStore.stitch_when_distance) {
                if (max_points - min_points > settingsStore.max_auto_distance) {
                    return 'Der Punkteunterschied übersteigt ' + settingsStore.max_auto_distance + ' Punkte!';
                }
            }
            if (settingsStore.stitch_when_decimals) {
                let average = sum_points / count_points;
                if (Math.floor(average) < average) {
                    return 'Der Punktedurchschnitt ' + average + ' ist keine ganze Zahl!';
                }
            }

            return '';
        },
    },

    actions: {
                
        /**
         * Clear the whole storage
         * @public
         */
        async clearStorage() {
            try {
                await storage.clear();
            }
            catch (err) {
                console.log(err);
            }
        },

        /**
         * Load the comments data from the storage
         * Only the comments of the current item are loaded to the state
         *
         * @param {string} currentItemKey - key of the correction item that is shown
         * @param {string} correctorKey - key of the active corrector
         * @public
         */
        async loadFromStorage(currentItemKey, correctorKey) {
            
            try {
                this.$state = startState();
                
                const keys = await storage.getItem('keys');
                if (keys) {
                    this.keys = JSON.parse(keys);
                }
                const unsentChanges = await storage.getItem('unsentChanges');
                if (unsentChanges) {
                    this.unsentChanges = JSON.parse(unsentChanges);
                }

                this.summaries = [];
                for (const key of this.keys) {
                    const summary = new Summary(JSON.parse(await storage.getItem(key)));
                    if (summary.item_key == currentItemKey) {
                        this.summaries.push(summary);
                    }
                    if (summary.corrector_key == correctorKey) {
                        this.editSummary = summary;
                    }
                }
                
            } catch (err) {
                console.log(err);
            }
        },

        /**
         * Load the summaries data from the backend
         *
         * All keys and summaries are put to the storage
         * Only the summaries of the current item are loaded to the state
         *
         * @param {array} data - array of plain objects
         * @param {string} currentItemKey - key of the correction item that is shown
         * @param {string} correctorKey - key of the active corrector
         * @public
         */
        async loadFromData(data, currentItemKey, correctorKey) {
            try {
                this.$state = startState();
                
                await storage.clear();

                for (const summary_data of data) {
                    const summary = new Summary(summary_data);
                    this.keys.push(summary.getKey());
                    await storage.setItem(comment.key, JSON.stringify(comment.getData()));
                    if (summary.item_key == currentItemKey) {
                        this.summaries.push(summary);
                    }
                    if (summary.corrector_key == correctorKey) {
                        this.editSummary = summary.getClone();
                    }
                };
                

                await storage.setItem('keys', JSON.stringify(this.keys));
                await storage.setItem('unsentChanges', JSON.stringify(this.unsentChanges));
            }
            catch (err) {
                console.log(err);
            }

            lockUpdate = 0;
            setInterval(this.updateContent, checkInterval);
        },

        
        /**
         * Update the stored content
         * Triggered from the editor component when the content is changed
         * Triggered every checkInterval
         */
        async updateContent(fromEditor = false, trySend = true, force = false) {

            const storedSummary = this.summaries[this.editSummary.getKey()];
            
            // don't update if authorized
            if (storedSummary.is_authorized) {
                return;
            }

            // avoid too many checks
            const currentTime = Date.now();
            if ((currentTime - this.lastCheck < checkInterval) && !force) {
                return;
            }

            // avoid parallel updates
            // no need to wait because updateContent is called by interval
            // use post-increment for test-and set
            if (lockUpdate++ && !force) {
                return;
            }

            // don't accept changes after correction end
            const taskStore = useTaskStore();
            if (taskStore.correctionEndReached) {
                return;
            }

            // limit the points
            const settingsStore = useSettingsStore();
            if (this.editSummary.points < 0) {
                this.editSummary.points = 0;
            }
            if (this.editSummary.points > settingsStore.max_points) {
                this.editSummary.points = settingsStore.max_points;
            }

            // set the grade key for the points
            if (this.editSummary.points != storedSummary.points) {
               setGradeKeyFromPoints(this.editSummary)
            }

            try {
                // ensure it is not changed because it is bound to tiny
                const clonedSummary = this.editSummary.getClone();
                
                if (!clonedSummary.isEqual(storedSummary) && this.keys.includes(clonedSummary.getKey())) {
                    const apiStore = useApiStore();
                    clonedSummary.last_change = apiStore.serverTime(Date.now());
                   
                    this.editSummary.setData(clonedSummary.getData());
                    this.summaries[clonedSummary.getKey()] = clonedSummary;

                    await storage.setItem(storedSummary.getKey(), JSON.stringify(clonedSummary.getData()));
                    await this.setUnsent(clonedSummary.getKey());
                    
                    console.log(
                      "Save Change ",
                      "| Editor: ", fromEditor,
                      "| Duration:", Date.now() - currentTime, 'ms');

                }
                // set this here
                this.lastCheck = currentTime;
            }
            catch(error) {
                console.error(error);
            }

            lockUpdate = 0;
        },


        /**
         * Check if unsent changes are in the storage
         * (called from api store at initialisation)
         */
        async hasUnsentChangesInStorage() {
            const data = await storage.getItem('unsentChanges');
            const unsentChanges = data ? JSON.parse(data) : {};
            return Object.keys(unsentChanges).length > 0;
        },


        /**
         * Add a note that a summary has to be sent to the backend
         * This is called for added, updated and removed comments
         * @param {string} key
         */
        async setUnsent(key) {
            this.unsentChanges[key] = Date.now();
            await storage.setItem('unsentChanges', JSON.stringify(this.unsentChanges));
        },
        

        /**
         * Get all unsent summaries from the storage as flat data objects
         * These may include summaries of other items that are only in the storage
         * This is called for sending the summaries to the backend
         * @param {integer} sendingTime - timestamp of the sending or 0 to get all
         * @return {object} key => object|null
         */
        async getUnsentData(sendingTime = 0) {
            let data_list = {};
            for (const key in this.unsentChanges) {
                if (sendingTime == 0 || this.unsentChanges[key] < sendingTime) {
                    let data = await storage.getItem(key)
                    if (data) {
                        data_list[key] = JSON.parse(data);
                    } else {
                        data_list[key] = null;
                    }
                }
            };
            return data_list;
        },


        /**
         * Set summaries as sent
         *
         * @param {integer} sendingTime - timestamp of the sending
         */
        async setSummariesSent(sendingTime) {

            // cleanup the unsent changes
            let remainingChanges = {};
            for (const key in this.unsentChanges) {
                let time = this.unsentChanges[key];
                // keep change that is newer than the sending
                if (time >= sendingTime) {
                    remainingChanges[key] = time;
                }
            }
            this.unsentChanges = remainingChanges;
            await storage.setItem('unsentChanges', JSON.stringify(this.unsentChanges));
        }
    }
});

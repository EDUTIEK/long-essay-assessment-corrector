import { defineStore } from "pinia";
import localForage from "localforage";
import {useApiStore} from "@/store/api";
import {useCorrectorsStore} from "@/store/correctors";
import {usePointsStore} from "@/store/points";
import {useTaskStore} from "@/store/task";
import {useSettingsStore} from "@/store/settings";
import {useLevelsStore} from "@/store/levels";
import {useChangesStore} from "@/store/changes";
import Summary from "@/data/Summary";
import Change from "@/data/Change";


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
        editSummary: new Summary(), // summary of the currector corrector that is actively edited
        summaries: {},              // list of all summary objects for the current item, indexed by key

        // not saved in storage
        lastCheck: 0,               // timestamp (ms) of the last check if an update needs a storage
    }
}

let lockUpdate = 0;             // prevent updates during a processing


/**
 * Summaries Store
 */
export const useSummariesStore = defineStore('summaries',{
    state: () => {
        return startState();
    },

    /**
     * Getter functions (with params) start with 'get', simple state queries not
     */
    getters: {

        /**
         * Is the summary of thecorrent corrector and item authorized
         * @returns {bool}
         */
        isOwnAuthorized: state => state.editSummary.is_authorized,
        
        areOthersAuthorized: state => {
            for (const key in state.summaries) {
                const summary = state.summaries[key];
                if (summary.getKey() != state.editSummary.getKey() && !summary.is_authorized) {
                    return false;
                }
            }
            return true;
        },

        /**
         * Resulting grade title from the summary of the currentcorrector and item
         * @returns {string}
         */
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

        getForCorrector: state => {

            /**
             * Get a summary of a specific corrector for the current item
             * @param {string} corrector_key
             * @returns {Summary}
             */
            const fn = function(corrector_key) {
              for (const key in state.summaries) {
                  const summary = state.summaries[key];
                  if (summary.corrector_key == corrector_key) {
                      return summary;
                  }
              }
              return null;
          }
          return fn;
        },

        /**
         * Text why a stitch decision will be needed the current item
         * @returns {string}
         */
        stitchReasonText: state => {
            let min_points = null;
            let max_points = null;
            let sum_points = 0;
            let count_points = 0;
            
            // loop over all summaries for the current correction item
            for (const key in state.summaries) {
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

        /**
         * Minimum points all summaries for the current item
         * @returns {number|null}
         */
        minPoints: state => {
            let minPoints = null;
            for (const key in state.summaries) {
                const points = state.summaries[key].points;
                if (minPoints === null || points < minPoints) {
                    minPoints = points;
                }
            }
            return minPoints;
        },

        /**
         * Maximum points all summaries for the current item
         * @returns {number|null}
         */
        maxPoints: state => {
            let maxPoints = null;
            for (const key in state.summaries) {
                const points = state.summaries[key].points;
                if (maxPoints === null || points > maxPoints) {
                    maxPoints = points;
                }
            }
            return maxPoints;
        }
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
            this.$reset();
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
                this.$reset();
                
                const keys = await storage.getItem('keys');
                if (keys) {
                    this.keys = JSON.parse(keys);
                }
                
                for (const key of this.keys) {
                    const summary = new Summary(JSON.parse(await storage.getItem(key)));
                    if (summary.item_key == currentItemKey) {
                        this.summaries[key] = summary;
                    }
                    if (summary.corrector_key == correctorKey) {
                        this.editSummary = summary.getClone();
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
                this.$reset();
                
                await storage.clear();

                for (const summary_data of data) {
                    const summary = new Summary(summary_data);
                    this.keys.push(summary.getKey());
                    await storage.setItem(summary.getKey(), JSON.stringify(summary.getData()));
                    if (summary.item_key == currentItemKey) {
                        this.summaries[summary.getKey()] = summary;
                    }
                    if (summary.corrector_key == correctorKey) {
                        this.editSummary = summary.getClone();
                    }
                };
                
                await storage.setItem('keys', JSON.stringify(this.keys));
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
        async updateContent(fromEditor = false, force = false) {

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
                const levelsStore = useLevelsStore();
                let level = levelsStore.getLevelForPoints(this.editSummary.points);
                if (level) {
                    this.editSummary.grade_key = level.key
                }
                else {
                    this.editSummary.grade_key = '';
                }
            }

            try {
                // ensure it is not changed because it is bound to tiny
                const clonedSummary = this.editSummary.getClone();
                
                if (!clonedSummary.isEqual(storedSummary) && this.keys.includes(clonedSummary.getKey())) {
                    const apiStore = useApiStore();
                    const changesStore = useChangesStore();
                    
                    clonedSummary.last_change = apiStore.serverTime(Date.now());
                   
                    this.editSummary.setData(clonedSummary.getData());
                    this.summaries[clonedSummary.getKey()] = clonedSummary;

                    await storage.setItem(storedSummary.getKey(), JSON.stringify(clonedSummary.getData()));
                    await changesStore.setChange(new Change({
                        type: Change.TYPE_SUMMARY,
                        action: Change.ACTION_SAVE,
                        key: clonedSummary.getKey(),
                        item_key: clonedSummary.item_key
                    }))
                    
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
         * Get all changed summaries from the storage as flat data objects
         * These may include summaries of other items that are only in the storage
         * This is called for sending the summaries to the backend
         * @param {integer} sendingTime - timestamp of the sending or 0 to get all
         * @return {array} Change objects
         */
        async getChangedData(sendingTime = 0) {
            const changesStore = useChangesStore();
            const changes = [];
            for (const change of changesStore.getChangesFor(Change.TYPE_SUMMARY, sendingTime)) {
                if (change.action == Change.ACTION_SAVE) {
                    const data = await storage.getItem(change.key);
                    if (data) {
                        change.payload = JSON.parse(data);
                    } 
                    changes.push(change);
                }
            };
            return changes;
        },

        /**
         * Set the own current summary as authorized
         */
        async setOwnAuthorized() {
            this.editSummary.is_authorized = true;
            await this.updateContent(false, true);
        },

    }
});

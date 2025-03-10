import { defineStore } from "pinia";
import localForage from "localforage";
import { useApiStore } from "@/store/api";
import { useCriteriaStore } from "@/store/criteria";
import { useCommentsStore } from "@/store/comments";
import { useTaskStore } from "@/store/task";
import { useSettingsStore } from "@/store/settings";
import { useLevelsStore } from "@/store/levels";
import { useChangesStore } from "@/store/changes";
import { usePreferencesStore } from '@/store/preferences';

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
    summaries: {},              // list of all summary objects for the current item, indexed by key

    // not saved in storage
    editSummary: new Summary(), // summary of the currector corrector that is actively edited
    lastCheck: 0,               // timestamp (ms) of the last check if an update needs a storage
  }
}

let lockUpdate = 0;             // prevent updates during a processing


/**
 * Summaries Store
 */
export const useSummariesStore = defineStore('summaries', {
  state: () => {
    return startState();
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    /**
     * Is an editing of the current corrector and item isabled
     * @param state
     * @return {bool|boolean|*}
     */
    isOwnDisabled: state => state.editSummary.corrector_key == '' || state.editSummary.is_authorized,

    /**
     * Is the summary of the current corrector and item authorized
     * @returns {bool}
     */
    isOwnAuthorized: state => state.editSummary.is_authorized,

    isOneAuthorized: state => {
      for (const key in state.summaries) {
        const summary = state.summaries[key];
        if (summary.is_authorized) {
          return true;
        }
      }
      return false;
    },

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
     * Partial points of the current corrector and item are included
     * These may be summed up from comment or criteria related points
     * @return {float}
     */
    currentPartialPointsAreIncluded: state => {
      const criteriaStore = useCriteriaStore();
      if (criteriaStore.hasOwnCriteria) {
        return (state.currentInclusionSettings.include_criteria_points > Summary.INCLUDE_NOT);
      } else {
        return (state.currentInclusionSettings.include_comment_points > Summary.INCLUDE_NOT);
      }
    },


    /**
     * Resulting grade title from the summary of the current corrector and item
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

    /**
     * Get the effective inclusion settings for the current summary (with defaults)
     * @param state
     * @return {{include_comment_points, include_comment_ratings, include_criteria_points, include_comments}}
     */
    currentInclusionSettings: state => {
      const settingsStore = useSettingsStore();
      const preferencesStore = usePreferencesStore();

      if (settingsStore.fixed_inclusions) {
        return settingsStore.summaryInclusions
      }
      return state.editSummary.getInclusionSettings(preferencesStore.summaryInclusions);
    },

    getAuthorizationForCorrector: state => {
      /**
       * Get a summary of a specific corrector for the current item
       * @param {string} corrector_key
       * @returns {bool}
       */
      const fn = function (corrector_key) {
        for (const key in state.summaries) {
          const summary = state.summaries[key];
          if (summary.corrector_key == corrector_key) {
            return summary.is_authorized;
          }
        }
        return false;
      }
      return fn;
    },


    getForCorrector: state => {

      /**
       * Get a summary of a specific corrector for the current item
       * @param {string} corrector_key
       * @returns {Summary}
       */
      const fn = function (corrector_key) {
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


    getInclusionText: state => {
      const settingsStore = useSettingsStore();
      const criteriaStore = useCriteriaStore();

      /**
       *
       * @param {Summary} summary
       * @return {string}
       */
      const fn = function (summary) {
        let text = '';
        let settings = {};

        if (summary.corrector_key == state.editSummary.corrector_key) {
          settings = state.currentInclusionSettings;
        } else {
          settings = summary.getInclusionSettings();
        }

        if (settings.include_comments == Summary.INCLUDE_INFO) {
          text = (text ? text + ', ' : '') + 'Anmerkungen (i)';
        } else if (settings.include_comments == Summary.INCLUDE_RELEVANT) {
          text = (text ? text + ', ' : '') + 'Anmerkungen (r)';
        }

        if (settings.include_comment_ratings == Summary.INCLUDE_INFO) {
          text = (text ? text + ', ' : '') + settingsStore.ratingLabels + ' (i)';
        } else if (settings.include_comment_ratings == Summary.INCLUDE_RELEVANT) {
          text = (text ? text + ', ' : '') + settingsStore.ratingLabels + ' (r)';
        }

        if (settings.include_comment_points == Summary.INCLUDE_INFO) {
          text = (text ? text + ', ' : '') + 'Punkte zu Anmerkungen (i)';
        } else if (settings.include_comment_points == Summary.INCLUDE_RELEVANT) {
          text = (text ? text + ', ' : '') + 'Punkte zu Anmerkungen (r)';
        }

        if (criteriaStore.hasOwnCriteria) {
          if (settings.include_criteria_points == Summary.INCLUDE_INFO) {
            text = (text ? text + ', ' : '') + 'Punkte zu Kriterien (i)';
          } else if (settings.include_criteria_points == Summary.INCLUDE_RELEVANT) {
            text = (text ? text + ', ' : '') + 'Punkte Kriterien (r)';
          }
        }


        if (text == '') {
          text = 'keine Detail-Informationen'
        }

        return text;
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
     * @public
     */
    async loadFromStorage() {
      const apiStore = useApiStore();
      try {
        this.$reset();

        const keys = await storage.getItem('keys');
        if (keys) {
          this.keys = JSON.parse(keys);
        }

        for (const key of this.keys) {
          const summary = new Summary(JSON.parse(await storage.getItem(key)));
          if (summary.item_key == apiStore.itemKey) {
            this.summaries[key] = summary;
          }
          if (summary.corrector_key == apiStore.correctorKey) {
            this.editSummary = summary.getClone();
          }
        }

      }
      catch (err) {
        console.log(err);
      }

      lockUpdate = 0;
      apiStore.setInterval('summariesStore.updateContent', this.updateContent, checkInterval);
    },

    /**
     * Load the summaries data from the backend
     *
     * All keys and summaries are put to the storage
     * Only the summaries of the current item are loaded to the state
     *
     * @param {array} data - array of plain objects
     * @public
     */
    async loadFromData(data) {
      const apiStore = useApiStore();
      try {
        await storage.clear();
        this.$reset();

        for (const summary_data of data) {
          const summary = new Summary(summary_data);
          this.keys.push(summary.getKey());
          await storage.setItem(summary.getKey(), JSON.stringify(summary.getData()));
          if (summary.item_key == apiStore.itemKey) {
            this.summaries[summary.getKey()] = summary;
          }
          if (summary.corrector_key == apiStore.correctorKey) {
            this.editSummary = summary.getClone();
          }
        }
        ;

        await storage.setItem('keys', JSON.stringify(this.keys));
      }
      catch (err) {
        console.log(err);
      }

      lockUpdate = 0;
      apiStore.setInterval('summariesStore.updateContent', this.updateContent, checkInterval);
    },


    /**
     * Update the stored content
     * Triggered from the editor component when the content is changed
     * Triggered every checkInterval
     */
    async updateContent(fromEditor = false, force = false) {

      const storedSummary = this.summaries[this.editSummary.getKey()] ?? new Summary();

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
      if (isNaN(this.editSummary.points)) {
        this.editSummary.points = null;
      } else if (this.editSummary.points < 0) {
        this.editSummary.points = 0;
      } else if (this.editSummary.points > settingsStore.max_points) {
        this.editSummary.points = settingsStore.max_points;
      }

      // set the grade key for the points
      const levelsStore = useLevelsStore();
      let level = levelsStore.getLevelForPoints(this.editSummary.points);
      if (level) {
        this.editSummary.grade_key = level.key
      } else {
        this.editSummary.grade_key = '';
      }

      try {
        // ensure it is not changed because it is bound to tiny
        const clonedSummary = this.editSummary.getClone();

        if (!clonedSummary.isEqual(storedSummary) && this.keys.includes(clonedSummary.getKey())) {
          const apiStore = useApiStore();
          const changesStore = useChangesStore();

          clonedSummary.last_change = apiStore.getServerTime(Date.now());

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
      catch (error) {
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
      const apiStore = useApiStore();
      const changesStore = useChangesStore();
      const changes = [];
      for (const change of changesStore.getChangesFor(Change.TYPE_SUMMARY, sendingTime)) {
        const data = await storage.getItem(change.key);
        if (data) {
          changes.push(apiStore.getChangeDataToSend(change, JSON.parse(data)));
        } else {
          changes.push(apiStore.getChangeDataToSend(change));
        }
      }
      ;
      return changes;
    },

    /**
     * Set the own current summary as authorized
     */
    async setOwnAuthorized() {
      this.editSummary.is_authorized = true;
      // ensure that the default inclusion settings are set
      this.editSummary.setData(this.currentInclusionSettings);
      await this.updateContent(false, true);
    },

  }
});

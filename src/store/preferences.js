import { defineStore } from 'pinia';
import localForage from "localforage";
import Summary from '@/data/Summary';
import { useChangesStore } from "@/store/changes";
import { useApiStore } from '@/store/api';
import Change from '@/data/Change';


const storage = localForage.createInstance({
  storeName: "corrector-preferences",
  description: "Preferences data",
});

/**
 * Preferences Store
 * Stores local setings done by the corrector
 * These settings are not yet sent to the backend
 */
export const usePreferencesStore = defineStore('preferences', {
  state: () => {
    return {
      // saved in storage
      essay_page_zoom: 0.25,                              // zoom of a pdf page display
      essay_text_zoom: 1,                                 // zoom of an essay text display
      summary_text_zoom: 1,                               // zoom in the editor of the correction summary
      include_comments: Summary.INCLUDE_INFO,             // include comments in the authorized correction
      include_comment_ratings: Summary.INCLUDE_INFO,      // include comment ratings in the authorized correction
      include_comment_points: Summary.INCLUDE_INFO,       // include comment points in the authorized correction
      include_criteria_points: Summary.INCLUDE_INFO,      // include criteria points in the authorized correction
    }
  },

  getters: {

    allData: state => {
      return {
        essay_page_zoom: state.essay_page_zoom,
        essay_text_zoom: state.essay_text_zoom,
        summary_text_zoom: state.summary_text_zoom,
        include_comments: state.include_comments,
        include_comment_ratings: state.include_comment_ratings,
        include_comment_points: state.include_comment_points,
        include_criteria_points: state.include_criteria_points,
      }
    },

    summaryInclusions: state => {
      return {
        include_comments: state.include_comments,
        include_comment_ratings: state.include_comment_ratings,
        include_comment_points: state.include_comment_points,
        include_criteria_points: state.include_criteria_points,
      }
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
        const data = await storage.getItem('preferences');
        if (data) {
          this.$patch(data);
        }
      }
      catch (err) {
        console.log(err);
      }
    },

    async saveToStorage() {
      try {
        await storage.setItem('preferences', this.allData);
      }
      catch (err) {
        console.log(err);
      }
    },

    loadFromData(data) {
      try {
        this.$patch(data);
        this.sent = true;
        this.saveToStorage();

      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Update the preferences in the sorage and mark them as changed
     */
    async update() {
      const changesStore = useChangesStore();
      const apiStore = useApiStore();

      await this.saveToStorage();
      if (apiStore.correctorKey) {
        await changesStore.setChange(new Change({
          type: Change.TYPE_PREFERENCES,
          action: Change.ACTION_SAVE,
          key: 'preferences',         // fixed key, old change will be updated
          item_key: apiStore.itemKey
        }))
      }
    },

    /**
     * Get the changed preferences as flat data object
     * This is called for sending the preferences to the backend
     * @param {integer} sendingTime - timestamp of the sending or 0 to get all
     * @return {array} Change objects
     */
    async getChangedData(sendingTime = 0) {
      const apiStore = useApiStore();
      const changesStore = useChangesStore();
      const changes = [];
      for (const change of changesStore.getChangesFor(Change.TYPE_PREFERENCES, sendingTime)) {
        // preferences exist only once, will be the same for all changes
        changes.push(apiStore.getChangeDataToSend(change, this.allData));
      };
      return changes;
    },


    setSummaryInclusions(data) {
      this.include_comments = data.include_comments;
      this.include_comment_ratings = data.include_comment_ratings;
      this.include_comment_points = data.include_comment_points;
      this.include_criteria_points = data.include_criteria_points;
      this.update();
    },

    zoomEssayPageIn() {
      this.essay_page_zoom = this.essay_page_zoom * 1.1;
      this.update();
    },

    zoomEssayPageOut() {
      this.essay_page_zoom = this.essay_page_zoom * 0.9;
      this.update();
    },

    zoomEssayTextIn() {
      this.essay_text_zoom = this.essay_text_zoom * 1.1;
      this.update();
    },

    zoomEssayTextOut() {
      this.essay_text_zoom = this.essay_text_zoom * 0.9;
      this.update();
    },

    zoomSummaryTextIn() {
      this.summary_text_zoom = this.summary_text_zoom * 1.1;
      this.update();
    },

    zoomSummaryTextOut() {
      this.summary_text_zoom = this.summary_text_zoom * 0.9;
      this.update();
    }

  },
});

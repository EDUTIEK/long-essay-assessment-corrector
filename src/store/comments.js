import localForage from "localforage";
import { defineStore } from 'pinia';
import { useApiStore } from "@/store/api";
import { useCorrectorsStore } from "@/store/correctors";
import { usePointsStore } from "@/store/points";
import { useChangesStore } from "@/store/changes";
import { useSummariesStore } from '@/store/summaries';
import Comment from '@/data/Comment';
import Change from "@/data/Change";


const storage = localForage.createInstance({
  storeName: "corrector-comments",
  description: "Corrector comments data",
});

/**
 * Comments Store
 */
export const useCommentsStore = defineStore('comments', {
  state: () => {
    return {
      // saved in storage
      keys: [],                       // list of string keys of all comments in the storage
      comments: [],                   // list of comment objects for the currrent correction item
      showOtherCorrectors: true,      // show the comments of other correctors

      // not saved in storage
      markerChange: 0,                // for watchers: timestamp of the last change that affects the text markers (not the selection)
      selectionChange: 0,             // for watchers: timestamp of the last change of the selected comment
      filterChange: 0,                // for watchers: timestamp of the last change of the comments filter
      caretRequest: 0,               // for watchers: timestamp of the last request to set the caret to the mark of selected comment

      selectedKey: '',                // key of the currently selected comment
      firstVisibleKey: '',            // key of the first visible comment in the scrolled text
      filterKeys: [],                 // keys of filtered comments
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    selectedComment(state) {
      return state.getComment(state.selectedKey);
    },

    selectedLabel(state) {
      let comment = state.getComment(state.selectedKey);
      if (comment) {
        return comment.label;
      }
      return '';
    },

    activeComments: state => {
      const apiStore = useApiStore();
      return state.comments.filter(comment =>
        (state.showOtherCorrectors || comment.corrector_key == apiStore.correctorKey)
        && (state.filterKeys.length == 0 || state.filterKeys.includes(comment.key))
      );
    },

    isOtherCorrectorsShown: state => {
      return state.showOtherCorrectors
    },

    isFilterActive: state => {
      return state.filterKeys.length > 0;
    },

    getComment: state => {

      /**
       * Get a comment by its key
       *
       * @param {string} key
       * @returns {Comment|null}
       */
      const fn = function (key) {
        return state.comments.find(element => element.key == key);
      }
      return fn;
    },

    getCommentByMarkKey: state => {

      /**
       * Get a comment by the key if its mark key
       *
       * @param {string} key
       * @returns {Comment|null}
       */
      const fn = function (key) {
        return state.comments.find(element => element.hasMarkKey(key));
      }
      return fn;
    },

    getActiveCommentsInRange: state => {

      /**
       * Get the active comments in a range of marked text
       *
       * @param {number} start_position
       * @param {number} end_position
       * @returns {Comment[]}
       */
      const fn = function (start_position, end_position) {
        return state.activeComments.filter(comment =>
          comment.start_position <= end_position && comment.end_position >= start_position
        );
      };
      return fn;
    },

    getActiveCommentsByStartPosition: state => {

      /**
       * Get the active comments with a start position
       *
       * @param {number] }start_position
       * @returns {Comment[]}
       */
      const fn = function (start_position) {
        return state.activeComments.filter(comment =>
          comment.start_position == start_position
        );
      }
      return fn;
    },

    getActiveCommentsByParentNumber: state => {

      /**
       * Get the active comments with a parent number
       *
       * @param {number} parent_number
       * @returns {Comment[]}
       */
      const fn = function (parent_number) {
        return state.activeComments.filter(comment =>
          comment.parent_number == parent_number
        );
      }
      return fn;
    },

    getCountOfExcellent: state => {

      /**
       * Get the number of comments of a corrector marked as excellent
       *
       * @param {string} corrector_key
       * @returns {number}
       */
      const fn = function (corrector_key) {
        return state.comments
          .filter(comment => comment.corrector_key == corrector_key && comment.rating_excellent)
          .length
      }
      return fn;

    },

    getCountOfCardinal: state => {

      /**
       * Get the number of comments of a corrector marked as cardinal failure
       *
       * @param {string} corrector_key
       * @returns {number}
       */
      const fn = function (corrector_key) {
        return state.comments
          .filter(comment => comment.corrector_key == corrector_key && comment.rating_cardinal)
          .length
      }
      return fn;
    }

  },

  actions: {

    /**
     * Set the first visible comment to force a scrolling
     * @param {string} key
     * @public
     */
    setFirstVisibleComment(key) {
      this.firstVisibleKey = key;
    },

    /**
     * Set timestamp of the last change that affects the text markers (not the selection)
     * @public
     */
    setMarkerChange() {
      this.markerChange = Date.now();
    },

    /**
     * Set timestamp of the last change that affects the comments filter
     * @public
     */
    setFilterChange() {
      this.filterChange = Date.now();
    },

    /**
     * Set timestamp of the last request to set the carent to the selected comment
     * @public
     */
    setCaretRequest() {
      this.caretRequest = Date.now();
    },

    /**
     * Set the currently selected comment
     * Call with set_change=true when a comment is selected, added or removed
     * Call with set_change=false when just the key of the selected comment is updated
     *
     * @param {string} key
     * @param {boolean} set_change
     * @public
     */
    selectComment(key, set_change = true) {
      this.selectedKey = key;
      if (set_change) {
        this.selectionChange = Date.now();
      }
    },


    /**
     * Create a new comment
     * @param {integer} start_positon - the first marked word of the comment
     * @param {integer} end_position - the last marked word of the comment
     * @param {integer} parent_number - the number of the parent paragraph
     * @public
     */
    async createComment(start_positon, end_position, parent_number) {
      let comment = new Comment({
        start_position: start_positon,
        end_position: end_position,
        parent_number: parent_number
      })

      await this.addComment(comment);
      return comment.key;
    },

    /**
     * Add a new comment
     * @param {Comment} comment
     * @public
     */
    async addComment(comment) {
      const apiStore = useApiStore();
      const changesStore = useChangesStore();

      comment.item_key = apiStore.itemKey;
      comment.corrector_key = apiStore.correctorKey;

      // first do state changes (trigger watchers)
      this.keys.push(comment.key);
      if (this.filterKeys.length > 0) {
        this.filterKeys.push(comment.key);
        this.setFilterChange();
      }
      this.comments.push(comment);
      await this.sortAndLabelComments();
      this.setMarkerChange();
      this.selectComment(comment.key, true);

      // then save the comment
      await storage.setItem(comment.key, JSON.stringify(comment.getData()));
      await storage.setItem('keys', JSON.stringify(this.keys));
      await changesStore.setChange(new Change({
        type: Change.TYPE_COMMENT,
        action: Change.ACTION_SAVE,
        key: comment.key,
        item_key: comment.item_key
      }))

      return comment.key;
    },

    /**
     * Update a comment in the store
     * @param {bool} trigger a dorting and labelling of the comments
     * @param {Comment} comment
     * @public
     */
    async updateComment(comment, sort = false) {
      const apiStore = useApiStore();
      const summariesStore = useSummariesStore();
      const changesStore = useChangesStore();

      if (this.keys.includes(comment.key)
        && comment.corrector_key == apiStore.correctorKey
        && !summariesStore.isOwnDisabled
      ) {
        await storage.setItem(comment.key, JSON.stringify(comment.getData()));
        await changesStore.setChange(new Change({
          type: Change.TYPE_COMMENT,
          action: Change.ACTION_SAVE,
          key: comment.key,
          item_key: comment.item_key
        }))

        if (sort) {
          await this.sortAndLabelComments();
          this.setMarkerChange();
        }
      }
    },

    /**
     * Delete a comment
     * Sort and label the remaining comments
     * @param {string} removeKey
     * @public
     */
    async deleteComment(removeKey) {
      await this.removeComment(removeKey);
      await this.sortAndLabelComments();
      this.setMarkerChange();
    },

    /**
     * Remove a comment (internally used)
     *
     * @param {string} removeKey
     * @private
     */
    async removeComment(removeKey) {
      const changesStore = useChangesStore();
      const pointsStore = usePointsStore();
      await pointsStore.deletePointsOfComment(removeKey);

      if (this.selectedKey == removeKey) {
        this.selectComment('', true);
      }
      const comment = this.comments.find(element => element.key == removeKey);

      this.comments = this.comments.filter(comment => comment.key != removeKey);
      if (this.keys.includes(removeKey)) {
        this.keys = this.keys.filter(key => key != removeKey)
        await storage.setItem('keys', JSON.stringify(this.keys));
        await storage.removeItem(removeKey);
      }

      const change = new Change({
        type: Change.TYPE_COMMENT,
        action: Change.ACTION_DELETE,
        key: comment.key,
        item_key: comment.item_key
      });

      if (removeKey.substr(0, 4) == 'temp') {
        await changesStore.unsetChange(change);

      } else {
        await changesStore.setChange(change);
      }
    },

    /**
     * Sort the comments by position of their first marked word
     * Add labels with paragraph and comment number
     * @private
     */
    async sortAndLabelComments() {
      const apiStore = useApiStore();
      const correctorsStore = useCorrectorsStore();

      this.comments = this.comments.sort(compareComments);

      let parent = 0;
      let numbers = {};

      for (const comment of this.comments) {
        const corrector = correctorsStore.getCorrector(comment.corrector_key);
        const initials = corrector ? corrector.initials : '??';

        if (comment.parent_number > parent) {
          parent = comment.parent_number;
          for (const key of correctorsStore.correctorKeys) {
            numbers[key] = 0;                   // reset all numbers for the new parent
          }
          numbers[comment.corrector_key] = 1;     // set the number of the first comment

        } else {
          numbers[comment.corrector_key]++;
        }
        comment.label = initials + ' ' + parent.toString() + '.' + numbers[comment.corrector_key].toString();
        comment.prefix = (comment.corrector_key == apiStore.correctorKey) ? 'own' : 'other';
      }
    },

    /**
     * Filter the displayed comments by a corrector and rating
     * @param {string} corrector_key
     * @param {bool} rating_excellent
     * @param {bool} rating_cardinal
     */
    setFilterByRating(corrector_key, rating_excellent, rating_cardinal) {
      this.filterKeys = [];
      for (const comment of this.comments) {
        if (comment.corrector_key == corrector_key
          && comment.rating_excellent == rating_excellent
          && comment.rating_cardinal == rating_cardinal) {
          this.filterKeys.push(comment.key);
        }
      }
      this.setFilterChange();
    },

    /**
     * Filter the displayed comments by given points (directly, not per criterion)
     * @param {string} corrector_key
     * @param {bool} rating_excellent
     * @param {bool} rating_cardinal
     */
    setFilterByPoints(corrector_key) {
      const pointsStore = usePointsStore();
      this.filterKeys = [];
      for (const comment of this.comments) {
        if (comment.corrector_key == corrector_key) {
          if (pointsStore.getCommentHasPoints(comment.key)) {
            this.filterKeys.push(comment.key);
          }
        }
      }
      this.setFilterChange();
    },


    /**
     * Filter the displayed comments by a corrector and points for a criterion
     * @param {string} corrector_key
     * @param {string} criterion_key
     */
    setFilterByCriterion(corrector_key, criterion_key) {
      const pointsStore = usePointsStore();
      this.filterKeys = [];
      for (const comment of this.comments) {
        if (comment.corrector_key == corrector_key) {
          if (pointsStore.getCommentHasPointsForCriterion(comment.key, criterion_key)) {
            this.filterKeys.push(comment.key);
          }
        }
      }
      this.setFilterChange();
    },

    /**
     * Reset a filter on the shown comments
     */
    resetFilter() {
      this.filterKeys = [];
      this.setFilterChange();
    },

    /**
     * Set if comments from other correctors should be shown
     */
    async setShowOtherCorrectors(show) {
      this.showOtherCorrectors = !!show;
      this.markerChange = Date.now();
      await storage.setItem('showOtherCorrectors', JSON.stringify(this.showOtherCorrectors));
    },


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
        this.showOtherCorrectors = !!JSON.parse(await storage.getItem('showOtherCorrectors'));

        for (const key of this.keys) {
          const comment = new Comment(JSON.parse(await storage.getItem(key)));
          if (comment.item_key == apiStore.itemKey) {
            this.comments.push(comment);
          }
        }
        await this.sortAndLabelComments();

      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Load the comments data from the backend
     *
     * All keys and comments are put to the storage
     * Only the comments of the current item are loaded to the state
     *
     * @param {array} data - array of plain objects
     * @public
     */
    async loadFromData(data) {

      const apiStore = useApiStore();
      try {
        this.$reset();
        this.showOtherCorrectors = !!JSON.parse(await storage.getItem('showOtherCorrectors'));
        await storage.clear();

        for (const comment_data of data) {
          const comment = new Comment(comment_data);
          this.keys.push(comment.key);
          await storage.setItem(comment.key, JSON.stringify(comment.getData()));
          if (comment.item_key == apiStore.itemKey) {
            this.comments.push(comment);
          }
        }
        ;
        await this.sortAndLabelComments();

        await storage.setItem('keys', JSON.stringify(this.keys));
        await storage.setItem('showOtherCorrectors', JSON.stringify(this.showOtherCorrectors));

      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Get all changed comments from the storage as flat data objects
     * These may include comments of other items that are only in the storage
     * This is called for sending the comments to the backend
     * @param {integer} sendingTime - timestamp of the sending or 0 to get all
     * @return {array} Change objects
     */
    async getChangedData(sendingTime = 0) {
      const apiStore = useApiStore();
      const changesStore = useChangesStore();
      const changes = [];
      for (const change of changesStore.getChangesFor(Change.TYPE_COMMENT, sendingTime)) {
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
     * Update the keys of comments after sending to the backend
     * A key is changed from a temporary string to a numeric value for a saved comment
     * A new key is null for a deleted comment
     *
     * @param {object} matches - assoc array with old and new string keys
     */
    async updateKeys(matches = {}) {

      let removedKeys = [];       // old keys of removed comments
      let changedKeys = [];       // old keys that are changed
      let changedComments = [];   // comment objects with changed keys

      // collect the changes in the storage (all correction items)
      for (const key of this.keys) {
        if (key in matches) {
          if (matches[key] == null) {
            removedKeys.push(key);
          } else if (key != matches[key]) {
            let comment = new Comment(JSON.parse(await storage.getItem(key)));
            comment.key = matches[key];
            changedKeys.push(key);
            changedComments.push(comment);
          }
        }
      }

      // treat the changes in the state (curent correction item)
      if (changedKeys.includes(this.selectedKey)) {
        this.selectComment(matches[this.selectedKey], true);
      }
      this.comments = this.comments.filter(comment => !removedKeys.includes(comment.key));
      for (const comment of this.comments) {
        if (changedKeys.includes(comment.key)) {
          comment.key = matches[comment.key];
        }
      }
      let newFilterKeys = [];
      for (const key of this.filterKeys) {
        if (changedKeys.includes(key)) {
          newFilterKeys.push(matches[key]);
        } else {
          newFilterKeys.push(key);
        }
      }
      this.filterKeys = newFilterKeys; // no setFilterChange here

      // save the changes to the storage
      this.keys = this.keys.filter(key => !removedKeys.includes(key) && !changedKeys.includes(key));
      for (const key of removedKeys) {
        await storage.removeItem(key);
      }
      for (const key of changedKeys) {
        this.keys.push(matches[key]);
        await storage.removeItem(key);
      }
      for (const comment of changedComments) {
        await storage.setItem(comment.key, JSON.stringify(comment.getData()));
      }
      await storage.setItem('keys', JSON.stringify(this.keys));
    }
  }
});


/**
 * Compare two comments for sorting
 * @param {Comment} comment1
 * @param {Comment} comment2
 */
const compareComments = function (comment1, comment2) {
  if (comment1.parent_number < comment2.parent_number) {
    return -1;
  } else if (comment1.parent_number > comment2.parent_number) {
    return 1;
  } else if (comment1.start_position < comment2.start_position) {
    return -1;
  } else if (comment1.start_position > comment2.start_position) {
    return 1;
  } else {
    return 0;
  }
}

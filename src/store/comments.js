/**
 * Comments Store
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Comment from '@/data/Comment';
import Change from "@/data/Change";

const storage = getStorage('comments');

export const useCommentsStore = defineStore('comments', {
  state: () => {
    return {
      // saved in storage
      keys: [],                       // list of string keys of all comments in the storage
      comments: [],                   // list of comment objects for the currrent correction item
      showOtherCorrections: true,      // show the comments of other corrections

      // not saved in storage
      markerChange: 0,                // for watchers: timestamp of the last change that affects the text markers (not the selection)
      selectionChange: 0,             // for watchers: timestamp of the last change of the selected comment
      filterChange: 0,                // for watchers: timestamp of the last change of the comments filter
      caretRequest: 0,                // for watchers: timestamp of the last request to set the caret to the mark of the selected comment
      focusRequest: 0,                // for watchers: timestamp of the last request to focus the selected comment textarea
      deletionChange: 0,              // for watchers: timestamp of the last comment deletion (see lastDeleted)

      selectedKey: '',                // key of the currently selected comment
      firstVisibleKey: '',            // key of the first visible comment in the scrolled text
      filterKeys: [],                 // keys of filtered comments

      lastDeleted: null               // last deleted comment
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    canEditSelectedComment(state) {
      return state.selectedKey !== ''
        && state.selectedComment?.correction_key == stores.corrections().ownKey
        && !stores.summaries().isOwnDisabled;
    },

    selectedComment(state) {
      return state.getComment(state.selectedKey);
    },

    selectedLabel(state) {
      let comment = state.getComment(state.selectedKey);
      if (comment) {
        return comment.getLabelWithSymbol();
      }
      return '';
    },

    allComments(state) {
      return state.comments;
    },

    ownComments(state) {
      return state.comments.filter(comment => comment.correction_key == stores.corrections().ownKey);
    },

    activeComments(state) {
      const apiStore = stores.api();
      return state.comments.filter(comment =>
        (state.showOtherCorrections || comment.correction_key == stores.corrections().ownKey)
        && (state.filterKeys.length == 0 || state.filterKeys.includes(comment.key))
      );
    },

    isOtherCorrectionsShown(state) {
      return state.showOtherCorrections
    },

    isFilterActive(state) {
      return state.filterKeys.length > 0;
    },

    getComment(state) {

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

    getCommentByMarkKey(state) {

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

    getActiveCommentsInRange(state) {

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

    getActiveCommentsByStartPosition(state) {

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

    getActiveCommentsByParentNumber(state) {

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

    getCountOfExcellent(state) {

      /**
       * Get the number of comments of a correction marked as excellent
       *
       * @param {string} correction_key
       * @returns {number}
       */
      const fn = function (correction_key) {
        return state.comments
          .filter(comment => comment.correction_key == correction_key && comment.rating_excellent)
          .length
      }
      return fn;

    },

    getCountOfCardinal(state) {

      /**
       * Get the number of comments of a correction marked as cardinal failure
       *
       * @param {string} correction_key
       * @returns {number}
       */
      const fn = function (correction_key) {
        return state.comments
          .filter(comment => comment.correction_key == correction_key && comment.rating_cardinal)
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
     * Set timestamp of the last request to set the caret to the selected comment
     * Used for accessible keyboard navigation between comments and marked text
     * @public
     */
    setCaretRequest() {
      this.caretRequest = Date.now();
    },

    /**
     * Request focusing the selected comment textarea
     * Used after annotate-pdf's focus-end (or after setAll/select left focus in the PDF)
     * @public
     */
    setFocusRequest() {
      this.focusRequest = Date.now();
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
      const correctionsStore = stores.corrections();
      const changesStore = stores.changes();

      // restore a deleted comment when a deleted mark is restored
      if(!comment.comment) {
        for (const mark of comment.marks) {
          if (this.lastDeleted?.hasMarkKey(mark.key)) {
            comment.comment = this.lastDeleted.comment;
          }
        }
      }

      // this also sets the item key and the ids
      comment.setCorrectionKey(correctionsStore.ownKey);

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
      // JSON is needed because comments have nestes mark data
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
     * @param {bool} trigger a sorting and labelling of the comments
     * @param {Comment} comment
     * @public
     */
    async updateComment(comment, sort = false) {
      const apiStore = stores.api();
      const summariesStore = stores.summaries();
      const changesStore = stores.changes();

      if (this.keys.includes(comment.key)
        && comment.correction_key == stores.corrections().ownKey
        && !summariesStore.isOwnDisabled
      ) {
        // JSON is needed because comments have nestes mark data
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
      const changesStore = stores.changes();
      const pointsStore = stores.points();
      await pointsStore.deletePointsOfComment(removeKey);

      if (this.selectedKey == removeKey) {
        this.selectComment('', true);
      }
      const comment = this.comments.find(element => element.key == removeKey);
      if (comment) {
        this.lastDeleted = comment;
        this.deletionChange = Date.now();
      }

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
        item_key: comment.item_key,
        payload: comment.getData()
      });

      await changesStore.setChange(change);
    },

    /**
     * Sort the comments by position of their first marked word
     * Add labels with paragraph and comment number
     * Set the correction position
     * @private
     */
    async sortAndLabelComments() {
      const correctionsStore = stores.corrections();

      this.comments = this.comments.sort(Comment.order);

      let parent = 0;
      let numbers = {};

      for (const comment of this.comments) {
        const correction = correctionsStore.getCorrection(comment.correction_key);
        const initials = correction ? correction.initials : '??';

        if (comment.parent_number > parent) {
          parent = comment.parent_number;
          for (const key of correctionsStore.correctionKeys) {
            numbers[key] = 0;                   // reset all numbers for the new parent
          }
          numbers[comment.correction_key] = 1;     // set the number of the first comment

        } else {
          numbers[comment.correction_key]++;
        }

        comment.correction_position = correction.position;
        comment.label = initials + ' ' + parent.toString() + '.' + numbers[comment.correction_key].toString();
      }
    },

    /**
     * Filter the displayed comments by a correction and rating
     * @param {string} correction_key
     * @param {bool} rating_excellent
     * @param {bool} rating_cardinal
     */
    setFilterByRating(correction_key, rating_excellent, rating_cardinal) {
      this.filterKeys = [];
      for (const comment of this.comments) {
        if (comment.correction_key == correction_key
          && comment.rating_excellent == rating_excellent
          && comment.rating_cardinal == rating_cardinal) {
          this.filterKeys.push(comment.key);
        }
      }
      this.setFilterChange();
    },

    /**
     * Filter the displayed comments by given points (directly, not per criterion)
     * @param {string} correction_key
     * @param {bool} rating_excellent
     * @param {bool} rating_cardinal
     */
    setFilterByPoints(correction_key) {
      const pointsStore = stores.points();
      this.filterKeys = [];
      for (const comment of this.comments) {
        if (comment.correction_key == correction_key) {
          if (pointsStore.getCommentHasPoints(comment.key)) {
            this.filterKeys.push(comment.key);
          }
        }
      }
      this.setFilterChange();
    },


    /**
     * Filter the displayed comments by a correction and points for a criterion
     * @param {string} correction_key
     * @param {string} criterion_key
     */
    setFilterByCriterion(correction_key, criterion_key) {
      const pointsStore = stores.points();
      this.filterKeys = [];
      for (const comment of this.comments) {
        if (comment.correction_key == correction_key) {
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
     * Set if comments from other corrections should be shown
     */
    async setShowOtherCorrections(show) {
      this.showOtherCorrections = !!show;
      this.markerChange = Date.now();
      await storage.setItem('showOtherCorrections', JSON.stringify(this.showOtherCorrections));
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
      const apiStore = stores.api();
      try {
        this.$reset();

        const keys = await storage.getItem('keys');
        if (keys) {
          this.keys = JSON.parse(keys);
        }
        this.showOtherCorrections = !!JSON.parse(await storage.getItem('showOtherCorrections'));

        for (const key of this.keys) {
          // JSON is needed because comments have nestes mark data
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
    async loadFromBackend(data) {

      const apiStore = stores.api();
      try {
        this.$reset();
        this.showOtherCorrections = !!JSON.parse(await storage.getItem('showOtherCorrections'));
        await storage.clear();

        for (const comment_data of data) {
          const comment = new Comment(comment_data);
          this.keys.push(comment.key);
          // JSON is needed because comments have nestes mark data
          await storage.setItem(comment.key, JSON.stringify(comment.getData()));
          if (comment.item_key == apiStore.itemKey) {
            this.comments.push(comment);
          }
        }

        await this.sortAndLabelComments();

        await storage.setItem('keys', JSON.stringify(this.keys));
        await storage.setItem('showOtherCorrections', JSON.stringify(this.showOtherCorrections));

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
      const changesStore = stores.changes();
      const changes = [];
      for (const change of changesStore.getChangesFor(Change.TYPE_COMMENT, sendingTime)) {
        const data = await storage.getItem(change.key);
        if (data) {
          changes.push(changesStore.getChangeDataToSend(change, JSON.parse(data)));
        } else {
          changes.push(changesStore.getChangeDataToSend(change));
        }
      }
      ;
      return changes;
    }
  }
});


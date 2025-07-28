import { defineStore } from 'pinia';
import localForage from "localforage";
import { useApiStore } from '@/store/api';
import { useCommentsStore } from '@/store/comments';
import { useChangesStore } from "@/store/changes";
import Points from '@/data/Points'
import Change from '@/data/Change';

const storage = localForage.createInstance({
  storeName: "corrector-points",
  description: "Corrector points data",
});

/**
 * Points Store
 */
export const usePointsStore = defineStore('points', {
  state: () => {
    return {
      // saved in storage
      keys: [],               // list of string keys of all points in the storage
      points: [],             // list of points objects for the currrent correction item
      unsentChanges: {},      // assoc array of changes that have to be sent to the backend: key => UnsentChange

    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    getCommentHasPoints: state => {

      /**
       * Check if a comment has points
       *
       * @param {string} comment_key
       * @returns {boolean}
       */
      const fn = function (comment_key) {
        return state.points.find(points => points.comment_key == comment_key 
            && points.points != 0
        ) !== undefined;
      }
      return fn;
    },

    getCommentHasPointsForCriterion: state => {

      /**
       * Check if points for a comment and criterion exist
       *
       * @param {string} comment_key
       * @param {string} criterion_key
       * @returns {boolean}
       */
      const fn = function (comment_key, criterion_key) {
        return state.points.find(points => points.comment_key == comment_key
            && points.criterion_key == criterion_key
            && points.points != 0
        ) !== undefined;
      }
      return fn;
    },
    
    getSumOfPointsForCorrector: state => {

      /**
       * Get the sum of points given by a corrector
       *
       * @param {string} corrector_key
       * @param {bool} with_comment
       * @param {bool} with_criterion
       * @returns {number}
       */
      const fn = function (corrector_key, with_comment = null, with_criterion = null) {
        let sum = 0;
        state.points
            .filter(points => points.corrector_key == corrector_key &&
                (with_comment === null || with_comment == (points.comment_key != '')) &&
                 (with_criterion === null ||  with_criterion == (points.criterion_key != ''))
            )
            .forEach(points => sum += points.points);
        return sum;
      }
      return fn;
    },
    
    getSumOfPointsForComment: state => {

      /**
       * Get the sum of points given to criteria for a comment
       *
       * @param {string} comment_key
       * @returns {number}
       */
      const fn = function (comment_key) {
        let sum = 0;
        state.points
            .filter(points => points.comment_key == comment_key)
            .forEach(points => sum += points.points);
        return sum;
      }
      return fn;
    },


    getSumOfPointsForCriterion: state => {

      /**
       * Get the sum of points given to a criterion by a corrector
       *
       * @param {Criterion} criterion
       * @param {string} corrector_key
       * @returns {number}
       */
      const fn = function (criterion, corrector_key) {
        let sum = 0;
        state.points
          .filter(points => points.criterion_key == criterion.key && points.corrector_key == corrector_key)
          .forEach(points => sum += points.points);
        return sum;
      }
      return fn;
    },

    getPointsOfCriterionExceeded: state => {

      /**
       * Get if the sum of points given to a criterion by a corrector exceeds the maximum points of this criterion
       *
       * @param {Criterion} criterion
       * @param {string} comment_key
       * @returns {number}
       */
      const fn = function (criterion, corrector_key) {
        let sum = 0;
        state.points
          .filter(points => points.criterion_key == criterion.key && points.corrector_key == corrector_key)
          .forEach(points => sum += points.points);
        return sum > criterion.points;
      }
      return fn;
    },

    getObjectsForCorrector: state => {

      /**
       * Get the points for a corrector
       *
       * @param {string[]} corrector_key
       * @returns {Points[]}
       */
      const fn = function (corrector_key) {
        return state.points.filter(points => points.corrector_key == corrector_key);
      }
      return fn;
    },

    
    getObjectByData: state => {

      /**
       * Get a points object by comment and/or criteriony key
       *
       * @param {string} corrector_key
       * @param {string} comment_key
       * @param {string} criterion_key
       * @returns {Point|undefined}
       */
      const fn = function (corrector_key, comment_key, criterion_key) {
        return state.points.find(points => points.corrector_key == corrector_key
            && points.comment_key == comment_key
            && points.criterion_key == criterion_key);
      }
      return fn;
    },
    
  },

  actions: {

    /**
     * Set and store a points value by its relations
     * @param {string} comment_key
     * @param {string} criterion_key
     * @param {integer} points_value
     * @public
     */
    async setValueByCommentOrCriterion(comment_key, criterion_key, points_value) {
      const apiStore = useApiStore();
      let pointsObject = this.getObjectByData(apiStore.correctorKey, comment_key, criterion_key);
      if (pointsObject) {
        if (points_value) {
          pointsObject.setPoints(points_value);
          this.updatePoints(pointsObject);
        } else {
          this.deletePoints(pointsObject.key);
        }
      } else if ((comment_key || criterion_key) && points_value) {
        this.createPoints(comment_key, criterion_key, points_value);
      }
    },

    /**
     * Create a new points object
     * @param {string} comment_key
     * @param {string} criterion_key
     * @param {integer} points
     * @public
     */
    async createPoints(comment_key, criterion_key, points_value) {
      const apiStore = useApiStore();
      const pointsObject = new Points({
        item_key: apiStore.itemKey,
        corrector_key: apiStore.correctorKey,
        comment_key: comment_key,
        criterion_key: criterion_key,
        points: points_value
      });
      this.keys.push(pointsObject.key);
      this.points.push(pointsObject);

      await storage.setItem(pointsObject.key, JSON.stringify(pointsObject.getData()));
      await storage.setItem('keys', JSON.stringify(this.keys));

      const changesStore = useChangesStore();
      await changesStore.setChange(new Change({
        type: Change.TYPE_POINTS,
        action: Change.ACTION_SAVE,
        key: pointsObject.key,
        item_key: pointsObject.item_key
      }))
    },

    /**
     * Update a points object in the store
     * @param {Points} pointsObject
     * @public
     */
    async updatePoints(pointsObject) {

      if (this.keys.includes(pointsObject.key)) {
        await storage.setItem(pointsObject.key, JSON.stringify(pointsObject.getData()));
        const changesStore = useChangesStore();
        await changesStore.setChange(new Change({
          type: Change.TYPE_POINTS,
          action: Change.ACTION_SAVE,
          key: pointsObject.key,
          item_key: pointsObject.item_key
        }))
      }
    },

    /**
     * Delete a points object in the store
     * @param {string} remove_key
     * @public
     */
    async deletePoints(remove_key) {
      const points = this.points.find(points => points.key == remove_key);

      this.points = this.points.filter(points => points.key != remove_key);
      if (this.keys.includes(remove_key)) {
        this.keys = this.keys.filter(key => key != remove_key)
        await storage.setItem('keys', JSON.stringify(this.keys));
        await storage.removeItem(remove_key);
      }

      const changesStore = useChangesStore();
      const change = new Change({
        type: Change.TYPE_POINTS,
        action: Change.ACTION_DELETE,
        key: points.key,
        item_key: points.item_key
      });

      if (remove_key.substr(0, 4) == 'temp') {
        await changesStore.unsetChange(change);
      } else {
        await changesStore.setChange(change);
      }
    },

    /**
     * Deleta all Points of a comment
     * @param {string} comment_key
     */
    async deletePointsOfComment(comment_key) {
      this.points
          .filter(points => points.comment_key == comment_key)
          .forEach(points => this.deletePoints(points.key))
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
     * Load the points data from the storage
     * Only the points of the current item are loaded to the state
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

        this.points = [];
        for (const key of this.keys) {
          let points_data = JSON.parse(await storage.getItem(key));
          let points = new Points(points_data);
          if (points.item_key == apiStore.itemKey) {
            this.points.push(points);
          }
        }
      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Load the points data from the backend
     *
     * All keys and points are put to the storage
     * Only the comments of the current item are loaded to the state
     *
     * @param {array} data - array of plain objects
     * @public
     */
    async loadFromData(data) {
      const apiStore = useApiStore();
      try {
        await storage.clear();
        this.$reset();

        for (const points_data of data) {
          const points = new Points(points_data);
          this.keys.push(points.key);
          await storage.setItem(points.key, JSON.stringify(points.getData()));
          if (points.item_key == apiStore.itemKey) {
            this.points.push(points);
          }
        }
        ;
        await storage.setItem('keys', JSON.stringify(this.keys));
      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Get all changed points from the storage as flat data objects
     * These may include points of other items that are only in the storage
     * This is called for sending the points to the backend
     * @param {integer} sendingTime - timestamp of the sending or 0 to get all
     * @return {array} Change objects
     */
    async getChangedData(sendingTime = 0) {
      const apiStore = useApiStore();
      const changesStore = useChangesStore();
      const changes = [];
      for (const change of changesStore.getChangesFor(Change.TYPE_POINTS, sendingTime)) {
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
     * Set points as sent
     * A key is changed from a temporary string to a numeric value for saved points
     * A new key is null for deleted points
     *
     * @param {object} matches - assoc array with old and new string keys
     */
    async updateKeys(matches = {}) {

      let removedKeys = [];       // old keys of removed points
      let changedKeys = [];       // old keys that are changed
      let changedPoints = [];     // points objects with changed keys

      // collect the changes in the storage (all correction items)
      for (const key of this.keys) {
        if (key in matches) {
          if (matches[key] == null) {
            removedKeys.push(key);
          } else if (key != matches[key]) {
            let points = new Points(await storage.getItem(key));
            points.key = matches[key];
            changedKeys.push(key);
            changedPoints.push(points);
          }
        }
      }

      // treat the changes in the state (curent correction item)
      this.selectedKey = ''
      this.points = this.points.filter(comment => !removedKeys.includes(comment.key));
      for (const points of this.points) {
        if (changedKeys.includes(points.key)) {
          points.key = matches[points.key];
        }
      }

      // save the changes to the storage
      this.keys = this.keys.filter(key => !removedKeys.includes(key) && !changedKeys.includes(key));
      for (const key of removedKeys) {
        await storage.removeItem(key);
      }
      for (const key of changedKeys) {
        this.keys.push(matches[key]);
        await storage.removeItem(key);
      }
      for (const points of changedPoints) {
        await storage.setItem(points.key, JSON.stringify(points.getData()));
      }
      await storage.setItem('keys', JSON.stringify(this.keys));
    },


    /**
     * Change comment keys in the stored points
     * @param {array} matches - oldkey => newkey|null
     */
    async changeCommentKeys(matches) {

      let removedKeys = [];       // keys of points to be removed
      let changedPoints = [];     // points objects with changed comment keys

      // collect the changes in the storage (all correction items)
      for (const key of this.keys) {
        let points = new Points(await storage.getItem(key));
        if (points.comment_key in matches) {
          if (matches[points.comment_key] == null) {
            removedKeys.push(key);
          } else if (points.comment_key != matches[points.comment_key]) {
            points.comment_key = matches[points.comment_key];
            changedPoints.push(points);
          }
        }
      }

      // treat the changes in the state (curent correction item)
      this.points = this.points.filter(points => !removedKeys.includes(points.key));
      for (const points of this.points) {
        if (points.comment_key in matches) {
          points.comment_key = matches[points.comment_key];
        }
      }

      // save the changes to the storage
      for (const key of removedKeys) {
        await storage.removeItem(key);
      }
      for (const points of changedPoints) {
        await storage.setItem(points.key, JSON.stringify(points.getData()));
      }
      this.keys = this.keys.filter(key => !removedKeys.includes(key));
      await storage.setItem('keys', JSON.stringify(this.keys));
    }
  }
});

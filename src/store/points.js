import { defineStore } from 'pinia';
import localForage from "localforage";
import Points from '@/data/Points'

const storage = localForage.createInstance({
    storeName: "corrector-points",
    description: "Corrector points data",
});

/**
 * Points Store
 */
export const usePointsStore = defineStore('points',{
    state: () => {
        return {
            // saved in storage
            keys: [],               // list of string keys of all points in the storage
            points: [],             // list of comment objects for the currrent correction item
        }
    },

    getters: {
        hasPoints: (state) => state.points.length > 0,

        hasCommentPoints(state) {
            return (commentKey) => state.points.find(element => element.comment_key == commentKey) !== undefined
        },

        getObjectByKey(state) {
            return (key) => state.points.find(element => element.key == key)
        },

        /**
         * Get a points object by its relations
         * @param state
         * @return {function(string, string): Points}
         */
        getObjectByRelation(state) {
            return (commentKey, criterionKey) => state.points.find(element => element.comment_key == commentKey &&  element.criterion_key == criterionKey);
        },

        /**
         * Get a points value by its relations
         * @param state
         * @return {function(string, string): integer}
         */
        getValueByRelation(state) {
            return (commentKey, criterionKey) => {
                let pointsObject = state.getObjectByRelation(commentKey, criterionKey)
                if (pointsObject) {
                    return pointsObject.points;
                }
                return 0;
            }
        }
    },

    actions: {

        /**
         * Set and store a points value by its relations
         * @param {string} commentKey
         * @param {string} criterionKey
         * @param {integer} pointsValue
         * @return {Promise<void>}
         */
        async setValueByRelation(commentKey, criterionKey, pointsValue) {
            let pointsObject = this.getObjectByRelation(commentKey, criterionKey);
            if (pointsObject) {
                if (pointsValue) {
                    pointsObject.setPoints(pointsValue);
                    this.updatePoints(pointsObject);
                }
                else {
                    this.deletePoints(pointsObject.key);
                }
            }
            else if (commentKey && criterionKey && pointsValue) {
                this.createPoints(commentKey, criterionKey, pointsValue);
            }
        },

        /**
         * Create a new points object
         * @param commentKey
         * @param criterionKey
         * @param points
         * @return {Promise<void>}
         */
        async createPoints(commentKey, criterionKey, pointsValue) {
          let pointsObject = new Points({
              comment_key: commentKey,
              criterion_key: criterionKey,
              points: pointsValue
          });
          this.keys.push(pointsObject.key);
          this.points.push(pointsObject);
            await storage.setItem(pointsObject.key, pointsObject.getData());
            await storage.setItem('pointsKeys', JSON.stringify(this.keys));
        },

        /**
         * Update a points object in the store
         * @param {Points} pointsObject
         */
        async updatePoints(pointsObject) {
            if (this.keys.includes(pointsObject.key)) {
                await storage.setItem(pointsObject.key, pointsObject.getData());
            }
        },

        /**
         * Delete a points object in the store
         * @param {string} removeKey
         */
        async deletePoints(removeKey) {

            this.points = this.points.filter(pointsObject => pointsObject.key != removeKey)
            if (this.keys.includes(removeKey)) {
                this.keys = this.keys.filter(key => key != removeKey)
                await storage.setItem('pointsKeys', JSON.stringify(this.keys));
                await storage.removeItem(removeKey);
            }
        },

        /**
         * Deleta all Points of a comment
         * @param {string} commentKey
         */
        async deletePointsOfComment(commentKey) {
            this.points.filter(element => element.comment_key == commentKey).forEach( element => {
                this.deletePoints(element.key);
            })
        },

        async clearStorage() {
            try {
                await storage.clear();
            }
            catch (err) {
                console.log(err);
            }
        },

        async loadFromStorage(currentCommentKeys) {
            try {
                const keys = await storage.getItem('pointsKeys');
                if (keys) {
                    this.keys =  JSON.parse(keys);
                }
                this.points = [];

                let index = 0;
                while (index < this.keys.length) {
                    let points = await storage.getItem(this.keys[index]);
                    if (currentCommentKeys.includes(points.comment_key)) {
                        this.points.push(points);
                    }
                    index++;
                }

            } catch (err) {
                console.log(err);
            }
        },

        async loadFromData(data, currentCommentKeys) {
            try {
                await storage.clear();

                this.keys = [];
                this.points = [];

                let index = 0;
                while (index < data.length) {
                    let points_data = data[index];
                    let points = new Points(points_data);
                    this.keys.push(points.key);
                    await storage.setItem(points.key, points.getData());
                    if (currentCommentKeys.includes(points.comment_key)) {
                        this.points.push(points);
                    }
                    index++;
                }

                await storage.setItem('pointsKeys', JSON.stringify(this.keys));
            }
            catch (err) {
                console.log(err);
            }
        }
    }
});

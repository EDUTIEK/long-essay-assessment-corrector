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
         * Get the points for a set of comment keys
         * @param state
         * @return {function(array): Points}
         */
        getObjectsByCommentKeys(state) {
            return (commentKeys) => state.points.filter(element => commentKeys.includes(element.comment_key));
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
        },
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
            await storage.setItem('keys', JSON.stringify(this.keys));
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
                await storage.setItem('keys', JSON.stringify(this.keys));
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
                const keys = await storage.getItem('keys');
                if (keys) {
                    this.keys =  JSON.parse(keys);
                }
                this.points = [];

                for (const key of this.keys) {
                    let points_data = await storage.getItem(key);
                    let points = new Points(points_data);
                    if (currentCommentKeys.includes(points.comment_key)) {
                        this.points.push(points);
                    }
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

                for (const points_data of data) {
                    let points = new Points(points_data);
                    this.keys.push(points.key);
                    await storage.setItem(points.key, points.getData());
                    if (currentCommentKeys.includes(points.comment_key)) {
                        this.points.push(points);
                    }
                };
                await storage.setItem('keys', JSON.stringify(this.keys));
            }
            catch (err) {
                console.log(err);
            }
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
                let points_data = await storage.getItem(key);
                let points = new Points(points_data);
                if (points.comment_key in matches) {
                    if (matches[points.comment_key] == null) {
                        removedKeys.push(key);
                    }
                    else if (points.comment_key != matches[points.comment_key]) {
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
                await storage.setItem(points.key, points.getData());
            }
            this.keys = this.keys.filter(key => !removedKeys.includes(key));
            await storage.setItem('keys', JSON.stringify(this.keys));
        }
    }
});

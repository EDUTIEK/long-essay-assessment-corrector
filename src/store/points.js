import { defineStore } from 'pinia';
import localForage from "localforage";
import Points from '@/data/Points'
import Comment from '@/data/Comment';

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
            unsentChanges: {},      // assoc array of changes that have to be sent to the backend key => timestamp

        }
    },

    getters: {

        countUnsentChanges(state) {
            return Object.keys(state.unsentChanges).length;
        },

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
         * @public
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
         * @param {string} commentKey
         * @param {string} criterionKey
         * @param {integer} points
         * @public
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
          await this.setUnsent(pointsObject.key);
        },

        /**
         * Update a points object in the store
         * @param {Points} pointsObject
         * @public
         */
        async updatePoints(pointsObject) {
            if (this.keys.includes(pointsObject.key)) {
                await storage.setItem(pointsObject.key, pointsObject.getData());
                await this.setUnsent(pointsObject.key);
            }
        },

        /**
         * Delete a points object in the store
         * @param {string} removeKey
         * @public
         */
        async deletePoints(removeKey) {
            this.points = this.points.filter(pointsObject => pointsObject.key != removeKey)
            if (this.keys.includes(removeKey)) {
                this.keys = this.keys.filter(key => key != removeKey)
                await storage.setItem('keys', JSON.stringify(this.keys));
                await storage.removeItem(removeKey);
            }
            if (removeKey.substr(0, 4) == 'temp') {
                await this.removeUnsent(removeKey);
            } else {
                await this.setUnsent(removeKey);
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
         * Load the points data from the storage
         * Only the points of the current item are loaded to the state
         *
         * @param {array} currentCommentKeys - keys of comments for which the points should be loaded
         * @public
         */
        async loadFromStorage(currentCommentKeys) {
            try {
                const keys = await storage.getItem('keys');
                if (keys) {
                    this.keys =  JSON.parse(keys);
                }
                const unsentChanges = await storage.getItem('unsentChanges');
                if (unsentChanges) {
                    this.unsentChanges = JSON.parse(unsentChanges);
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
                this.unsentChanges = {};
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
                await storage.setItem('unsentChanges', JSON.stringify(this.unsentChanges));
            }
            catch (err) {
                console.log(err);
            }
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
         * Add a note that a points have to be sent to the backend
         * This is called for added, updated and removed points
         * @param {string} key
         */
        async setUnsent(key) {
            this.unsentChanges[key] = Date.now();
            await storage.setItem('unsentChanges', JSON.stringify(this.unsentChanges));
        },

        /**
         * Remove the note that points have to be sent to the backend
         * This is called when a new points object (not yet in the backend) is deleted
         * @param {string} key
         */
        async removeUnsent(key) {
            delete this.unsentChanges[key];
            await storage.setItem('unsentChanges', JSON.stringify(this.unsentChanges));
        },


        /**
         * Get all unsent points from the storage as flat data objects
         * These may include points of other items that are only in the storage
         * This is called for sending the points to the backend
         * @param {integer} sendingTime - timestamp of the sending or 0 to get all
         * @return {object} key => object|null
         */
        async getUnsentData(sendingTime = 0) {
            let data_list = {};
            for (const key in this.unsentChanges) {
                if (sendingTime == 0 || this.unsentChanges[key] < sendingTime) {
                    let data = await storage.getItem(key)
                    if (data) {
                        data_list[key] = data;
                    } else {
                        data_list[key] = null;
                    }
                }
            };
            return data_list;
        },


        /**
         * Set points as sent
         * A key is changed from a temporary string to a numeric value for saved points
         * A new key is null for deleted points
         *
         * @param {object} matches - assoc array with old and new string keys
         * @param {integer} sendingTime - timestamp of the sending
         */
        async setPointsSent(matches= {}, sendingTime) {

            let removedKeys = [];       // old keys of removed points
            let changedKeys = [];       // old keys that are changed
            let changedPoints = [];     // points objects with changed keys

            // collect the changes in the storage (all correction items)
            for (const key of this.keys) {
                if (key in matches) {
                    if (matches[key] == null) {
                        removedKeys.push(key);
                    }
                    else if(key != matches[key]) {
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
                await storage.setItem(points.key, points.getData());
            }
            await storage.setItem('keys', JSON.stringify(this.keys));

            // cleanup the unsent changes
            let remainingChanges = {};
            for (const key in this.unsentChanges) {
                let time = this.unsentChanges[key];
                // keep change that is newer than the sending
                if (time >= sendingTime) {
                    if (changedKeys.includes(key)) {
                        remainingChanges[changedKeys[key]] = time;
                    }
                    else if (!removedKeys.includes(key)) {
                        remainingChanges[key] = time;
                    }
                }
            }
            this.unsentChanges = remainingChanges;
            await storage.setItem('unsentChanges', JSON.stringify(this.unsentChanges));
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

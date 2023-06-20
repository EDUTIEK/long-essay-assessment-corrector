import localForage from "localforage";
import api from "js-cookie";
import Comment from '@/data/Comment';
import { defineStore } from 'pinia';
import {useApiStore} from "@/store/api";
import {useCorrectorsStore} from "@/store/correctors";
import {usePointsStore} from "@/store/points";


const storage = localForage.createInstance({
    storeName: "corrector-comments",
    description: "Corrector comments data",
});

/**
 * Compare two comments for sorting
 * @param {Comment} comment1
 * @param {Comment} comment2
 */
const compareComments = function(comment1, comment2) {
    if (comment1.start_position < comment2.start_position) {
        return -1;
    }
    else if (comment1.start_position > comment2.start_position) {
        return 1;
    }
    else {
        return 0;
    }
}


/**
 * Comments Store
 */
export const useCommentsStore = defineStore('comments',{
    state: () => {
        return {
            // saved in storage
            keys: [],                       // list of string keys of all comments in the storage
            comments: [],                   // list of comment objects for the currrent correction item
            unsentChanges: {},              // assoc array of changes that have to be sent to the backend key => timestamp
            showOtherCorrectors: false,     // show the comments of other correctors

            // not saved in storage
            markerChange: 0,                // timestamp of the last change that affects the text markers (not the selection)
                                            //      (this is watched to update the text markers)
            selectedKey: '',                // key of the currently selected comment
            firstVisibleKey: '',            // key of the first vislble comment in the scrolled text
            filterKeys: [],                 // keys of filtered comments
        }
    },

    /**
     * Getter functions (with params) start with 'get', simple state queries not
     */
    getters: {

        countUnsentChanges(state) {
            return Object.keys(state.unsentChanges).length;
        },

        selectedLabel(state) {
            let comment = state.getComment(state.selectedKey);
            if (comment) {
                return comment.label;
            }
            return '';
        },

        activeComments(state) {
            const apiStore = useApiStore();
            const correctorsStore = useCorrectorsStore();
            return state.comments.filter(comment =>
                (state.showOtherCorrectors || comment.corrector_key == apiStore.correctorKey)
                && (state.filterKeys.length == 0 || state.filterKeys.includes(comment.key))
            );
        },

        currentCommentKeys(state) {
            let keys = [];
            state.comments.forEach(comment => keys.push(comment.key));
            return keys;
        },

        isOtherCorrectorsShown(state) {
            return state.showOtherCorrectors
        },

        isFilterActive(state) {
          return state.filterKeys.length > 0;
        },

        getComment(state) {
            return (key) => state.comments.find(element => element.key == key);
        },

        getActiveCommentsInRange(state) {
            return (start_position, end_position) => state.activeComments.filter(comment =>
               comment.start_position <= end_position && comment.end_position >= start_position
            );
        },

        getActiveCommentsByStartPosition(state) {
            return (start_position) => state.activeComments.filter(comment =>
                comment.start_position == start_position
            );
        },

        getKeysOfCorrector(state) {
            return (corrector_key) => {
                let keys = [];
                state.comments
                    .filter(comment => comment.corrector_key == corrector_key)
                    .forEach(comment => keys.push(comment.key));
                return keys;
            };
        },

        getCountOfExcellent(state) {
            return (corrector_key) =>
                state.comments
                .filter(comment => comment.corrector_key == corrector_key && comment.rating_excellent)
                .length
        },

        getCountOfCardinal(state) {
            return (corrector_key) =>
                state.comments
                .filter(comment => comment.corrector_key == corrector_key && comment.rating_cardinal)
                .length
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
         * Set the currently selected comment
         * This should be called when a comment is manually selected in the text or comment list
         * It will also remove a previously created comment that is still empty
         * @param {string} key
         * @public
         */
        async selectComment(key) {
            if (this.selectedKey != key) {
                await this.removeEmptyComments(key);
                await this.sortAndLabelComments();
                this.selectedKey = key;
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
            const apiStore = useApiStore();
            let comment = new Comment({
                item_key: apiStore.itemKey,
                corrector_key: apiStore.correctorKey,
                start_position: start_positon,
                end_position: end_position,
                parent_number: parent_number
            })

            // first do state changes (trigger watchers)
            this.keys.push(comment.key);
            if (this.filterKeys.length > 0) {
                this.filterKeys.push(comment.key);
            }
            this.comments.push(comment);
            await this.removeEmptyComments(comment.key);
            await this.sortAndLabelComments();
            this.setMarkerChange();
            this.selectedKey = comment.key;

            // then save the comment
            await storage.setItem(comment.key, comment.getData());
            await storage.setItem('keys', JSON.stringify(this.keys));
            await this.setUnsent(comment.key);
            return comment.key;
        },

        /**
         * Update a comment in the store
         * @param {Comment} comment
         * @public
         */
        async updateComment(comment) {
            if (this.keys.includes(comment.key)) {
                await storage.setItem(comment.key, comment.getData());
                await this.setUnsent(comment.key);
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
            const pointsStore = usePointsStore();
            await pointsStore.deletePointsOfComment(removeKey);

            if (this.selectedKey == removeKey) {
                this.selectedKey = '';
            }
            this.comments = this.comments.filter(comment => comment.key != removeKey);
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
         * Remove empty comments of the current item (internally used)
         *
         * @param {string} keepKey - key of a (newly created) comment that should be kept
         * @private
         */
        async removeEmptyComments(keepKey) {
            const pointsStore = usePointsStore();

            let comments = this.comments.filter(comment =>
                comment.key != keepKey
                && comment.comment == ''
                && !comment.rating_excellent
                && !comment.rating_cardinal
                && !pointsStore.hasCommentPoints(comment.key)
            );

            for (const comment of comments) {
                await this.removeComment(comment.key);
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
            let number = 0;
            for (const comment of this.comments) {
                if (comment.corrector_key != apiStore.correctorKey) {
                    comment.label = correctorsStore.getCorrector(comment.corrector_key).title;
                    comment.prefix = 'other';
                }
                else {
                    if (comment.parent_number > parent) {
                        parent = comment.parent_number;
                        number = 1;
                    } else {
                        number++;
                    }
                    comment.label = parent.toString() + '.' + number.toString();
                    comment.prefix = 'own';
                }
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
                    if (pointsStore.hasPointsForCommentAndCriterionKeys(comment.key, criterion_key)) {
                        this.filterKeys.push(comment.key);
                    }
                }
            }
        },

        /**
         * Reset a filter on the shown comments
         */
        resetFilter() {
            this.filterKeys = [];
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
        },

        /**
         * Load the comments data from the storage
         * Only the comments of the current item are loaded to the state
         *
         * @param {string} currentItemKey - key of the correction item that is shown
         * @public
         */
        async loadFromStorage(currentItemKey) {
            try {
                const keys = await storage.getItem('keys');
                if (keys) {
                    this.keys = JSON.parse(keys);
                }
                const unsentChanges = await storage.getItem('unsentChanges');
                if (unsentChanges) {
                    this.unsentChanges = JSON.parse(unsentChanges);
                }
                this.showOtherCorrectors = !! await JSON.parse(storage.getItem('showOtherCorrectors'));

                this.comments = [];
                this.currentKey = '';
                for (const key of this.keys) {
                    let comment = new Comment(await storage.getItem(key));
                    if (comment.item_key == currentItemKey) {
                        this.comments.push(comment);
                    }
                }

                await this.removeEmptyComments();
                await this.sortAndLabelComments();

            } catch (err) {
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
         * @param {string} currentItemKey - key of the correction item that is shown
         * @public
         */
        async loadFromData(data, currentItemKey) {
            try {
                await storage.clear();

                this.keys = [];
                this.unsentChanges = {};
                this.comments = [];
                this.selectedKey = '';
                this.showOtherCorrectors = false;

                for (const comment_data of data) {
                    let comment = new Comment(comment_data);
                    this.keys.push(comment.key);
                    await storage.setItem(comment.key, comment.getData());
                    if (comment.item_key == currentItemKey) {
                        this.comments.push(comment);
                    }
                };

                await this.removeEmptyComments();
                await this.sortAndLabelComments();

                await storage.setItem('keys', JSON.stringify(this.keys));
                await storage.setItem('unsentChanges', JSON.stringify(this.unsentChanges));
                await storage.setItem('showOtherCorrectors', JSON.stringify(this.showOtherCorrectors));
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
         * Add a note that a comment has to be sent to the backend
         * This is called for added, updated and removed comments
         * @param {string} key
         */
        async setUnsent(key) {
            this.unsentChanges[key] = Date.now();
            await storage.setItem('unsentChanges', JSON.stringify(this.unsentChanges));
        },

        /**
         * Remove the note that a comment has to be sent to the backend
         * This is called when a new comment (not yet in the backend) is deleted
         * @param {string} key
         */
        async removeUnsent(key) {
            delete this.unsentChanges[key];
            await storage.setItem('unsentChanges', JSON.stringify(this.unsentChanges));
        },


        /**
         * Get all unsent comments from the storage as flat data objects
         * These may include comments of other items that are only in the storage
         * This is called for sending the comments to the backend
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
         * Set comments as sent
         * A key is changed from a temporary string to a numeric value for a saved comment
         * A new key is null for a deleted comment
         *
         * @param {object} matches - assoc array with old and new string keys
         * @param {integer} sendingTime - timestamp of the sending
         */
        async setCommentsSent(matches= {}, sendingTime) {

            let removedKeys = [];       // old keys of removed comments
            let changedKeys = [];       // old keys that are changed
            let changedComments = [];   // comment objects with changed keys

            // collect the changes in the storage (all correction items)
            for (const key of this.keys) {
                if (key in matches) {
                    if (matches[key] == null) {
                        removedKeys.push(key);
                    }
                    else if(key != matches[key]) {
                        let comment = new Comment(await storage.getItem(key));
                        comment.key = matches[key];
                        changedKeys.push(key);
                        changedComments.push(comment);
                    }
                }
            }

            // treat the changes in the state (curent correction item)
            if (changedKeys.includes(this.selectedKey)) {
                this.selectedKey = matches[this.selectedKey];
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
            this.filterKeys = newFilterKeys;

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
                await storage.setItem(comment.key, comment.getData());
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
        }
    }
});

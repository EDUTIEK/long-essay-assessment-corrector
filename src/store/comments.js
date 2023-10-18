import localForage from "localforage";
import { defineStore } from 'pinia';
import {useApiStore} from "@/store/api";
import {useCorrectorsStore} from "@/store/correctors";
import {usePointsStore} from "@/store/points";
import {useChangesStore} from "@/store/changes";
import Comment from '@/data/Comment';
import Change from "@/data/Change";


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
    if (comment1.parent_number < comment2.parent_number) {
        return -1;
    }
    else if (comment1.parent_number > comment2.parent_number) {
        return 1;
    }
    else if (comment1.start_position < comment2.start_position) {
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

        selectedLabel(state) {
            let comment = state.getComment(state.selectedKey);
            if (comment) {
                return comment.label;
            }
            return '';
        },

        activeComments: state => {
            const apiStore = useApiStore();
            const correctorsStore = useCorrectorsStore();
            return state.comments.filter(comment =>
                (state.showOtherCorrectors || comment.corrector_key == apiStore.correctorKey)
                && (state.filterKeys.length == 0 || state.filterKeys.includes(comment.key))
            );
        },

        currentCommentKeys: state => {
            let keys = [];
            state.comments.forEach(comment => keys.push(comment.key));
            return keys;
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
            const fn = function(key) {
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
            const fn = function(key) {
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
            const fn = function(start_position, end_position) {
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
            const fn = function(start_position) {
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
            const fn = function(parent_number) {
                return state.activeComments.filter(comment =>
                  comment.parent_number == parent_number
                );
            }
            return fn;
        },

        getKeysOfCorrector: state => {

            /**
             * Get the comment keys of a corrector
             * 
             * @param {string} corrector_key
             * @returns {string[]}
             */
            const fn = function(corrector_key) {
                let keys = [];
                state.comments
                    .filter(comment => comment.corrector_key == corrector_key)
                    .forEach(comment => keys.push(comment.key));
                return keys;
            };
            return fn;
        },

        getPointsOfCorrector: state => {

            /**
             * Get the points given by a corrector
             * 
             * @param {string} corrector_key
             * @returns {number}
             */
            const fn = function(corrector_key) {
                let points = 0;
                state.comments
                .filter(comment => comment.corrector_key == corrector_key)
                .forEach(comment => points += comment.points);
                return points;
            };
            return fn;
        },

        getCountOfExcellent: state => {

            /**
             * Get the number of comments of a corrector marked as excellent
             * 
             * @param {string} corrector_key
             * @returns {number}
             */
            const fn = function(corrector_key) {
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
            const fn = function(corrector_key) {
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
            }
            this.comments.push(comment);
            await this.removeEmptyComments(comment.key);
            await this.sortAndLabelComments();
            this.setMarkerChange();
            this.selectedKey = comment.key;

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
         * @param {Comment} comment
         * @public
         */
        async updateComment(comment) {
            const changesStore = useChangesStore();

            if (this.keys.includes(comment.key)) {
                await storage.setItem(comment.key, JSON.stringify(comment.getData()));
                await changesStore.setChange(new Change({
                    type: Change.TYPE_COMMENT,
                    action: Change.ACTION_SAVE,
                    key: comment.key,
                    item_key: comment.item_key
                }))
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
                this.selectedKey = '';
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
         * Remove empty comments of the current item (internally used)
         *
         * @param {string} keepKey - key of a (newly created) comment that should be kept
         * @private
         */
        async removeEmptyComments(keepKey) {
            
            // 28.7.2023: empty comments should be kept
            return;
            
            const pointsStore = usePointsStore();

            let comments = this.comments.filter(comment =>
                comment.key != keepKey
                && comment.comment == ''
                && !comment.rating_excellent
                && !comment.rating_cardinal
                && !pointsStore.getCommentHasPoints(comment.key)
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
                    const corrector = correctorsStore.getCorrector(comment.corrector_key);
                    if (corrector) {
                        comment.label = corrector.title;
                        comment.prefix = 'other';
                    }
                    else {
                        comment.label = 'Corrector ' + comment.corrector_key;
                        comment.prefix = 'other';
                    }
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
         * Filter the displayed comments by given points (directly, not per criterion)
         * @param {string} corrector_key
         * @param {bool} rating_excellent
         * @param {bool} rating_cardinal
         */
        setFilterByPoints(corrector_key) {
            this.filterKeys = [];
            for (const comment of this.comments) {
                if (comment.corrector_key == corrector_key && comment.points > 0) {
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
                    if (pointsStore.getCommentHasPointsForCriterion(comment.key, criterion_key)) {
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
            this.$reset();
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
                this.$reset();
                
                const keys = await storage.getItem('keys');
                if (keys) {
                    this.keys = JSON.parse(keys);
                }
                this.showOtherCorrectors = !! JSON.parse(await storage.getItem('showOtherCorrectors'));
                
                for (const key of this.keys) {
                    const comment = new Comment(JSON.parse(await storage.getItem(key)));
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
                this.$reset();

                for (const comment_data of data) {
                    const comment = new Comment(comment_data);
                    this.keys.push(comment.key);
                    await storage.setItem(comment.key, JSON.stringify(comment.getData()));
                    if (comment.item_key == currentItemKey) {
                        this.comments.push(comment);
                    }
                };

                await this.removeEmptyComments();
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
            const changesStore = useChangesStore();
            const changes = [];
            for (const change of changesStore.getChangesFor(Change.TYPE_COMMENT, sendingTime)) {
                if (change.action == Change.ACTION_SAVE) {
                    const data = await storage.getItem(change.key);
                    if (data) {
                        change.payload = JSON.parse(data);
                    }
                }
                changes.push(change);
            };
            return changes;
        },
        

        /**
         * Update the keys of comments after sending to the backend
         * A key is changed from a temporary string to a numeric value for a saved comment
         * A new key is null for a deleted comment
         *
         * @param {object} matches - assoc array with old and new string keys
         */
        async updateKeys(matches= {}) {

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
                        let comment = new Comment(JSON.parse(await storage.getItem(key)));
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
                await storage.setItem(comment.key, JSON.stringify(comment.getData()));
            }
            await storage.setItem('keys', JSON.stringify(this.keys));
        }
    }
});

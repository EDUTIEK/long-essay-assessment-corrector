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
            keys: [],                   // list of string keys of all comments in the storage
            comments: [],               // list of comment objects for the currrent correction item

            // not saved in storage
            selectedKey: '',                // key of the currently selected comment
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

        activeComments(state) {
            const apiStore = useApiStore();
            const correctorsStore = useCorrectorsStore();
            return state.comments.filter(comment => comment.corrector_key == apiStore.userKey
                || comment.corrector_key == correctorsStore.activeKey);
        },

        currentCommentKeys(state) {
            let keys = [];
            state.comments.forEach(comment => keys.push(comment.key));
            return keys;
        },

        getComment(state) {
            return (key) => state.comments.find(element => element.key == key);
        },


        getOwnCommentsInRange(state) {
            return (start_position, end_position) => state.activeComments.filter(comment => comment.prefix =='own'
                && comment.start_position <= end_position && comment.end_position >= start_position
            );
        },
    },

    /**
     * Internal actions (that should not be calles from outside start with '_'
     */
    actions: {

        /**
         * Set the currently selected comment
         *
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
         *
         * @param {integer} start_positon - the first marked word of the comment
         * @param {integer} end_position - the last marked word of the comment
         * @param {integer} parent_number - the number of the parent paragraph
         * @public
         */
        async createComment(start_positon, end_position, parent_number) {
            const apiStore = useApiStore();
            let comment = new Comment({
                item_key: apiStore.itemKey,
                corrector_key: apiStore.userKey,
                start_position: start_positon,
                end_position: end_position,
                parent_number: parent_number
            })

            // first do state changes (trigger watchers)
            this.keys.push(comment.key);
            this.comments.push(comment);
            await this.removeEmptyComments(comment.key);
            await this.sortAndLabelComments();
            this.selectedKey = comment.key;

            // then save the comment
            await storage.setItem(comment.key, comment.getData());
            await storage.setItem('commentKeys', JSON.stringify(this.keys));
            return comment.key;
        },

        /**
         * Update a comment in the store
         *
         * @param {comment} comment
         * @public
         */
        async updateComment(comment) {
            if (this.keys.includes(comment.key)) {
                await storage.setItem(comment.key, comment.getData());
            }
        },

        /**
         * Delete a comment
         * Sort and label the remaining comments
         *
         * @param {string} removeKey
         * @public
         */
        async deleteComment(removeKey) {
            await this.removeComment(removeKey);
            await this.sortAndLabelComments();
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
                await storage.setItem('commentKeys', JSON.stringify(this.keys));
                await storage.removeItem(removeKey);
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

            for (let i = 0; i < comments.length; i++) {
                await this.removeComment(comments[i].key);
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
            for (let i = 0; i < this.comments.length; i++) {
                let comment = this.comments[i];
                if (comment.corrector_key != apiStore.userKey) {
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
         * Clear the whole storage
         * @private
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
         * @param {string} currentItemKey - key of the correction item that is shown
         * @pablic
         */
        async loadFromStorage(currentItemKey) {
            try {
                const keys = await storage.getItem('commentKeys');
                if (keys) {
                    this.keys = JSON.parse(keys);
                }
                this.comments = [];
                this.currentKey = '';

                let index = 0;
                while (index < this.keys.length) {
                    let comment = await storage.getItem(this.keys[index]);
                    if (comment.item_key == currentItemKey) {
                        this.comments.push(comment);
                    }
                    index++;
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
                this.comments = [];
                this.selectedKey = '';

                let index = 0;
                while (index < data.length) {
                    let comment_data = data[index];
                    let comment = new Comment(comment_data);
                    this.keys.push(comment.key);
                    await storage.setItem(comment.key, comment.getData());
                    if (comment.item_key == currentItemKey) {
                        this.comments.push(comment);
                    }
                    index++;
                }
                await this.removeEmptyComments();
                await this.sortAndLabelComments();

                await storage.setItem('commentKeys', JSON.stringify(this.keys));
            }
            catch (err) {
                console.log(err);
            }
        }
    }
});

import { defineStore } from 'pinia';
import localForage from "localforage";
import Comment from '@/data/Comment';
import {useApiStore} from "@/store/api";
import {useCorrectorsStore} from "@/store/correctors";
import api from "js-cookie";

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
            selectedKey: ''             // key of the currently selected comment
        }
    },

    getters: {

        getComment(state) {
            return (key) => state.comments.find(element => element.key == key);
        },

        getActiveComments(state) {
            const apiStore = useApiStore();
            const correctorsStore = useCorrectorsStore();
            return this.comments.filter(comment => comment.corrector_key == apiStore.userKey || comment.corrector_key == correctorsStore.activeKey);
        },

        getActiveOwnComments(state) {
            const apiStore = useApiStore();
            return this.comments.filter(comment => comment.corrector_key == apiStore.userKey);
        },

        getActiveOtherComments(state) {
            const correctorsStore = useCorrectorsStore();
            return this.comments.filter(comment => comment.corrector_key == correctorsStore.activeKey);
        },

        getActiveCommentsInRange(start_position, end_position) {
            return this.comments.filter(comment => comment.start_position <= end_position && comment.end_position >= start_position);
        }
    },

    actions: {

        sortAndLabel() {
            const apiStore = useApiStore();

            this.comments = this.comments.sort(compareComments);

            let parent = 0;
            let number = 0;
            for (let i = 0; i < this.comments.length; i++) {
                let comment = this.comments[i];
                if (comment.corrector_key != apiStore.userKey) {
                    comment.label = '';
                }
                else {
                    if (comment.parent_number > parent) {
                        parent = comment.parent_number;
                        number = 1;
                    } else {
                        number++;
                    }
                    comment.label = parent.toString() + '.' + number.toString();
                }
            }
        },

        selectComment(key) {
            this.selectedKey = key;
        },

        /**
         * Create a new comment
         *
         * @param {integer} start_positon - the first marked word of the comment
         * @param {integer} end_position - the last marked word of the comment
         * @param {integer} parent_number - the number of the parent paragraph
         * @return {string} - the temporary key of the cmment
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
            this.keys.push(comment.key);
            this.comments.push(comment);
            this.sortAndLabel();
            this.selectComment(comment.key)
            await storage.setItem(comment.key, comment.getData());
            await storage.setItem('commentKeys', JSON.stringify(this.keys));

            return comment.key;
        },

        /**
         * Update a comment in the store
         * @param {comment} comment
         */
        async updateComment(comment) {
            if (this.keys.includes(comment.key)) {
                await storage.setItem(comment.key, comment.getData());
            }
        },

        /**
         * Delete a comment
         * @param {string} removeKey
         */
        async deleteComment(removeKey) {

            this.selectedKey = '';
            this.comments = this.comments.filter(comment => comment.key != removeKey)
            this.sortAndLabel();
            if (this.keys.includes(removeKey)) {
                this.keys = this.keys.filter(key => key != removeKey)
                await storage.setItem('commentKeys', JSON.stringify(this.keys));
                await storage.removeItem(removeKey);
            }
        },

        async clearStorage() {
            try {
                await storage.clear();
            }
            catch (err) {
                console.log(err);
            }
        },

        /**
         * Load the comments datafrom the storage
         * @param {string} currentItemKey - key of the correction item that is shown
         */
        async loadFromStorage(currentItemKey) {
            try {
                const keys = await storage.getItem('commentKeys');
                if (keys) {
                    this.keys = JSON.parse(keys);
                }
                this.comments = [];

                let index = 0;
                while (index < this.keys.length) {
                    let comment = await storage.getItem(this.keys[index]);
                    if (comment.item_key == currentItemKey) {
                        this.comments.push(comment);
                    }
                    index++;
                }
                this.sortAndLabel();

            } catch (err) {
                console.log(err);
            }
        },

        /**
         * Load the comments data from the backend
         * All keys and comments are put to the storage
         * Only the comments of the current item are loaded to the state
         *
         * @param {array} data - array of plain objects
         * @param {string} currentItemKey - key of the correction item that is shown
         */
        async loadFromData(data, currentItemKey) {
            try {
                await storage.clear();

                this.keys = [];
                this.comments = [];

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
                this.sortAndLabel();

                await storage.setItem('commentKeys', JSON.stringify(this.keys));
            }
            catch (err) {
                console.log(err);
            }
        }
    }
});

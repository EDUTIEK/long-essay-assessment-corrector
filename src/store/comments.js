import { defineStore } from 'pinia';
import localForage from "localforage";
import Comment from '@/data/Comment'

const storage = localForage.createInstance({
    storeName: "corrector-comments",
    description: "Corrector comments data",
});

/**
 * Comments Store
 */
export const useCommentsStore = defineStore('comments',{
    state: () => {
        return {
            // saved in storage
            keys: [],                 // list of string keys
            comments: [],             // list of comment objects
        }
    },

    getters: {
        hasComments: (state) => state.comments.length > 0,

        getComment(state) {
            return (key) => state.comments.find(element => element.key == key)
        },
    },

    actions: {

        async clearStorage() {
            try {
                await storage.clear();
            }
            catch (err) {
                console.log(err);
            }
        },

        async loadFromStorage() {
            try {
                const keys = await storage.getItem('commentKeys');
                if (keys) {
                    this.keys =  JSON.parse(keys);
                }
                this.comments = [];

                let index = 0;
                while (index < this.keys.length) {
                    let comment = await storage.getItem(this.keys[index]);
                    this.comments.push(comment);
                    index++;
                }

            } catch (err) {
                console.log(err);
            }
        },

        async loadFromData(data) {
            try {
                await storage.clear();

                this.keys = [];
                this.comments = [];

                let index = 0;
                while (index < data.length) {
                    let comment_data = data[index];
                    let comment = new Comment(comment_data);
                    this.comments.push(comment);
                    this.keys.push(comment.key);
                    await storage.setItem(comment.key, comment.getData());
                    index++;
                }

                await storage.setItem('commentKeys', JSON.stringify(this.keys));
            }
            catch (err) {
                console.log(err);
            }
        }
    }
});

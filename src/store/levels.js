import { defineStore } from 'pinia';
import localForage from "localforage";

const storage = localForage.createInstance({
    storeName: "corrector-levels",
    description: "Grade level data",
});

/**
 * Levels Store
 */
export const useLevelsStore = defineStore('levels',{
    state: () => {
        return {
            // saved in storage
            keys: [],               // list of string keys
            levels: [],             // list of level objects
        }
    },


    getters: {
        hasLevels: (state) => state.levels.length > 0,

        getLevel(state) {
            return (key) => state.levels.find(element => element.key == key)
        },

        getLevelForPoints(state) {
            return function (points) {
                let level = null;
                let last_points = 0;
                for (let i = 0; i < state.levels.length; i++) {
                    if (state.levels[i].min_points <= points
                    && state.levels[i].min_points >= last_points) {
                        level = state.levels[i];
                        last_points = level.points;
                    }
                }
                return level;
            }
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
            this.$reset();
        },

        async loadFromStorage() {
            try {
                this.$reset();
                
                const keys = await storage.getItem('levelKeys');
                if (keys) {
                    this.keys =  JSON.parse(keys);
                }
                
                for (const key of this.keys) {
                    const level = await storage.getItem(key);
                    this.levels.push(level);
                }

            } catch (err) {
                console.log(err);
            }
        },

        async loadFromData(data) {
            try {
                await storage.clear();
                this.$reset();
                
                for (const level of data) {
                    this.levels.push(level);
                    this.keys.push(level.key);
                    await storage.setItem(level.key, level);
                }

                await storage.setItem('levelKeys', JSON.stringify(this.keys));
            }
            catch (err) {
                console.log(err);
            }
        }
    }
});

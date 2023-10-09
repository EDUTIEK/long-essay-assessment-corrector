import { defineStore } from 'pinia';
import localForage from "localforage";

const storage = localForage.createInstance({
    storeName: "corrector-correctors",
    description: "Correctors data",
});

/**
 * Correctors Store
 */
export const useCorrectorsStore = defineStore('correctors',{
    state: () => {
        return {
            // saved in storage
            keys: [],               // list of string keys
            correctors: [],         // list of corrector objects
        }
    },


    getters: {
        hasCorrectors: (state) => state.correctors.length > 0,

        getCorrector(state) {
            return (key) => state.correctors.find(element => element.key == key)
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
                const keys = await storage.getItem('correctorKeys');
                if (keys) {
                    this.keys =  JSON.parse(keys);
                }
                this.correctors = [];

                let index = 0;
                while (index < this.correctors.length) {
                    let corrector = await storage.getItem(this.keys[index]);
                    this.correctors.push(corrector);
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
                this.correctors = [];

                let index = 0;
                while (index < data.length) {
                    let corrector = data[index];
                    this.correctors.push(corrector);
                    this.keys.push(corrector.key);
                    await storage.setItem(corrector.key, corrector);
                    index++;
                }

                await storage.setItem('correctorKeys', JSON.stringify(this.keys));
            }
            catch (err) {
                console.log(err);
            }
        },
    }
});

import { defineStore } from 'pinia';
import localForage from "localforage";
import { useApiStore } from '@/store/api';

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
            correctors: [],         // list of corrector objects (key, title)
        }
    },

    /**
     * Getter functions (with params) start with 'get', simple state queries not
     */
    getters: {

        otherCorrectors: state => {
            const apiStore = useApiStore();
            return state.correctors.filter(element => element.key != apiStore.correctorKey)
        },

        getCorrector: state => {
            
            /**
             * Get a corrector object by key
             * @param {string}  key  - key of the corrector
             * @return {object}
             */
           const fn = function(key) {
               return state.correctors.find(element => element.key == key)
           }
           return fn;
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
                
                const keys = await storage.getItem('correctorKeys');
                if (keys) {
                    this.keys =  JSON.parse(keys);
                }
                
                for (const key of this.keys) {
                    const corrector = await storage.getItem(key);
                    this.correctors.push(corrector);
                }

            } catch (err) {
                console.log(err);
            }
        },

        async loadFromData(data) {

            try {
                await storage.clear();
                this.$reset();
                
                for (const corrector of data) {
                    this.correctors.push(corrector);
                    this.keys.push(corrector.key);
                    await storage.setItem(corrector.key, corrector);
                }

                await storage.setItem('correctorKeys', JSON.stringify(this.keys));
            }
            catch (err) {
                console.log(err);
            }
        },
    }
});

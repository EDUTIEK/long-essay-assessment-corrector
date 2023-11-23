import { defineStore } from 'pinia';
import localForage from "localforage";
import { useApiStore } from '@/store/api';
import Corrector from '@/data/Corrector';

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
            keys: [],               // list of all string keys of correctors in the storage
            correctors: [],         // list of corrector objects for the current item
        }
    },

    /**
     * Getter functions (with params) start with 'get', simple state queries not
     */
    getters: {

        countCorrectors: state => state.correctors.length,
        
        correctorKeys: state => {
          let keys = [];
          for (const corrector of state.correctors) {
              keys.push(corrector.corrector_key);
          }
          return keys;
        },
        
        /**
         * Get a list of corrector objects for other Correctors
         * @param state
         * @returns {Corrector[]}
         */
        otherCorrectors: state => {
            const apiStore = useApiStore();
            return state.correctors
                .filter(element => element.corrector_key != apiStore.correctorKey)
                .sort((a, b) => a.position - b.position);
        },
        
        getPositionText: state => {

            /**
             * Get the corrector poition text
             * @param {string} corrector_key
             * @returns {string}
             */
            const fn = function(corrector_key) {
                if (state.correctors.length <= 1) {
                    return '';
                }

                const corrector = state.correctors.find(element => element.corrector_key == corrector_key);
                if (corrector) {
                    if (corrector.position == 0) {
                        return '(Erstkorrektur)'
                    } else if (corrector.position == 1) {
                        return '(Zweitkorrektur)'
                    } else if (corrector.position == state.correctors.length - 1) {
                        return '(Endkorrektur)'
                    } else {
                        return '(' + (corrector.position + 1) + '. Korrektur)';
                    }
                }
                return ''
            }
            return fn;
        },

        getCorrector: state => {
            
            /**
             * Get a corrector object by its corrector_key
             * @param {string}  corrector_key  - key of the corrector
             * @return {Corrector|null}
             */
           const fn = function(corrector_key) {
               return state.correctors.find(element => element.corrector_key == corrector_key)
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

        async loadFromStorage(currentItemKey) {
            try {
                this.$reset();
                
                const keys = await storage.getItem('correctorKeys');
                if (keys) {
                    this.keys = JSON.parse(keys);
                }
                
                for (const key of this.keys) {
                    const corrector = new Corrector(JSON.parse(await storage.getItem(key)));
                    if (corrector.item_key == currentItemKey) {
                        this.correctors.push(corrector);
                    }
                }

            } catch (err) {
                console.log(err);
            }
        },

        async loadFromData(data, currentItemKey) {

            try {
                await storage.clear();
                this.$reset();
                
                for (const corrector_data of data) {
                    const corrector = new Corrector(corrector_data);
                    this.keys.push(corrector.getKey());
                    await storage.setItem(corrector.getKey(), JSON.stringify(corrector.getData()));
                    if (corrector.item_key == currentItemKey) {
                        this.correctors.push(corrector);
                    }
                }

                await storage.setItem('correctorKeys', JSON.stringify(this.keys));
            }
            catch (err) {
                console.log(err);
            }
        },
    }
});

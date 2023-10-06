import { defineStore } from 'pinia';
import localForage from "localforage";
import Change from '@/data/Change';

const storage = localForage.createInstance({
    storeName: "corrector-changes",
    description: "Corrector changes data",
});


function startState() {
    const state = {};
    for (const type of Change.ALLOWED_TYPES) {
        state[type] = {};   // changes of objects of the type that have to be sent to the backend: key => Change
    }
    return state;
}

/**
 * Changes Store
 * 
 * This stores unsent change objecs for all created, updated or deleted objects of ertain types, e.g. comment
 * The stored changes just give the type, keys and timestamp of the change
 * The actual changed data is added as a payload when the change is sent to the backend
 */
export const useChangesStore = defineStore('changes',{
    state: () => {
        return statState();
    },

    /**
     * Getter functions (with params) start with 'get', simple state queries not
     */
    getters: {
        countChanges: state => {
            let count = 0;
            for (const type in state) {
                count += Object.keys(state[type]).length;
            }
            return count;
        },


        /**
         * Get the changes of a type
         *
         * @param {string} type - data type
         * @param {integer} maxTime - maximum last change or 0 to get all
         * @return {array} Change objects
         */
        getChanges(state) {

            return (type, maxTime = 0) => {
                const changes = [];
                for (const key in state[type]) {
                    const change = state[type][key];
                    if (maxTime == 0 || change.last_change < maxTime) {
                        changes.push(change);
                    }
                }
                return changes;
            }
        },
    },
    
    actions: {
                
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
            this.$state = startState();
        },

        /**
         * Load the changes storage
         * Creates change objects from the plain data
         * @public
         */
        async loadFromStorage() {
            const state = startState();
            
            try {
                for (const type in state) {
                    const stored = await storage.getItem(type);
                    if (stored) {
                        const parsed = JSON.parse(item);
                        if (typeof parsed === 'object' && parsed !== null) {
                            for (const key in parsed) {
                                state[type][key] = new Change(parsed[key]);
                            }    
                        }
                    }
                }
            } catch (err) {
                console.log(err);
            }
            
            this.$state = state;
        },

        /**
         * Save changes of a type to the storage
         * Saves the change objects as plain data
         * @param {string} type
         */
        async saveChangesOfTypeToStorage(type) {
            const data = {};
            for (const key in this.$state[type]) {
                const change = this.$state[type][key];
                data[key] = change.getData();
            }
            await storage.setItem(type, JSON.stringify(data));
        },
        
        /**
         * Check if changes are in the storage
         * (called from api store at initialisation)
         */
        async hasChangesInStorage() {
            for (const type in state) {
                const stored = await storage.getItem(type);
                if (stored) {
                    return true;
                }
            }
            return false;
        },


        /**
         * Set a changes and save the changes
         * @param {Change} change
         */
        async setChange(change) {
            if (change.isValid()) {
                this.$state[change.type][change.key] = change;
                await this.saveChangesOfTypeToStorage(change.type);
            }
            
        },

        /**
         * Unset a changes and save the changes
         * @param {Change} change
         */
        async unsetChange(change) {
            if (change.isValid()) {
                delete this.$state[change.type][change.key];
                await this.saveChangesOfTypeToStorage(change.type);
            }
        },
        
    }
});

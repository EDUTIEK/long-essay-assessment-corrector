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
 * This stores unsent change markers for all created, updated or deleted objects of certain types, e.g. Comment
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

        /**
         * Count the number of changes
         * @returns {integer}
         */
        countChanges: state => {
            let count = 0;
            for (const type in state) {
                count += Object.keys(state[type]).length;
            }
            return count;
        },

        /**
         * Get the count of changes for an object type
         * @param {string} type see Change.ALLOWED_TYPES
         * @returns {integer}
         */
        getCountOfChangesFor: state => {
            
            return type => {
                if (!Change.ALLOWED_TYPES.includes(type)) {
                    console.log ('wrong type' + type);
                    return 0;
                }
                return Object.keys(state[type]).length;
            }
        },
        
        /**
         * Get the changes of a type
         * @param {string} type - dsee Change.ALLOWED_TYPES
         * @param {integer} maxTime - maximum last change or 0 to get all
         * @return {array} Change objects
         * @see setChangesSent
         */
        getChangesFor(state) {
            
             return (type, maxTime = 0) => {
                if (!Change.ALLOWED_TYPES.includes(type)) {
                    return [];
                }
                const changes = [];
                for (const key in state[type]) {
                    const change = state[type][key];
                    if (maxTime == 0 || change.last_change <= maxTime) {
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
                        const parsed = JSON.parse(stored);
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
         * @param {string} type see Change.ALLOWED_TYPES
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
            for (const type in this.$state) {
                const stored = await storage.getItem(type);
                if (stored) {
                    return true;
                }
            }
            return false;
        },


        /**
         * Set a change and save the changes
         * @param {Change} change
         */
        async setChange(change) {
            if (change.isValid()) {
                this.$state[change.type][change.key] = change;
                await this.saveChangesOfTypeToStorage(change.type);
            }
        },

        /**
         * Unset a change and save the changes
         * @param {Change} change
         */
        async unsetChange(change) {
            if (change.isValid()) {
                delete this.$state[change.type][change.key];
                await this.saveChangesOfTypeToStorage(change.type);
            }
        },
        

        /**
         * Cleanup changes that have been sent to the backend
         * The will delete all changes thet are noted as processed and that are not newer than the sending time
         *
         * @param {string} type see Change.ALLOWED_TYPES
         * @param {object} processed - old key: new key or null if the data has been deleted
         * @param {integer} maxTime maximum timestamp until processed changes should be deleted
         * @see getChangesFor
         */
        async setChangesSent(type, processed, maxTime) {

            const changes = this.$state[type];
            const toStore = false;
            
            for (const old_key in processed) {
                const new_key = processed[old_key];
                const change = changes[old_key];
                
                if (change) {
                    if (change.last_change <= maxTime) {
                        delete changes[old_key];
                        toStore = true;
                    }
                    else if (new_key == null || new_key != old_key) {
                        change.key = new_key;
                        changes[new_key] = change;
                        delete changes[old_key];
                        toStore = true;
                    }
                }
            }
            if (toStore) {
                await this.saveChangesOfTypeToStorage(type);
            }
        }
    }
});

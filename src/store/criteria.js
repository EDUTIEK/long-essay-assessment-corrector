import { defineStore } from 'pinia';
import localForage from "localforage";
import Criterion from '@/data/Criterion'

const storage = localForage.createInstance({
    storeName: "corrector-criteria",
    description: "Rating criterion data",
});

/**
 * Criteria Store
 */
export const useCriteriaStore = defineStore('criteria',{
    state: () => {
        return {
            // saved in storage
            keys: [],                 // list of string keys
            criteria: [],             // list of criterion objects
        }
    },

    getters: {
        hasCriteria: (state) => state.criteria.length > 0,

        getCriterion(state) {
            return (key) => state.criteria.find(element => element.key == key)
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
                const keys = await storage.getItem('criterionKeys');
                if (keys) {
                    this.keys =  JSON.parse(keys);
                }
                this.criteria = [];

                let index = 0;
                while (index < this.keys.length) {
                    let criterion = await storage.getItem(this.keys[index]);
                    this.criteria.push(criterion);
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
                this.criteria = [];

                let index = 0;
                while (index < data.length) {
                    let criterion_data = data[index];
                    let criterion = new Criterion(criterion_data);
                    this.criteria.push(criterion);
                    this.keys.push(criterion.key);
                    await storage.setItem(criterion.key, criterion.getData());
                    index++;
                }

                await storage.setItem('criterionKeys', JSON.stringify(this.keys));
            }
            catch (err) {
                console.log(err);
            }
        }
    }
});

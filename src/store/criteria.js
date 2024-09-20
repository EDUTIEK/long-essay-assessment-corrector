import { defineStore } from 'pinia';
import localForage from "localforage";
import Criterion from '@/data/Criterion'
import { useApiStore } from '@/store/api';
import { useCorrectorsStore } from '@/store/correctors';

const storage = localForage.createInstance({
  storeName: "corrector-criteria",
  description: "Rating criterion data",
});

/**
 * Criteria Store
 */
export const useCriteriaStore = defineStore('criteria', {
  state: () => {
    return {
      // saved in storage
      keys: [],                 // list of string keys
      criteria: [],             // list of criterion objects
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {
    hasAnyCriteria: state => {
      const correctorsStore = useCorrectorsStore();
      const correctorKeys = correctorsStore.correctorKeys;
      return !!state.criteria.find(criterion => criterion.corrector_key == '' || correctorKeys.includes(
        criterion.corrector_key));
    },

    hasOwnCriteria: state => {
      const apiStore = useApiStore();
      return !!state.criteria.find(criterion => criterion.corrector_key == '' || criterion.corrector_key == apiStore.correctorKey);
    },

    ownCriteria: state => {
      const apiStore = useApiStore();
      return state.criteria.filter((criterion => criterion.corrector_key == '' || criterion.corrector_key == apiStore.correctorKey));
    },

    sumOfMaxPoints: state => {
      let sum = 0;
      state.criteria.forEach(criterion => sum += criterion.points);
      return sum;
    },

    getCriterion: state => {

      /**
       * Get a criterion by its key
       *
       * @param {string }key
       * @returns {Criterion|null}
       */
      const fn = function (key) {
        return state.criteria.find(element => element.key == key)
      }
      return fn;
    },

    getCorrectorHasCriteria: state => {

      /**
       * Get if a corrector has criteria defined
       *
       * @param {string} corrector_key
       * @returns {boolean}
       */
      const fn = function (corrector_key) {
        return !!state.criteria.find(criterion => criterion.corrector_key == '' || criterion.corrector_key == corrector_key);
      };
      return fn;
    },


    getCorrectorCriteria: state => {

      /**
       * Get the criteria of a corrector
       *
       * @param corrector_key
       * @returns {Criterion[]}
       */
      const fn = function (corrector_key) {
        return state.criteria.filter((criterion => criterion.corrector_key == '' || criterion.corrector_key == corrector_key));
      };
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

        const keys = await storage.getItem('criterionKeys');
        if (keys) {
          this.keys = JSON.parse(keys);
        }

        for (const key of this.keys) {
          const criterion = await storage.getItem(key);
          this.criteria.push(criterion);
        }

      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromData(data) {
      try {
        await storage.clear();
        this.$reset();

        for (const criterion_data of data) {
          const criterion = new Criterion(criterion_data);
          this.criteria.push(criterion);
          this.keys.push(criterion.key);
          await storage.setItem(criterion.key, criterion.getData());
        }

        await storage.setItem('criterionKeys', JSON.stringify(this.keys));
      }
      catch (err) {
        console.log(err);
      }
    }
  }
});

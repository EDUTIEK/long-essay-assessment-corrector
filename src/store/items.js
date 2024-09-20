import { defineStore } from 'pinia';
import localForage from "localforage";
import { useApiStore } from '@/store/api';
import Item from '@/data/Item';

const storage = localForage.createInstance({
  storeName: "corrector-items",
  description: "Items data",
});

/**
 * Items Store
 */
export const useItemsStore = defineStore('items', {
  state: () => {
    return {
      // saved in storage
      keys: [],               // list of all items string keys
      items: [],              // list of all items objects
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {
    hasItems: state => state.keys.length > 0,
    firstKey: state => state.keys.length > 0 ? state.keys[0] : '',
    lastKey: state => state.keys.length > 0 ? state.keys[state.keys.length - 1] : '',

    correctionAllowed: state => state.currentItem.correction_allowed,
    authorizationAllowed: state => state.currentItem.authorization_allowed,

    currentItem: state => {
      const apiStore = useApiStore();
      return state.items.find(element => element.key == apiStore.itemKey);
    },

    getPreviousKey: state => {

      /**
       * Get the key of the previous item
       *
       * @param {string} key
       * @returns {string}
       */
      const fn = function (key) {
        for (let i = 1; i < state.keys.length; i++) {
          if (state.keys[i] == key) {
            return state.keys[i - 1];
          }
        }
        return '';
      }
      return fn;
    },

    getNextKey: state => {

      /**
       * Get the key of the next item
       *
       * @param {string} key
       * @returns {string}
       */
      const fn = function (key) {
        for (let i = 0; i < state.keys.length - 1; i++) {
          if (state.keys[i] == key) {
            return state.keys[i + 1];
          }
        }
        return '';
      }
      return fn;
    },


    getItem: state => {

      /**
       * Get the item of a key
       *
       * @param {string} key
       * @param {object} key
       * @return Item
       */
      const fn = function (key, dummy = null) {
        for (const item of state.items) {
          if (item.key == key) {
            return item;
          }
        }
        return dummy;
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

        const keys = await storage.getItem('itemKeys');
        if (keys) {
          this.keys = JSON.parse(keys);
        }

        for (const key of this.keys) {
          const item = new Item(JSON.parse(await storage.getItem(key)));
          this.items.push(item);
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

        for (const item_data of data) {
          const item = new Item(item_data)
          this.items.push(item);
          this.keys.push(item.key);
          await storage.setItem(item.key, JSON.stringify(item.getData()));
        }

        await storage.setItem('itemKeys', JSON.stringify(this.keys));
      }
      catch (err) {
        console.log(err);
      }
    },

    async addItem(item) {
      try {
        if (!this.keys.includes(item.key)) {
          this.items.unshift(item);           // add to beginning
          this.keys.unshift(item.key);
          await storage.setItem(item.key, JSON.stringify(item.getData()));
          await storage.setItem('itemKeys', JSON.stringify(this.keys));
        }
      }
      catch (err) {
        console.log(err);
      }
    },

    async updateItem(item) {
      const index = this.items.findIndex(element => element.key === item.key);
      if (index !== -1) {
        this.items[index] = item;
        await storage.setItem(item.key, JSON.stringify(item.getData()));
        return;
      }
    }
  }
});

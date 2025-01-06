import { defineStore } from 'pinia';
import localForage from "localforage";
import { useApiStore } from "./api";
import axios from 'axios'

const storage = localForage.createInstance({
  storeName: "corrector-resources",
  description: "Resource data",
});

/**
 * Resources Store
 */
export const useResourcesStore = defineStore('resources', {
  state: () => {
    return {
      // saved in storage
      keys: [],               // list of string keys
      resources: [],          // list of resource objects
      activeKey: ''           // key of the active resource
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {
    hasResources: state => state.resources.length > 0,

    hasInstruction: state => {
      const resource = state.resources.find(element => element.type == 'instruct');
      return resource ? true : false;
    },

    hasSolution: state => {
      const resource = state.resources.find(element => element.type == 'solution');
      return resource ? true : false;
    },


    instruction: state => {
      return state.resources.find(element => element.type == 'instruct');
    },

    solution: state => {
      return state.resources.find(element => element.type == 'solution');

    },

    hasFileOrUrlResources: state => {
      const resource = state.resources.find(element => element.type == 'file' || element.type == 'url');
      return resource ? true : false;
    },

    fileOrUrlResources: state => {
      return state.resources.filter(element => element.type == 'file' || element.type == 'url');
    },

    activeTitle: state => {
      const resource = state.resources.find(element => element.key == state.activeKey);
      return resource ? resource.title : ""
    },

    getResource: state => {

      /**
       * Get a resource by its key
       *
       * @param {string} key
       * @returns {object|null}
       */
      const fn = function (key) {
        return state.resources.find(element => element.key == key);
      }
      return fn;
    },

    getResourceIsActive: state => {

      /**
       * Get if a resource is active
       *
       * @param {object} resource
       * @returns {boolean}
       */
      const fn = function (resource) {
        return state.activeKey == resource.key;
      }
      return fn;
    }
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

        const keys = await storage.getItem('resourceKeys');
        if (keys) {
          this.keys = JSON.parse(keys);
        }
        this.activeKey = await storage.getItem('activeKey') ?? '';

        for (const key of this.keys) {
          const resource = await storage.getItem(key);
          this.resources.push(resource);
        }

        this.loadFiles();
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromData(data) {
      const apiStore = useApiStore();

      try {
        await storage.clear();
        this.$reset();

        for (const resource of data) {
          resource.url = apiStore.getResourceUrl(resource.key);
          this.resources.push(resource);
          this.keys.push(resource.key);
          await storage.setItem(resource.key, resource);
        }

        await storage.setItem('resourceKeys', JSON.stringify(this.keys));
        await storage.setItem('activeKey', this.activeKey);

        this.loadFiles();
      }
      catch (err) {
        console.log(err);
      }
    },

    async selectResource(resource) {
      this.activeKey = resource.key;
      await storage.setItem('activeKey', this.activeKey);
    },

    /**
     * Preload file resources (workaround until service worker is implemented)
     * The Resources Component will only show PDF resources when they are immediately available
     * This preload forces the resources being in the browser cache
     *
     * https://stackoverflow.com/a/50387899
     */
    async loadFiles() {
      for (const key of this.keys) {
        let resource = this.getResource(key);
        let response = null;
        if (resource.type != 'url') {
          try {
            console.log('preload ' + resource.title + '...');
            response = await axios(resource.url, { responseType: 'blob', timeout: 60000 });
            // resource.objectUrl = URL.createObjectURL(response.data)
          }
          catch (error) {
            console.error(error);
            // return false;
          }
        }
      }
    }

  }
});

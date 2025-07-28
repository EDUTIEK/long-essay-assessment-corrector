import localForage from "localforage";
import Page from '@/data/Page';
import { defineStore } from 'pinia';
import { useApiStore } from "@/store/api";
import axios from 'axios';


const storage = localForage.createInstance({
  storeName: "corrector-pages",
  description: "Corrector page data",
});

/**
 * Comments Store
 */
export const usePagesStore = defineStore('pages', {
  state: () => {
    return {
      // saved in storage
      keys: [],                       // list of string keys of all pages in the storage
      pages: {},                      // collection of page objects for the currrent correction item, indexed by key

      // not saved in storage
      selectedKey: '',                // key of the currently selected page
      minPage: 0,                     // minimum page number
      maxPage: 0,                     // maximum page number
      loadedThumbs: 0,               // counter of loaded thumbnails
      loadedImages: 0,                // counter of loaded imagesd
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    hasPages: state => Object.keys(state.pages).length > 0,

    selectedPage: state => {
      return state.pages[state.selectedKey] ?? null;
    },

    selectedPageNo: state => {
      return state.selectedPage ? state.selectedPage.page_no : null;
    },

    currentPages: state => {
      let pages = [];
      for (const key in state.pages) {
        pages.push(state.pages[key]);
      }
      return pages
    },

    getPage: state => {

      /**
       * Get a page by its key
       *
       * @param {string] }key
       * @returns {Page|null}
       */
      const fn = function (key) {
        return state.pages[key] ?? null;
      }
      return fn;

    },

    getPageByPageNo: state => {

      /**
       * Get a page by its page number
       *
       * @param {string} number
       * @returns {Page|null}
       */
      const fn = function (number) {
        for (const key in state.pages) {
          if (state.pages[key].page_no == number) {
            return state.pages[key];
          }
        }
        return null;
      }
      return fn;
    }

  },

  actions: {

    /**
     * Set the current page key
     * This should be called when a page is manually selected in the page navigation
     * A watcher can trigger the change and show the new page
     * @param {string} key
     * @public
     */
    selectPage(key) {
      if (this.selectedKey != key) {
        this.selectedKey = key;
      }
    },

    /**
     * Select a page by its number
     * @param number
     */
    selectByPageNo(number) {
      for (const key in this.pages) {
        if (this.pages[key].page_no == number) {
          this.selectedKey = key;
          return true;
        }
      }
      return false;
    },

    calculateMinMaxPage() {

      let min = null;
      let max = null;
      for (const key in this.pages) {
        if (min === null || this.pages[key].page_no < min) {
          min = this.pages[key].page_no;
        }
        if (max === null || this.pages[key].page_no > max) {
          max = this.pages[key].page_no;
        }
      }

      if (min !== null) {
        this.minPage = min;
      }
      if (max !== null) {
        this.maxPage = max;
      }
    },

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
      this.purgeFiles();
      this.$reset();
    },

    /**
     * Load the pages data from the storage
     * Only the pages of the current item are loaded to the state
     *
     * @public
     */
    async loadFromStorage() {
      const apiStore = useApiStore();
      try {
        this.purgeFiles();
        this.$reset();

        const keys = await storage.getItem('keys');
        if (keys) {
          this.keys = JSON.parse(keys);
        }

        for (const key of this.keys) {
          const page = new Page(JSON.parse(await storage.getItem(key)));
          if (page.item_key == apiStore.itemKey) {
            this.pages[key] = page;
          }
        }
        this.calculateMinMaxPage();
        this.selectByPageNo(this.minPage);
        this.loadFiles();

      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Load the pages data from the backend
     *
     * All keys and pages are put to the storage
     * Only the pages of the current item are loaded to the state
     *
     * @param {array} data - array of plain objects
     * @public
     */
    async loadFromData(data) {
      const apiStore = useApiStore();
      try {
        await storage.clear();
        this.purgeFiles();
        this.$reset();

        for (const page_data of data) {
          const page = new Page(page_data);
          page.url = apiStore.getImageUrl(page.key, page.item_key);
          page.thumb_url = apiStore.getThumbUrl(page.key, page.item_key);
          this.keys.push(page.key);
          await storage.setItem(page.key, JSON.stringify(page.getData()));
          if (page.item_key == apiStore.itemKey) {
            this.pages[page.key] = page;
          }
        }
        ;

        await storage.setItem('keys', JSON.stringify(this.keys));

        this.calculateMinMaxPage();
        this.selectByPageNo(this.minPage);
        this.loadFiles();
      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Preload file resources (workaround until service worker is implemented)
     * The Resources Component will only show PDF resources when they are immediately available
     * This preload forces the resources being in the browser cache
     *
     * https://stackoverflow.com/a/50387899
     */
    async loadFiles() {
      try {
        for (const key in this.pages) {
          const page = this.pages[key];
          let response;

          if (page) {
            response = await axios(page.url, { responseType: 'blob', timeout: 60000 });
            // page.objectUrl = URL.createObjectURL(response.data);
            this.loadedImages++;

            response = await axios(page.thumb_url, { responseType: 'blob', timeout: 60000 });
            // page.thumbObjectUrl = URL.createObjectURL(response.data);
            this.loadedThumbs++;
          }
        }
      }
      catch (error) {
        console.error(error);
        // return false;
      }
    },

    /**
     * Purge the object urls of the page files
     */
    purgeFiles() {
      for (const key in this.pages) {
        const page = this.pages[key];
        if (page) {
          if (page.thumbObjectUrl !== null) {
            // URL.revokeObjectURL(page.thumbObjectUrl);
            page.thumbObjectUrl = null;
          }
          if (page.objectUrl !== null) {
            // URL.revokeObjectURL(page.objectUrl);
            page.objectUrl = null;
          }
        }
      }
      this.loadedThumbs = 0;
      this.loadedImages = 0;
    }
  }
});

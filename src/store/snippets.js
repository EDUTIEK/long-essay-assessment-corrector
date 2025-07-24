import { defineStore } from 'pinia';
import localForage from "localforage";
import Snippet from "@/data/Snippet";
import {useApiStore} from "@/store/api";
import {useChangesStore} from "@/store/changes";
import Change from "@/data/Change";

const storage = localForage.createInstance({
  storeName: "corrector-snippets",
  description: "Text Snippets",
});

/**
 * Levels Store
 */
export const useSnippetsStore = defineStore('snippets', {
  state: () => {
    return {
      // saved in storage
      keys: [],                 // list of string keys
      snippets: [],             // list of snippet objects

      selection_open: false,          // selection dialog is open
      open_for_purpose: null,         // purpose for which the selection is opened
      open_for_key: null,             // comment key for which the selection is opened
      insert_snippet_key: null,       // key of the snippet that should be inserted

      select: '',
      edit: new Snippet()
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    forComment: state => {
      return state.snippets.filter(element => element.purpose == Snippet.FOR_COMMENT);
    },

    forSummary: state => {
      return state.snippets.filter(element => element.purpose == Snippet.FOR_SUMMARY);
    },

    has: state => {

      /**
       * Get a snippet by its key
       *
       * @param {string} key
       * @returns {object|null}
       */
      const fn = function (key) {
        return state.keys.includes(key);
      }
      return fn;
    },

    get: state => {

      /**
       * Get a snippet by its key
       *
       * @param {string} key
       * @returns {object|null}
       */
      const fn = function (key) {
        return state.snippets.find(element => element.key == key);
      }
      return fn;
    },
  },

  actions: {

    openSelection(for_purpose, for_key) {
      this.open_for_purpose = for_purpose;
      this.open_for_key = for_key;
      this.selection_open = true;
    },

    applySelection() {

    },

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

        const keys = await storage.getItem('keys');
        if (keys) {
          this.keys = JSON.parse(keys);
        }
        for (const key of this.keys) {
          this.snippets.push(new Snippet(JSON.parse(await storage.getItem(key))));
          this.snippets = this.snippets.sort(Snippet.compare);
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

        for (const snippet_data of data) {
          const snippet = new Snippet(snippet_data);
          this.keys.push(snippet.key);
          await storage.setItem(snippet.key, JSON.stringify(snippet.getData()));
          this.snippets.push(snippet);
          this.snippets = this.snippets.sort(Snippet.compare);
        }
        await storage.setItem('keys', JSON.stringify(this.keys));
      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Create an snippet in the store
     * @param {Snippet} snippet
     * @public
     */
    async createSnippet(snippet) {
      const apiStore = useApiStore();
      const changesStore = useChangesStore();

      // first do state changes (trigger watchers)
      this.keys.push(snippet.key);
      this.snippets.push(snippet);
      this.snippets = this.snippets.sort(Snippet.compare);

      // then save the snippet
      await storage.setItem(snippet.key, JSON.stringify(snippet.getData()));
      await storage.setItem('keys', JSON.stringify(this.keys));
      await changesStore.setChange(new Change({
        type: Change.TYPE_SNIPPETS,
        action: Change.ACTION_SAVE,
        key: snippet.key
      }))
    },

    /**
     * Update an snippet in the store
     * @param {Snippet} snippet
     * @public
     */
    async updateSnippet(snippet) {
      const apiStore = useApiStore();
      const changesStore = useChangesStore();

      if (this.keys.includes(snippet.key)
      ) {
        await storage.setItem(snippet.key, JSON.stringify(snippet.getData()));
        await changesStore.setChange(new Change({
          type: Change.TYPE_SNIPPETS,
          action: Change.ACTION_SAVE,
          key: snippet.key
        }))
        this.snippets = this.snippets.sort(Snippet.compare);
      }
    },

    /**
     * Delete an snippet
     * @param {string} removeKey
     * @private
     */
    async deleteSnippet(removeKey) {
      const snippet = this.snippets.find(element => element.key == removeKey);

      this.snippets = this.snippets.filter(element => element.key != removeKey);
      if (this.keys.includes(removeKey)) {
        this.keys = this.keys.filter(key => key != removeKey)
        await storage.setItem('keys', JSON.stringify(this.keys));
        await storage.removeItem(removeKey);
      }
      this.deletedKey = removeKey;

      const changesStore = useChangesStore();
      const change = new Change({
        type: Change.TYPE_SNIPPETS,
        action: Change.ACTION_DELETE,
        key: snippet.key
      });

      this.snippets = this.snippets.sort(Snippet.compare);
    },
  }
});

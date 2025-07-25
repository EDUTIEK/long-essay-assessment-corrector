import { defineStore } from 'pinia';
import axios from 'axios'
import Cookies from 'js-cookie';
import { useSettingsStore } from "./settings";
import { useTaskStore } from "./task";
import { useLayoutStore } from "./layout";
import { useResourcesStore } from "./resources";
import { useItemsStore } from "./items";
import { useEssayStore } from "./essay";
import { usePagesStore } from './pages';
import { useSummariesStore } from "./summaries";
import { useLevelsStore } from "./levels";
import { useCriteriaStore } from "./criteria";
import { useCorrectorsStore } from "./correctors";
import { useCommentsStore } from "./comments";
import { usePointsStore } from "./points";
import { useChangesStore } from '@/store/changes';
import { usePreferencesStore } from '@/store/preferences';
import {useSnippetsStore} from "@/store/snippets";

import md5 from 'md5';
import Change from '@/data/Change';
import Item from '@/data/Item';


const sendInterval = 5000;      // time (ms) to wait for sending open savings to the backend

/**
 * API Store
 * Handles the communication with the backend
 */
export const useApiStore = defineStore('api', {

  state: () => {
    return {
      // saved in storage
      backendUrl: '',                     // url to be used for REST calls
      returnUrl: '',                      // url to be called when the corrector is closed
      userKey: '',                        // identifying user key of the correcting user
      environmentKey: '',                 // identifying key of the correcting envirnonment (defining the task)
      correctorKey: '',                   // identifying corrector key of the correcting user
      itemKey: '',                        // identifying key of the correction item
      dataToken: '',                      // authentication token for transmission if data
      fileToken: '',                      // authentication token for loading files
      timeOffset: 0,                      // differnce between server time and client time (ms)
      isReview: false,                    // corrector is opened for review
      isStitchDecision: false,            // corrector is opened for stitch decision

      // not saved
      initialized: false,                 // used to switch from startup screen to the editing view
      showInitFailure: false,             // show a message that the initialisation failed
      showItemLoadFailure: false,         // show a message that the loading if an item failed
      showAuthorization: false,           // show the dialog for authorization
      showSendFailure: false,             // show a message about a sending failure
      showDataReplaceConfirmation: false, // show a confirmation that the stored data should be replaced by another task or user
      showItemReplaceConfirmation: false, // show a confirmation that the stored item should be replaced by another item
      lastSendingTry: 0,                  // timestamp of the last try to send changes (milliseconds)
      lastLoadingTry: 0,                  // timestamp of the last try to load data (milliseconds)
      intervals: {}                       // list of all registered timer intervals, indexed by their name
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    isLoading: state => state.lastLoadingTry > 0,

    isForReviewOrStitch: state => state.isReview || state.isStitchDecision,

    storedItemKey: state => localStorage.getItem('correctorItemKey'),

    getRequestConfig: state => {

      /**
       * Get the config object for REST requests
       *
       * @param {string} token
       * @returns {{baseURL: (string|*), responseType: string, responseEncoding: string, params: URLSearchParams, timeout: number}}
       */
      const fn = function (token) {
        let baseURL = state.backendUrl;
        let params = new URLSearchParams();

        // cut query string and set it as params
        // a REST path is added as url to the baseURL by axias calls
        let position = baseURL.search(/\?+/);
        if (position != -1) {
          params = new URLSearchParams(baseURL.substr(position))
          baseURL = baseURL.substr(0, position);
        }

        // add authentication info as url parameters
        // use signature instead of token because it is visible
        params.append('LongEssayUser', state.userKey);
        params.append('LongEssayEnvironment', state.environmentKey);
        params.append('LongEssayIsReview', state.isReview ? '1' : '0');
        params.append('LongEssayIsStitchDecision', state.isStitchDecision ? '1' : '0');
        params.append('LongEssaySignature', md5(state.userKey + state.environmentKey + token));

        return {
          baseURL: baseURL,
          params: params,
          timeout: 30000,             // milliseconds
          responseType: 'json',       // default
          responseEncoding: 'utf8',   // default
        }
      }
      return fn;

    },

    getResourceUrl: state => {

      /**
       * Get the Url for loading a file ressource
       *
       * @param {string} resourceKey
       * @returns {string}
       */
      const fn = function (resourceKey) {
        const config = this.getRequestConfig(this.fileToken);
        return config.baseURL + '/file/' + resourceKey + '?' + config.params.toString();
      }
      return fn;
    },

    /**
     * Get the Url for loading a page image
     */
    getImageUrl: state => {

      /**
       * Get the Url for loading a page image
       * @param {string} pageKey
       * @param {string} itemKey
       * @returns {string}
       */
      const fn = function (pageKey, itemKey) {
        const config = this.getRequestConfig(this.fileToken);
        return config.baseURL + '/image/' + itemKey + '/' + pageKey + '?' + config.params.toString();
      }
      return fn;
    },

    getThumbUrl: state => {

      /**
       * Get the Url for loading a page thumbnail
       * @param {string} pageKey
       * @param {string} itemKey
       * @returns {string}
       */
      const fn = function (pageKey, itemKey) {
        const config = this.getRequestConfig(this.fileToken);
        return config.baseURL + '/thumb/' + itemKey + '/' + pageKey + '?' + config.params.toString();
      }
      return fn;
    },


    getServerTime: state => {

      /**
       * Get the server unix timestamp (s) corresponding to a client timestamp (ms)
       * @param {number} clientTime
       * @returns {number}
       */
      const fn = function (clientTime) {
        return Math.floor((clientTime - state.timeOffset) / 1000);
      }
      return fn;
    },


    getChangeDataToSend: state => {

      /**
       * Get the data of a change to be sent to the backend
       * @param {Change} change
       * @param {object|null} payload
       */
      const fn = function (change, payload = null) {
        const data = change.getData();
        if (payload) {
          data.payload = payload;
        }
        data.server_time = state.getServerTime(change.last_change);
        return data;
      }
      return fn;
    }

  },


  actions: {

    /**
     * Init the state
     * Take the state from the cookies or local store
     * Trigger a reload of all data if cookie values differ from local store
     */
    async init() {

      let newContext = false;
      let newItem = false;

      // take values formerly stored
      this.backendUrl = localStorage.getItem('correctorBackendUrl');
      this.returnUrl = localStorage.getItem('correctorReturnUrl');
      this.userKey = localStorage.getItem('correctorUserKey');
      this.environmentKey = localStorage.getItem('correctorEnvironmentKey');
      this.correctorKey = localStorage.getItem('correctorCorrectorKey');
      this.itemKey = localStorage.getItem('correctorItemKey');
      this.dataToken = localStorage.getItem('correctorDataToken');
      this.fileToken = localStorage.getItem('correctorFileToken');
      this.timeOffset = Math.floor(localStorage.getItem('correctorTimeOffset') ?? 0);
      this.isReview = !!localStorage.getItem('correctorIsReview'); // boolean is stored as '1' or ''
      this.isStitchDecision = !!localStorage.getItem('correctorIsStitchDecision');

      // check if context given by cookies differs and force a reload if neccessary
      if (Cookies.get('LongEssayUser') != undefined && Cookies.get('LongEssayUser') !== this.userKey) {
        this.userKey = Cookies.get('LongEssayUser');
        newContext = true;
      }
      if (Cookies.get('LongEssayEnvironment') != undefined && Cookies.get('LongEssayEnvironment') !== this.environmentKey) {
        this.environmentKey = Cookies.get('LongEssayEnvironment');
        newContext = true;
      }
      if (Cookies.get('LongEssayCorrector') != undefined && Cookies.get('LongEssayCorrector') !== this.correctorKey) {
        this.correctorKey = Cookies.get('LongEssayCorrector');
        newContext = true;
      }
      if (Cookies.get('LongEssayIsReview') != undefined && (Cookies.get('LongEssayIsReview') == '1') !== this.isReview) {
        this.isReview = (Cookies.get('LongEssayIsReview') == '1');
        newContext = true;
      }
      if (Cookies.get('LongEssayIsReview') != undefined && (Cookies.get('LongEssayIsStitchDecision') == '1') !== this.isStitchDecision) {
        this.isStitchDecision = (Cookies.get('LongEssayIsStitchDecision') == '1');
        newContext = true;
      }
      if (this.isForReviewOrStitch) {
        this.correctorKey = '';
      }

      // these values can be changed without forcing a reload
      if (Cookies.get('LongEssayItem') != undefined && Cookies.get('LongEssayItem') !== this.itemKey) {
        this.itemKey = Cookies.get('LongEssayItem');
        newItem = true;
      }
      if (Cookies.get('LongEssayBackend') != undefined && Cookies.get('LongEssayBackend') !== this.backendUrl) {
        this.backendUrl = Cookies.get('LongEssayBackend');
      }
      if (Cookies.get('LongEssayReturn') != undefined && Cookies.get('LongEssayReturn') !== this.returnUrl) {
        this.returnUrl = Cookies.get('LongEssayReturn');
      }
      if (Cookies.get('LongEssayToken') != undefined && Cookies.get('LongEssayToken') !== this.dataToken) {
        this.dataToken = Cookies.get('LongEssayToken');
      }

      if (!this.backendUrl || !this.returnUrl || !this.userKey || !this.environmentKey || !this.dataToken) {
        this.showInitFailure = true;
        return;
      }

      const changesStore = useChangesStore();
      if (await changesStore.hasChangesInStorage()) {
        if (newContext) {
          console.log('init: open saving, new context');
          await this.loadDataFromStorage();
          this.showDataReplaceConfirmation = true;
        } else if (newItem) {
          console.log('init: open saving, same context, new item');
          await this.loadDataFromStorage();
          this.showItemReplaceConfirmation = true;
        } else {
          console.log('init: open saving, same context, same item');
          await this.loadDataFromStorage();
          this.initAfterKeepDataConfirmed();
        }
      } else {
        console.log('init: no open saving');
        this.initAfterReplaceDataConfirmed();
      }
    },

    /**
     * init after the replacement of all data is confirmed
     */
    async initAfterReplaceDataConfirmed() {
      console.log('initAfterReplaceDataConfirmed');
      this.showDataReplaceConfirmation = false;
      this.showItemReplaceConfirmation = false;

      if (await this.loadDataFromBackend()) {
        await this.loadItemFromBackend(this.itemKey);
        this.finishInitialisation();
      }
      this.updateConfig();
    },

    /**
     * init after the keeping the data of the item with open sendings
     */
    async initAfterKeepDataConfirmed() {
      console.log('initAfterKeepDataConfirmed');
      const itemsStore = useItemsStore();
      this.showDataReplaceConfirmation = false;
      this.showItemReplaceConfirmation = false;

      this.itemKey = localStorage.getItem('correctorItemKey');
      await await this.loadItemFromStorage(this.itemKey);
      const item = itemsStore.getItem(this.itemKey);

      if (await this.loadDataFromBackend()) {
        await itemsStore.addItem(item);
        await this.loadItemFromStorage(this.itemKey);
        this.finishInitialisation();
      }
      this.updateConfig();
    },


    /**
     * Finish the initialisation
     * set config dependent layout states
     * start the sending timer
     */
    finishInitialisation() {
      const commentsStore = useCommentsStore();
      const layoutStore = useLayoutStore();
      const correctorsStore = useCorrectorsStore();

      if (this.isForReviewOrStitch) {
        commentsStore.setShowOtherCorrectors(true);
      }

      if (this.isStitchDecision) {
        let i = 0;
        for (const corrector of correctorsStore.correctors) {
          layoutStore.selectCorrector(corrector.corrector_key);
          i++;
          if (i == 2) {
            break;
          }
        }
      }

      this.initialized = true;
    },

    /**
     * Update the app configuration
     * This is called when the initialisation can be done silently
     * Or when a confirmation dialog is confirmed
     */
    updateConfig() {
      // remove the cookies
      // needed to distinct the call from the backend from a later reload
      Cookies.remove('LongEssayBackend');
      Cookies.remove('LongEssayReturn');
      Cookies.remove('LongEssayUser');
      Cookies.remove('LongEssayEnvironment');
      Cookies.remove('LongEssayCorrector');
      Cookies.remove('LongEssayItem');
      Cookies.remove('LongEssayToken');
      Cookies.remove('LongEssayIsReview');
      Cookies.remove('LongEssayIsStitchDecision');

      localStorage.setItem('correctorBackendUrl', this.backendUrl);
      localStorage.setItem('correctorReturnUrl', this.returnUrl);
      localStorage.setItem('correctorUserKey', this.userKey);
      localStorage.setItem('correctorEnvironmentKey', this.environmentKey);
      localStorage.setItem('correctorCorrectorKey', this.correctorKey);
      localStorage.setItem('correctorItemKey', this.itemKey);
      localStorage.setItem('correctorDataToken', this.dataToken);
      localStorage.setItem('correctorFileToken', this.fileToken);
      localStorage.setItem('correctorIsReview', this.isReview ? '1' : '');    // storage of boolean
      localStorage.setItem('correctorIsStitchDecision', this.isStitchDecision ? '1' : '');
    },


    /**
     * Load all data from the storage
     */
    async loadDataFromStorage() {
      console.log("loadDataFromStorage...");
      this.setLoading(true);
      this.clearAllIntervals();

      const criteriaStore = useCriteriaStore();
      const itemsStore = useItemsStore();
      const layoutStore = useLayoutStore();
      const levelsStore = useLevelsStore();
      const preferencesStore = usePreferencesStore();
      const resourcesStore = useResourcesStore();
      const settingsStore = useSettingsStore();
      const taskStore = useTaskStore();
      const snippetsStore = useSnippetsStore();

      await criteriaStore.loadFromStorage();
      await itemsStore.loadFromStorage();
      await layoutStore.loadFromStorage();
      await levelsStore.loadFromStorage();
      await preferencesStore.loadFromStorage();
      await resourcesStore.loadFromStorage();
      await settingsStore.loadFromStorage();
      await taskStore.loadFromStorage();
      await snippetsStore.loadFromStorage();

      this.setLoading(false);
      return true;
    },

    /**
     * Load the data of a new correction item from storage
     * This requires the itemKey to be set
     */
    async loadItemFromStorage(itemKey) {
      console.log("loadItemFromStorage...");
      this.setLoading(true);
      this.clearAllIntervals();

      const itemsStore = useItemsStore();
      if (itemKey == '' || itemsStore.getItem(itemKey) == undefined) {
        itemKey = itemsStore.firstKey
      }

      this.itemKey = itemKey;
      localStorage.setItem('itemKey', this.itemKey);

      const changesStore = useChangesStore();
      const commentsStore = useCommentsStore();
      const correctorsStore = useCorrectorsStore();
      const essayStore = useEssayStore();
      const pagesStore = usePagesStore();
      const pointsStore = usePointsStore();
      const summariesStore = useSummariesStore();

      await changesStore.loadFromStorage();
      await commentsStore.loadFromStorage();
      await correctorsStore.loadFromStorage();
      await essayStore.loadFromStorage();
      await pagesStore.loadFromStorage();
      await pointsStore.loadFromStorage();
      await summariesStore.loadFromStorage();

      commentsStore.setMarkerChange();
      this.setLoading(false);
      if (itemsStore.correctionAllowed) {
        this.setInterval('apiStore.saveChangesToBackend', this.saveChangesToBackend, sendInterval);
      }
      return true;
    },


    /**
     * Load common data from the backend
     */
    async loadDataFromBackend() {
      console.log("loadDataFromBackend...");
      this.setLoading(true);
      this.clearAllIntervals();

      let response = {};
      try {
        response = await axios.get('/data', this.getRequestConfig(this.dataToken));
        this.setTimeOffset(response);
        this.refreshToken(response);
      }
      catch (error) {
        console.error(error);
        this.showInitFailure = true;
        this.setLoading(false);
        return false;
      }

      const criteriaStore = useCriteriaStore();
      const itemsStore = useItemsStore();
      const layoutStore = useLayoutStore();
      const levelsStore = useLevelsStore();
      const preferencesStore = usePreferencesStore();
      const resourcesStore = useResourcesStore();
      const settingsStore = useSettingsStore();
      const taskStore = useTaskStore();
      const snippetsStore = useSnippetsStore();

      await criteriaStore.loadFromData(response.data.criteria);
      await itemsStore.loadFromData(response.data.items);
      await layoutStore.clearStorage();
      await levelsStore.loadFromData(response.data.levels);
      await preferencesStore.loadFromData(response.data.preferences);
      await resourcesStore.loadFromData(response.data.resources);
      await settingsStore.loadFromData(response.data.settings);
      await taskStore.loadFromData(response.data.task);
      await snippetsStore.loadFromData(response.data.snippets);

      this.setLoading(false);
      return true;
    },


    /**
     * Load the data of a new correction item from the backend
     */
    async loadItemFromBackend(itemKey) {
      console.log("loadItemFromBackend...");
      this.setLoading(true);
      this.clearAllIntervals();

      const itemsStore = useItemsStore();
      if (itemKey == '' || itemsStore.getItem(itemKey) == undefined) {
        itemKey = itemsStore.firstKey
      }

      let response = {};
      try {
        response = await axios.get('/item/' + itemKey, this.getRequestConfig(this.dataToken));
        this.setTimeOffset(response);
        this.refreshToken(response);
      }
      catch (error) {
        console.error(error);
        this.showItemLoadFailure = true;
        this.setLoading(false);
        return false;
      }

      // set the itemKey here before loading and check it in the loadFromData() functions
      // otherwise a fast navigation between writers may cause wrong assignments (race condition)
      this.itemKey = itemKey;
      localStorage.setItem('itemKey', this.itemKey);
      itemsStore.updateItem(new Item(response.data.item));

      const changesStore = useChangesStore();
      const correctorsStore = useCorrectorsStore();
      const commentsStore = useCommentsStore();
      const essayStore = useEssayStore();
      const pagesStore = usePagesStore();
      const pointsStore = usePointsStore();
      const summariesStore = useSummariesStore();

      // dismiss open changes from other items
      // this avoids a race condition on quick navigation between writers
      await changesStore.clearStorage();
      await correctorsStore.loadFromData(response.data.correctors);
      await commentsStore.loadFromData(response.data.comments);
      await essayStore.loadFromData(response.data.essay);
      await pagesStore.loadFromData(response.data.pages);
      await pointsStore.loadFromData(response.data.points);
      await summariesStore.loadFromData(response.data.summaries);

      commentsStore.setMarkerChange();
      this.setLoading(false);
      if (itemsStore.correctionAllowed) {
        this.setInterval('apiStore.saveChangesToBackend', this.saveChangesToBackend, sendInterval);
      }
      return true;
    },


    /**
     * Periodically send changes to the backend
     * Timer is set in initialisation
     *
     * @param bool wait    wait some seconds for a running sending to finish (if not called by timer)
     * @return bool
     */
    async saveChangesToBackend(wait = false) {
      const changesStore = useChangesStore();
      const commentsStore = useCommentsStore();
      const pointsStore = usePointsStore();
      const summariesStore = useSummariesStore();
      const snippetsStore = useSnippetsStore();
      const preferencesStore = usePreferencesStore();

      // don't interfer with a running request
      if (!(await this.isSending(true))) {
        this.setSending(true);
        try {
          const data = {
            comments: await commentsStore.getChangedData(this.lastSendingTry),
            points: await pointsStore.getChangedData(this.lastSendingTry),
            summaries: await summariesStore.getChangedData(this.lastSendingTry),
            snippets: await snippetsStore.getChangedData(this.lastSendingTry),
            preferences: await preferencesStore.getChangedData(this.lastSendingTry),
          };

          const response = await axios.put('/changes/' + this.itemKey,
            data,
            this.getRequestConfig(this.dataToken));
          this.setTimeOffset(response);
          this.refreshToken(response);

          const newSelectedKey = await commentsStore.updateKeys(response.data.comments);
          await pointsStore.changeCommentKeys(response.data.comments);
          await pointsStore.updateKeys(response.data.points);

          // trigger selection change for the comment
          if (newSelectedKey !== null) {
            await commentsStore.selectComment(newSelectedKey, true);
          }

          await changesStore.setChangesSent(Change.TYPE_COMMENT,
            response.data.comments,
            this.lastSendingTry);
          await changesStore.setChangesSent(Change.TYPE_POINTS,
            response.data.points,
            this.lastSendingTry);
          await changesStore.setChangesSent(Change.TYPE_SUMMARY,
            response.data.summaries,
            this.lastSendingTry);
          await changesStore.setChangesSent(Change.TYPE_SNIPPETS,
              response.data.snippets,
              this.lastSendingTry);
          await changesStore.setChangesSent(Change.TYPE_PREFERENCES,
            response.data.preferences,
            this.lastSendingTry);
        }
        catch (error) {
          console.error(error);
          this.setSending(false);
          return false;
        }
        this.setSending(false);
      }

      return true;
    },


    /**
     * Save the stitch descision to the backend
     */
    async saveStitchDecisionToBackend(data) {
      let response = {};
      try {
        response = await axios.put('/stitch/' + this.itemKey,
          data,
          this.getRequestConfig(this.dataToken));
        this.setTimeOffset(response);
        this.refreshToken(response);
        return true;
      }
      catch (error) {
        console.error(error);
        return false;
      }
    },


    /**
     * Set the offset between server time and client time
     * The offset is used to calculate the correct remaining time of the task
     * The offset should be set from the response of a REST call
     * when the response data transfer is short (no files)
     */
    setTimeOffset(response) {
      if (response.headers['longessaytime']) {
        const serverTimeMs = response.headers['longessaytime'] * 1000;
        const clientTimeMs = Date.now();

        this.timeOffset = clientTimeMs - serverTimeMs;
        localStorage.setItem('writerTimeOffset', this.timeOffset);
      }
    },

    /**
     * Refresh the auth token with the value from the REST response
     * Each REST call will generate a new auth token
     * A token has only a certain valid time (e.g. one our)
     * Within this time a new REST call must be made to get a new valid token
     */
    refreshToken(response) {
      if (response.headers['longessaydatatoken']) {
        this.dataToken = response.headers['longessaydatatoken'];
        localStorage.setItem('correctorDataToken', this.dataToken);
      }

      if (response.headers['longessayfiletoken']) {
        this.fileToken = response.headers['longessayfiletoken'];
        localStorage.setItem('correctorFileToken', this.fileToken);
      }
    },

    /**
     * Check if a sending of changes is still running
     *
     * @param {boolean} wait - wait up to 5 seconds for a sending to complete
     * @return boolean  sending is still going on
     */
    async isSending(wait = false) {
      if (wait) {
        let tries = 0;
        while (tries < 5 && this.lastSendingTry > 0) {
          tries++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      return this.lastSendingTry > 0;
    },

    /**
     * Set the sending status
     * @param {boolean} sending status
     */
    setSending(sending) {
      if (sending) {
        this.lastSendingTry = Date.now();
      } else {
        this.lastSendingTry = 0;
      }
    },


    /**
     * Set the sending status
     * @param {boolean} sending status
     */
    setLoading(loading) {
      if (loading) {
        this.lastLoadingTry = Date.now();
      } else {
        this.lastLoadingTry = 0;
      }
    },


    /**
     * Set the activation for showing the authorization dialogue
     */
    setShowAuthorization(active) {
      this.showAuthorization = active
    },

    /**
     * Set the activation for showing a sending failure
     */
    setShowSendFailure(active) {
      this.showSendFailure = active
    },

    /**
     * Set a timer interval
     * @param {string} name unique name of the interval to set
     * @param {function} handler function that is called
     * @param {integer} interval milliseconds between each call
     */
    setInterval(name, handler, interval) {
      if (name in this.intervals) {
        console.log('clear interval ' + name)
        clearInterval(this.intervals[name]);
      }
      console.log('set interval ' + name)
      this.intervals[name] = setInterval(handler, interval);
    },

    /**
     * Clear all timer intervals
     */
    clearAllIntervals() {
      console.log('clear all intervals ');
      for (const name in this.intervals) {
        console.log('clear interval ' + name);
        clearInterval(this.intervals[name]);
        delete this.intervals[name];
      }
    }
  }
})

/**
 * API Store
 * Handles the communication with the backend
 */
import {clearAllStores, stores} from "@/store";
import {defineStore} from 'pinia';
import axios from 'axios'
import Cookies from 'js-cookie';
import i18n from "@/plugins/i18n";
import md5 from 'md5';
import Change from '@/data/Change';
import Item from '@/data/Item';
import Snippet from '@/data/Snippet';

const { t } = i18n.global;
const sendInterval = 1000;      // time (ms) to wait for sending open savings to the backend

export const useApiStore = defineStore('api', {

  state: () => {
    return {
      // saved in storage
      userId: '',                         // identifying id of the current user
      assId: '',                          // identifying id of the assessment
      contextId: '',                      // identifying id of the context for permission checks
      asAdmin: '',                        // app is opened for administrator (permission will be checked in the backend)
      itemKey: '',                        // identifying key of the correction item
      loginToken: '',                     // authentication token for login
      dataToken: '',                      // authentication token for transmission if data
      fileToken: '',                      // authentication token for loading files
      timeOffset: 0,                      // difference between server time and client time (ms)

      // not saved
      intervals: {},                       // list of all registered timer intervals, indexed by their name
      lastSendingTry: 0,                  // timestamp of the last try to send changes (milliseconds)
      lastLoadingTry: 0,                  // timestamp of the last try to load data (milliseconds)
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    isLoading: state => state.lastLoadingTry > 0,
    isSending: state => state.lastSendingTry > 0,

    storedItemKey: state => localStorage.getItem('xlasCorrectorItemKey'),

    getStartRequestConfig(state) {

      let baseURL = stores.config().backendUrl;
      let params = new URLSearchParams();

      // cut query string and set it as params
      // a REST path is added as url to the baseURL by axios calls
      let position = baseURL.search(/\?+/);
      if (position != -1) {
        params = new URLSearchParams(baseURL.substr(position))
        baseURL = baseURL.substr(0, position);
      }

      return {
        baseURL: baseURL,
        params: params,
        timeout: 30000,             // milliseconds
        responseType: 'json',       // default
        responseEncoding: 'utf8',   // default
        headers: {
          'Authorization': 'Bearer ' + state.loginToken
        }
      }
    },

    getRequestConfig(state) {

      /**
       * Get the config object for REST requests
       *
       * @param {string} token
       * @returns {{baseURL: (string|*), responseType: string, responseEncoding: string, params: URLSearchParams, timeout: number}}
       */
      const fn = function (token) {
        let baseURL = stores.config().backendUrl;
        let params = new URLSearchParams();

        // cut query string and set it as params
        // a REST path is added as url to the baseURL by axios calls
        let position = baseURL.search(/\?+/);
        if (position != -1) {
          params = new URLSearchParams(baseURL.substr(position))
          baseURL = baseURL.substr(0, position);
        }

        // add authentication info as url parameters
        // use signature instead of token because it is visible
        params.append('user_id', state.userId);
        params.append('ass_id', state.assId);
        params.append('context_id', state.contextId);
        params.append('as_admin', state.asAdmin);
        params.append('signature', md5(state.userId + state.assId + state.contextId + token));

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

    getResourceUrl(state) {

      /**
       * Get the Url for loading a file ressource
       *
       * @param {Resource} resource
       * @returns {string}
       */
      const fn = function (resource) {
        const config = this.getRequestConfig(this.fileToken);
        return config.baseURL + '/corrector/file/task/resource/' + resource.id + '/inline?' + config.params.toString();
      }
      return fn;
    },

    /**
     * Get the Url for loading an essay as pdf file
     */
    getEssayUrl(state) {

      /**
       * Get the Url for loading an essay as pdf file
       * @param {int} essay_id
       * @returns {string}
       */
      const fn = function (essay_id) {
        const config = this.getRequestConfig(this.fileToken);
        return config.baseURL + '/corrector/file/essaytask/essay/' + essay_id + '/inline?' + config.params.toString();
      }
      return fn;
    },

    /**
     * Get the Url for loading a page image
     */
    getImageUrl(state) {

      /**
       * Get the Url for loading a page image
       * @param {Page} page
       * @returns {string}
       */
      const fn = function (page) {
        const config = this.getRequestConfig(this.fileToken);
        return config.baseURL + '/corrector/file/essaytask/image/' + page.id + '/inline?' + config.params.toString();
      }
      return fn;
    },

    getThumbUrl(state) {

      /**
       * Get the Url for loading a page thumbnail
       * @param {Page} page
       * @returns {string}
       */
      const fn = function (page) {
        const config = this.getRequestConfig(this.fileToken);
        return config.baseURL + '/corrector/file/essaytask/thumb/' + page.id + '/inline?' + config.params.toString();
      }
      return fn;
    },

    getSummaryPdfUrl(state) {

      /**
       * Get the Url for loading a summary pdf
       * @param {Summary} summary
       * @returns {string}
       */
      const fn = function (summary) {
        const config = this.getRequestConfig(this.fileToken);
        return config.baseURL + '/corrector/file/task/summary/' + summary.id + '/inline?' + config.params.toString();
      }
      return fn;
    },

    getSnippetsUrl(state) {

      /**
       * Get the Url for loading a page thumbnail
       * @param {string} purpose
       * @returns {string}
       */
      const fn = function (purpose) {
        const config = this.getRequestConfig(this.fileToken);
        return config.baseURL + '/corrector/file/task/snippets_' + purpose + '/0/attachment?' + config.params.toString();
      }
      return fn;
    },

    getServerTime(state) {

      /**
       * Get the server unix timestamp (s) corresponding to a client timestamp (ms)
       * @param {number} clientTime
       * @returns {number}
       */
      const fn = function (clientTime) {
        return clientTime == 0 ? 0 : Math.floor((clientTime - state.timeOffset) / 1000);
      }
      return fn;
    },

    getDownloadTitle(state) {

      /**
       * Get a full title for downloading files
       * @param {string} title
       * @param {boolean} with_details
       * @returns {string}
       */
      const fn = function (title, with_details = true) {
        let elements = [];
        elements.push(stores.settings().Assessment.title ?? '');

        if (with_details) {
          if (stores.tasks().countTasks > 1) {
            elements.push(stores.tasks().currentTitle ?? '');
          }
          elements.push(stores.items().currentItem.pseudonym ?? '');
        }

        elements.push(title);

        return elements.filter(el => el !== '').join(' - ');
      }
      return fn;
    },
  },

  actions: {

    /**
     * Clear the store
     */
    async clearStorage() {
      // Don't clear the api store because these values need to be kept for a page reload
    },

    /**
     * Init the state
     * Take the state from the cookies or local store
     * Trigger a reload of all data if cookie values differ from local store
     */
    async init() {

      let newContext = false;
      let newItem = false;

      const configStore = stores.config();
      await configStore.loadFromConfig();
      await configStore.loadFromStorage();

      // take values formerly stored
      this.userId = localStorage.getItem('xlasCorrectorUserId') ?? '';
      this.assId = localStorage.getItem('xlasCorrectorAssId') ?? '';
      this.contextId = localStorage.getItem('xlasCorrectorContextId') ?? '';
      this.asAdmin = localStorage.getItem('xlasCorrectorAsAdmin') ?? '';
      this.itemKey = localStorage.getItem('xlasCorrectorItemKey') ?? '';
      this.loginToken = localStorage.getItem('xlasCorrectorLoginToken') ?? '';
      this.dataToken = localStorage.getItem('xlasCorrectorDataToken') ?? '';
      this.fileToken = localStorage.getItem('xlasCorrectorFileToken') ?? '';
      this.timeOffset = Math.floor(localStorage.getItem('xlasCorrectorTimeOffset') ?? 0);

      // check if context given by cookies differs and force a reload if neccessary
      if (Cookies.get('xlasUserId') != undefined && Cookies.get('xlasUserId') != this.userId) {
        this.userId = Cookies.get('xlasUserId');
        newContext = true;
      }
      if (!!Cookies.get('xlasAssId') && Cookies.get('xlasAssId') != this.assId) {
        this.assId = Cookies.get('xlasAssId');
        newContext = true;
      }
      if (Cookies.get('xlasContextId') != undefined && Cookies.get('xlasContextId') != this.contextId) {
        this.contextId = Cookies.get('xlasContextId');
        newContext = true;
      }
      if (Cookies.get('xlasAsAdmin') != undefined  && Cookies.get('xlasAsAdmin') != this.asAdmin) {
        this.asAdmin = Cookies.get('xlasAsAdmin')
        newContext = true;
      }

      // these values just need a reload of the item
      let task_id = Item.extractTaskId(this.itemKey);
      let writer_id = Item.extractWriterId(this.itemKey);
      if (Cookies.get('xlasTaskId') != undefined && Cookies.get('xlasWriterId') != undefined
          && (Cookies.get('xlasTaskId') != task_id || Cookies.get('xlasWriterId') != writer_id)) {
        newItem = true;
        task_id = Cookies.get('xlasTaskId');
        writer_id = Cookies.get('xlasWriterId');
        this.itemKey = Item.buildKey(task_id, writer_id);
      }
      if (!this.itemKey) {
        newItem = true;
      }

      // these values can be changed without forcing a whole reload
      if (Cookies.get('xlasBackendUrl') != undefined && Cookies.get('xlasBackendUrl') != configStore.backendUrl) {
        configStore.backendUrl = Cookies.get('xlasBackendUrl');
      }
      if (Cookies.get('xlasReturnUrl') != undefined && Cookies.get('xlasReturnUrl') != configStore.returnUrl) {
        configStore.returnUrl = Cookies.get('xlasReturnUrl');
      }
      if (Cookies.get('xlasDataToken') != undefined && Cookies.get('xlasDataToken') != this.dataToken) {
        this.dataToken = Cookies.get('xlasDataToken');
      }
      if (Cookies.get('xlasFileToken') != undefined && Cookies.get('xlasFileToken') != this.dataToken) {
        this.fileToken = Cookies.get('xlasFileToken');
      }

      // remove the cookies
      // needed to distinct the call from the backend from a later reload
      Cookies.remove('xlasBackendUrl');
      Cookies.remove('xlasReturnUrl');
      Cookies.remove('xlasUserId');
      Cookies.remove('xlasAssId');
      Cookies.remove('xlasContextId');
      Cookies.remove('xlasAsAdmin');
      Cookies.remove('xlasTaskId');
      Cookies.remove('xlasWriterId');
      Cookies.remove('xlasDataToken');
      Cookies.remove('xlasFileToken');

      // save the state
      configStore.saveToStorage();
      localStorage.setItem('xlasCorrectorUserId', this.userId);
      localStorage.setItem('xlasCorrectorAssId', this.assId);
      localStorage.setItem('xlasCorrectorContextId', this.contextId);
      localStorage.setItem('xlasCorrectorAsAdmin', this.asAdmin);
      localStorage.setItem('xlasCorrectorItemKey', this.itemKey);
      localStorage.setItem('xlasCorrectorDataToken', this.dataToken);
      localStorage.setItem('xlasCorrectorFileToken', this.fileToken);

      if (!configStore.backendUrl) {
        stores.layout().initFailure = t('apiMissingBackendUrl');
        return;
      }

      if (!this.userId || !this.assId || !this.contextId
        || !this.dataToken || !this.fileToken) {
        this.initStart();
        return;
      }

      const changesStore = stores.changes();
      await changesStore.loadFromStorage();

      if (changesStore.countChanges > 0) {
        if (newContext) {
          console.log('init: open saving, new context');
          await this.loadDataFromStorage();
          stores.layout().showDataReplaceConfirmation = true;
        } else if (newItem) {
          console.log('init: open saving, same context, new item');
          await this.loadDataFromStorage();
          stores.layout().showItemReplaceConfirmation = true;
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
     * Init when the app is started directly without cookies from an assesment
     */
    async initStart() {
      await stores.user().loadFromStorage();

      if (!!this.userId && stores.user().hasToAccept) {
        stores.layout().showAgreement = true;
        return;
      }
    },

    /**
     * init after the replacement of all data is confirmed
     */
    async initAfterReplaceDataConfirmed() {
      console.log('initAfterReplaceDataConfirmed');
      await clearAllStores();
      stores.layout().showDataReplaceConfirmation = false;
      stores.layout().showItemReplaceConfirmation = false;

      if (await this.loadDataFromBackend()) {
        await this.loadItemFromBackend(this.itemKey);
        this.finishInitialisation();
      }
    },

    /**
     * init after the keeping the data of the item with open sendings
     */
    async initAfterKeepDataConfirmed() {
      console.log('initAfterKeepDataConfirmed');
      stores.layout().showDataReplaceConfirmation = false;
      stores.layout().showItemReplaceConfirmation = false;

      this.itemKey = localStorage.getItem('xlasCorrectorItemKey');
      await this.loadItemFromStorage(this.itemKey);
      const item = stores.items().getItem(this.itemKey);

      if (await this.loadDataFromBackend()) {
        await stores.items().saveItem(item);
        await this.loadItemFromStorage(this.itemKey);
        this.finishInitialisation();
      }
    },

    /**
     * Finish the initialization
     * set config-dependent layout states
     */
    finishInitialisation() {

      if (stores.summaries().isOneAuthorized) {
        stores.comments().setShowOtherCorrections(true);
      }
      stores.layout().initialized = true;
    },

    /**
     * Load all data from the storage
     */
    async loadDataFromStorage() {
      console.log("loadDataFromStorage...");
      this.setLoading(true);
      this.clearAllIntervals();

      await stores.config().loadFromStorage();
      await stores.criteria().loadFromStorage();
      await stores.items().loadFromStorage();
      await stores.layout().loadFromStorage();
      await stores.levels().loadFromStorage();
      await stores.preferences().loadFromStorage();
      await stores.resources().loadFromStorage();
      await stores.settings().loadFromStorage();
      await stores.snippets().loadFromStorage();
      await stores.tasks().loadFromStorage();
      await stores.templates().loadFromStorage();

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

      const itemsStore = stores.items();
      if (itemKey == '' || stores.items().hasItems && itemsStore.getItem(itemKey) == undefined) {
        itemKey = itemsStore.firstKey
      }

      this.itemKey = itemKey;
      localStorage.setItem('xlasCorrectorItemKey', this.itemKey);

      await stores.changes().loadFromStorage();
      await stores.comments().loadFromStorage();
      await stores.corrections().loadFromStorage();
      await stores.essay().loadFromStorage();
      await stores.pages().loadFromStorage();
      await stores.points().loadFromStorage();
      await stores.summaries().loadFromStorage();

      stores.comments().setMarkerChange();
      stores.items().updateCurrentKeys();
      stores.tasks().updateCurrentKeys();
      stores.layout().initForItem();
      this.setLoading(false);

      this.setInterval('apiStore.saveChangesToBackend', this.saveChangesToBackend, sendInterval);
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
        response = await axios.get('/corrector/data', this.getRequestConfig(this.dataToken));
        this.setTimeOffset(response);
        this.refreshToken(response);
      }
      catch (error) {
        console.error(error);
        stores.layout().initFailure = t('apiLoadingDataFailed');
        this.setLoading(false);
        return false;
      }
      
      await stores.layout().clearStorage();

      await stores.config().loadFromBackend(response.data['Assessment']['Config']);
      await stores.levels().loadFromBackend(response.data['Assessment']['GradeLevels']);
      await stores.settings().loadFromBackend('Assessment', response.data['Assessment']['Settings']);

      await stores.items().loadFromBackend(response.data['Task']['Items']);
      await stores.preferences().loadFromBackend(response.data['Task']['Preferences']);
      await stores.resources().loadFromBackend(response.data['Task']['Resources']);
      await stores.settings().loadFromBackend('Task', response.data['Task']['Settings']);
      await stores.snippets().loadFromBackend(response.data['Task']['Snippets']);
      await stores.tasks().loadFromBackend(response.data['Task']['Tasks']);
      await stores.templates().loadFromBackend(response.data['Task']['Templates']);

      await stores.settings().loadFromBackend('EssayTask', response.data['EssayTask']['Settings']);

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

      const itemsStore = stores.items();
      if (itemKey == '' && stores.items().hasItems && !stores.items().getItem(itemKey)) {
        itemKey = itemsStore.firstKey ?? '';
      }

      let response = {};
      const task_id = Item.extractTaskId(itemKey);
      const writer_id = Item.extractWriterId(itemKey);
      try {
        response = await axios.get('/corrector/item/' + task_id + '/' + writer_id, this.getRequestConfig(this.dataToken));
        this.setTimeOffset(response);
        this.refreshToken(response);
      }
      catch (error) {
        console.error(error);
        stores.layout().showItemLoadFailure = true;
        this.setLoading(false);
        return false;
      }

      // set the itemKey here before loading and check it in the loadFromBackend() functions
      // otherwise a fast navigation between writers may cause wrong assignments (race condition)
      this.itemKey = itemKey;
      localStorage.setItem('xlasCorrectorItemKey', this.itemKey);
      await itemsStore.saveItem(new Item(response.data['Task']['Item']));

      // dismiss open changes from other items
      // this avoids a race condition on quick navigation between writers
      await stores.changes().clearStorage();

      await stores.essay().loadFromBackend(response.data['EssayTask']['Essay']);
      await stores.pages().loadFromBackend(response.data['EssayTask']['Pages']);

      await stores.corrections().loadFromBackend(response.data['Task']['Corrections']);
      await stores.criteria().loadFromBackend(response.data['Task']['Criteria']);
      await stores.comments().loadFromBackend(response.data['Task']['Comments']);
      await stores.points().loadFromBackend(response.data['Task']['Points']);
      await stores.summaries().loadFromBackend(response.data['Task']['Summaries']);

      stores.comments().setMarkerChange();
      stores.items().updateCurrentKeys();
      stores.tasks().updateCurrentKeys();
      stores.layout().initForItem();
      this.setLoading(false);
      this.setInterval('apiStore.saveChangesToBackend', this.saveChangesToBackend, sendInterval);
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
      const changesStore = stores.changes();

      if (changesStore.countChanges > 0) {
        // don't interfer with a running request
        if (!(await this.checkSending(true))) {

          this.setSending(true);
          try {
            const data = {'Task': {}};
            data['Task'][Change.TYPE_SNIPPETS] = await stores.snippets().getChangedData(this.lastSendingTry);
            data['Task'][Change.TYPE_PREFERENCES] = await stores.preferences().getChangedData(this.lastSendingTry);
            data['Task'][Change.TYPE_COMMENT] = await stores.comments().getChangedData(this.lastSendingTry);
            data['Task'][Change.TYPE_POINTS] = await stores.points().getChangedData(this.lastSendingTry);
            data['Task'][Change.TYPE_SUMMARY] = await stores.summaries().getChangedData(this.lastSendingTry);

            const response = await axios.put('/corrector/changes', data, this.getRequestConfig(this.dataToken));
            this.setTimeOffset(response);
            this.refreshToken(response);

            for (const component in response.data ?? []) {
              const changes = response.data[component];
              for (const type in changes ?? []) {
                await changesStore.setChangesSent(type, changes[type],  this.lastSendingTry)
              }
            }
          }
          catch (error) {
            console.error(error);
            this.setSending(false);
            return false;
          }
          this.setSending(false);
        }
      }
      return changesStore.countChanges == 0;
    },

    /**
     * Post a login request
     */
    async sendLogin(login, password) {

      try {
        const formData = new FormData();
        formData.append('login', login);
        formData.append('password', password);

        stores.layout().loginMessage = '';
        this.setSending(true);
        const response = await axios.post(
          '/corrector/start/login',
          formData,
          this.getStartRequestConfig
        );

        this.setSending(false);
        stores.layout().showLogin = false;

        this.loginToken = response.data.token;
        this.userId = response.data.user_id;
        localStorage.setItem('xlasCorrectorUserId', this.userId);
        localStorage.setItem('xlasCorrectorLoginToken', this.loginToken);
        await stores.user().loadFromBackend(response.data);
        this.initStart();

      } catch (error) {
        this.setSending(false);
        if (error.response?.status === 401) {
          stores.layout().loginMessage = error.response.data?.failed_message;
        } else {
          stores.layout().loginMessage = t('apiLoginFailed');
        }
      }
    },

    /**
     * Send acceptance of the user agreement
     */
    async sendLogout() {

      try {
        this.setSending(true);
        const response = await axios.put(
          '/corrector/start/logout',
          null,
          this.getStartRequestConfig
        );

        this.setSending(false);

        this.userId = '';
        this.loginToken = '';
        localStorage.setItem('xlasCorrectorUserId', '');
        localStorage.setItem('xlasCorrectorLoginToken', '');
        stores.user().clearStorage();
        stores.layout().initialized = false;

        this.initStart();

      } catch (error) {
      }
    },

    /**
     * Send acceptance of the user agreement
     */
    async sendAgreement() {

      try {
        this.setSending(true);
        const response = await axios.put(
          '/corrector/start/agreement',
          null,
          this.getStartRequestConfig
        );

        this.setSending(false);
        stores.layout().showAgreement = false;
        await stores.user().setAccepted();
        this.initStart();

      } catch (error) {
      }
    },


    /**
     * Send a summary pdf file
     * @return {string|false}
     */
    async sendSummaryPdf(summary, file, onProgress) {

      try {
        const formData = new FormData();
        // 'file' is the POST element
        formData.append('file', file);

        const response = await axios.post(
            '/corrector/upload/task/summary/' + summary.task_id + '/' + summary.writer_id,
            formData,
            Object.assign(this.getRequestConfig(this.dataToken), {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              onUploadProgress: onProgress
            }));
        return response.data.id;

      } catch (error) {
        console.log(error);
        return false;
      }
    },

    /**
     * Send a marked pdf file
     * @param {Blob} file
     * @param {string} scope 'own' or 'all'
     * @param {int} task_id
     * @param {int} writer_id
     * @return {string|false} id of the saved file
     */
    async sendMarkedPdf(file, scope, task_id, writer_id) {

      let entity;
      switch (scope) {
        case 'own':
          entity = 'ownpdf';
          break;
        case 'all':
          entity = 'sumpdf';
          break;
        default:
          return false;
      }

      try {
        const formData = new FormData();
        // 'file' is the POST element
        formData.append('file', file);

        const response = await axios.post(
          '/corrector/upload/essaytask/' + entity + '/' + task_id + '/' + writer_id,
          formData,
          Object.assign(this.getRequestConfig(this.dataToken), {
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          }));
        return response.data.id;

      } catch (error) {
        console.log(error);
        return false;
      }
    },

    /**
     * Send a marked pdf file
     * @param {Blob} file
     * @param {string} purpose
     * @return {bool} import is successful
     */
    async sendSnippets(file, purpose, onProgress) {

      let entity;
      switch (purpose) {
        case Snippet.FOR_COMMENT:
          entity = 'snippets_for_comment';
          break;
        case Snippet.FOR_SUMMARY:
          entity = 'snippets_for_summary';
          break;
        default:
          return false;
      }

      try {
        const formData = new FormData();
        // 'file' is the POST element
        formData.append('file', file);

        const response = await axios.post(
          '/corrector/upload/task/' + entity,
          formData,
          Object.assign(this.getRequestConfig(this.dataToken), {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: onProgress
          }));
        return response.data;

      } catch (error) {
        console.log(error);
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
      if (response.headers['xlastime']) {
        const serverTimeMs = response.headers['xlastime'] * 1000;
        const clientTimeMs = Date.now();

        this.timeOffset = clientTimeMs - serverTimeMs;
        localStorage.setItem('xlasCorrectorTimeOffset', this.timeOffset);
      }
    },

    /**
     * Refresh the auth token with the value from the REST response
     * Each REST call will generate a new auth token
     * A token has only a certain valid time (e.g. one our)
     * Within this time a new REST call must be made to get a new valid token
     */
    refreshToken(response) {
      if (response.headers['xlaslogintoken']) {
        this.loginToken = response.headers['xlaslogintoken'];
        localStorage.setItem('xlasCorrectorLoginToken', this.loginToken);
      }

      if (response.headers['xlasdatatoken']) {
        this.dataToken = response.headers['xlasdatatoken'];
        localStorage.setItem('xlasCorrectorDataToken', this.dataToken);
      }

      if (response.headers['xlasfiletoken']) {
        this.fileToken = response.headers['xlasfiletoken'];
        localStorage.setItem('xlasCorrectorFileToken', this.fileToken);
      }
    },

    /**
     * Check if a sending of changes is still running
     * Wait up to 5 seconds for a sending to complete
     *
     * @return boolean sending is still going on
     */
    async checkSending() {
      let tries = 0;
      while (tries < 5 && this.lastSendingTry > 0) {
        tries++;
        await new Promise(resolve => setTimeout(resolve, 1000));
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
     * Set a timer interval
     * @param {string} name unique name of the interval to set
     * @param {function} handler function that is called
     * @param {integer} interval milliseconds between each call
     */
    setInterval(name, handler, interval) {
      if (name in this.intervals) {
        clearInterval(this.intervals[name]);
      }
      this.intervals[name] = setInterval(handler, interval);
    },

    /**
     * Clear a timer interval
     */
    clearInterval(name) {
      clearInterval(this.intervals[name]);
    },

    /**
     * Clear all timer intervals
     */
    clearAllIntervals() {
      for (const name in this.intervals) {
        clearInterval(this.intervals[name]);
        delete this.intervals[name];
      }
    }
  }
})

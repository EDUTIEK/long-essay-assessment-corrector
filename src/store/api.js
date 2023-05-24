import { defineStore } from 'pinia';
import axios from 'axios'
import Cookies from 'js-cookie';
import {useSettingsStore} from "./settings";
import {useTaskStore} from "./task";
import {useLayoutStore} from "./layout";
import {useResourcesStore} from "./resources";
import {useItemsStore} from "./items";
import {useEssayStore} from "./essay";
import {useSummaryStore} from "./summary";
import {useLevelsStore} from "./levels";
import {useCriteriaStore} from "./criteria";
import {useCorrectorsStore} from "./correctors";
import {useCommentsStore} from "@/store/comments";
import {usePointsStore} from "@/store/points";
import md5 from 'md5';

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
            userKey: '',                        // identifying key of the correctiong user
            environmentKey: '',                 // identifying key of the correcting envirnonment (defining the task)
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
            showSendFailure: false,             // show a message about a sending failure
            showDataReplaceConfirmation: false, // show a confirmation that the stored data should be replaced by another task or user
            showItemReplaceConfirmation: false, // show a confirmation that the stored item should be replaced by another item

        }
    },

    getters: {

        isCorrection: (state) => !state.isReview && !state.isStitchDecision,

        /**
         * Get the config object for REST requests
         */
        requestConfig(state) {

            return function(token) {
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
                params.append('LongEssaySignature', md5( state.userKey + state.environmentKey + token));

                return {
                    baseURL: baseURL,
                    params: params,
                    timeout: 30000,             // milliseconds
                    responseType: 'json',       // default
                    responseEncoding: 'utf8',   // default
                }
            }

        },

        /**
         * Get the Url for loading a file ressource
         */
        resourceUrl() {
            return function (resourceKey) {
                const config = this.requestConfig(this.fileToken);
                return config.baseURL + '/file/' + resourceKey + '?' + config.params.toString();
            }
        },

        /**
         * Get the server unix timestamp (s) corresponding to a client timestamp (ms)
         */
        serverTime(state) {
            return (clientTime) => Math.floor((clientTime - state.timeOffset) / 1000);
        },

    },


    actions: {

        /**
         * Init the state
         * Take the state from the cookies or local store
         * Trigger a reload of all data if cookie values differ from local store
         */
        async init () {

            let newContext = false;

            // take values formerly stored
            this.backendUrl = localStorage.getItem('correctorBackendUrl');
            this.returnUrl = localStorage.getItem('correctorReturnUrl');
            this.userKey = localStorage.getItem('correctorUserKey');
            this.environmentKey = localStorage.getItem('correctorEnvironmentKey');
            this.dataToken = localStorage.getItem('correctorDataToken');
            this.fileToken = localStorage.getItem('correctorFileToken');
            this.timeOffset = Math.floor(localStorage.getItem('correctorTimeOffset') ?? 0);
            this.isReview = !!localStorage.getItem('correctorIsReview'); // boolean is stored as '1' or ''
            this.isStitchDecision = !!localStorage.getItem('correctorIsStitchDecision');

            // check if context given by cookies differs and force a reload if neccessary
            if (!!Cookies.get('LongEssayUser') && Cookies.get('LongEssayUser') !== this.userKey) {
                this.userKey = Cookies.get('LongEssayUser');
                newContext = true;
            }
            if (!!Cookies.get('LongEssayEnvironment') && Cookies.get('LongEssayEnvironment') !== this.environmentKey) {
                this.environmentKey = Cookies.get('LongEssayEnvironment');
                newContext = true;
            }
            if ((Cookies.get('LongEssayIsReview') == '1') != this.isReview) {
                this.isReview = (Cookies.get('LongEssayIsReview') == '1');
                newContext = true;
            }
            if ((Cookies.get('LongEssayIsStitchDecision') == '1') != this.isStitchDecision) {
                this.isStitchDecision = (Cookies.get('LongEssayIsStitchDecision') == '1');
                newContext = true;
            }

            this.itemKey = '';
            if (Cookies.get('LongEssayItem')) {
                this.itemKey = Cookies.get('LongEssayItem');
            }

            // these values can be changed without forcing a reload
            if (!!Cookies.get('LongEssayBackend') && Cookies.get('LongEssayBackend') !== this.backendUrl) {
                this.backendUrl = Cookies.get('LongEssayBackend');
            }
            if (!!Cookies.get('LongEssayReturn') && Cookies.get('LongEssayReturn') !== this.returnUrl) {
                this.returnUrl = Cookies.get('LongEssayReturn');
            }
            if (!!Cookies.get('LongEssayToken') && Cookies.get('LongEssayToken') !== this.dataToken) {
                this.dataToken = Cookies.get('LongEssayToken');
            }

            if (!this.backendUrl || !this.returnUrl || !this.userKey || !this.environmentKey || !this.dataToken) {
                this.showInitFailure = true;
                return;
            }

            const summaryStore = useSummaryStore();
            if (await summaryStore.hasUnsentSavingInStorage()) {
                if (newContext) {
                    console.log('init: open saving, new context');
                    this.showDataReplaceConfirmation = true;
                }
                else {
                    console.log('init: open saving, same context');
                    this.showItemReplaceConfirmation = true;
                }
            }
            else {
                console.log('init: no open saving');
                if (await this.loadDataFromBackend()) {
                    this.initialized = await this.loadItemFromBackend(this.itemKey);
                }
                this.updateConfig();
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
                this.initialized =  await this.loadItemFromBackend(this.itemKey);
            }
            this.updateConfig();
        },

        /**
         * init after the keeping of all data is confirmed
         */
        async initAfterKeepDataConfirmed() {
            console.log('initAfterKeepDataConfirmed');
            this.showDataReplaceConfirmation = false;
            this.showItemReplaceConfirmation = false;
            this.itemKey = localStorage.getItem('correctorItemKey');
            this.initialized = this.loadDataFromStorage();
            this.initialized = this.loadItemFromStorage( this.itemKey);
            this.updateConfig();
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
            Cookies.remove('LongEssayItem');
            Cookies.remove('LongEssayToken');
            Cookies.remove('LongEssayIsReview');
            Cookies.remove('LongEssayIsStitchDecision');

            localStorage.setItem('correctorBackendUrl', this.backendUrl);
            localStorage.setItem('correctorReturnUrl', this.returnUrl);
            localStorage.setItem('correctorUserKey', this.userKey);
            localStorage.setItem('correctorEnvironmentKey', this.environmentKey);
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

            const settingsStore = useSettingsStore();
            const taskStore = useTaskStore();
            const resourcesStore = useResourcesStore();
            const levelsStore = useLevelsStore();
            const criteriaStore = useCriteriaStore();
            const layoutStore = useLayoutStore();
            const itemsStore = useItemsStore();

            await settingsStore.loadFromStorage();
            await taskStore.loadFromStorage();
            await resourcesStore.loadFromStorage();
            await levelsStore.loadFromStorage();
            await criteriaStore.loadFromStorage();
            await layoutStore.loadFromStorage();
            await itemsStore.loadFromStorage();

            return true;
        },

        /**
         * Load the data of a new correction item from storage
         * This requires the itemKey to be set
         */
        async loadItemFromStorage(itemKey) {
            console.log("loadItemFromStorage...");

            const essayStore = useEssayStore();
            const correctorsStore = useCorrectorsStore();
            const summaryStore = useSummaryStore();
            const commentsStore = useCommentsStore();
            const pointsStore = usePointsStore();

            // todo: make item dependent
            await essayStore.loadFromStorage();
            await correctorsStore.loadFromStorage();
            await summaryStore.loadFromStorage();

            await commentsStore.loadFromStorage(itemKey);
            await pointsStore.loadFromStorage(commentsStore.getCurrentCommentKeys);

            return true;
        },


        /**
         * Load common data from the backend
         */
        async loadDataFromBackend() {
            console.log("loadDataFromBackend...");

            let response = {};
            try {
                response = await axios.get( '/data', this.requestConfig(this.dataToken));
                this.setTimeOffset(response);
                this.refreshToken(response);
            }
            catch (error) {
                console.error(error);
                this.showInitFailure = true;
                return false;
            }

            const taskStore = useTaskStore();
            const settingsStore = useSettingsStore();
            const resourcesStore = useResourcesStore();
            const levelsStore = useLevelsStore();
            const criteriaStore = useCriteriaStore();
            const layoutStore = useLayoutStore();
            const itemsStore = useItemsStore();

            await taskStore.loadFromData(response.data.task);
            await settingsStore.loadFromData(response.data.settings);
            await resourcesStore.loadFromData(response.data.resources);
            await levelsStore.loadFromData(response.data.levels);
            await criteriaStore.loadFromData(response.data.criteria);
            await itemsStore.loadFromData(response.data.items);
            await layoutStore.clearStorage();

            return true;
        },


        /**
         * Load the data of a new correction item from the backend
         */
        async loadItemFromBackend(itemKey) {

            console.log("loadItemFromBackend...");

            if (itemKey == '') {
                const itemsStore = useItemsStore();
                itemKey = itemsStore.firstKey
            }

            let response = {};
            try {
                response = await axios.get( '/item/' + itemKey, this.requestConfig(this.dataToken));
                this.setTimeOffset(response);
                this.refreshToken(response);
            }
            catch (error) {
                console.error(error);
                this.showItemLoadFailure = true;
                return false;
            }

            const taskStore = useTaskStore();
            const essayStore = useEssayStore();
            const correctorsStore = useCorrectorsStore();
            const summaryStore = useSummaryStore();
            const commentsStore = useCommentsStore();
            const pointsStore = usePointsStore();

            await taskStore.loadFromData(response.data.task);
            await essayStore.loadFromData(response.data.essay);
            await correctorsStore.loadFromData(response.data.correctors);
            await summaryStore.loadFromData(response.data.summary);

            await commentsStore.loadFromData(response.data.comments, itemKey);
            await pointsStore.loadFromData(response.data.points, commentsStore.getCurrentCommentKeys);

            this.itemKey = itemKey;
            localStorage.setItem('itemKey', this.itemKey);
            return true;
        },

        /**
         * Save the correction summary to the backend
         */
        async saveSummaryToBackend(data) {
            let response = {};
            try {
                response = await axios.put( '/summary/' + this.itemKey, data, this.requestConfig(this.dataToken));
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
         * Save the stitch descision to the backend
         */
        async saveStitchDecisionToBackend(data) {
            let response = {};
            try {
                response = await axios.put( '/stitch/' + this.itemKey, data, this.requestConfig(this.dataToken));
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
         * Set the activatin for showing a sending failure
         */
        setShowSendFailure(active) {
          this.showSendFailure = active
        }
    }
})

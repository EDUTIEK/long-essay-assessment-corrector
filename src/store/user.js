/**
 * Config Store
 * handles the editor config of the assessment
 */
import {getStorage} from "@/lib/Storage";
import i18n from "@/plugins/i18n";
import {defineStore} from 'pinia';
import Comment from "@/data/Comment";
import Correction from "@/data/Correction";
import {stores} from "@/store/index";

const storage = getStorage('user');

const { t } = i18n.global

const startState = {
  // saved in storage
  full_name: '',            // Full name of the current user
  agreement: '',            // User agreement
  accepted: false,          // acceptance of the user agreement
}

export const useUserStore = defineStore('user', {
  state: () => {
    return startState;
  },

  getters: {

    hasToAccept: state => !!state.agreement && !state.accepted


  },

  actions: {

    async clearStorage() {
      try {
        this.$reset();
        await storage.clear();
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromStorage() {
      try {
        this.$patch(await storage.getItem('user'));
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromBackend(data = {}) {
      try {
        this.$patch({
          full_name: data.full_name ?? null,
          agreement: data.agreement ?? null,
          accepted: data.accepted ?? false,
        });
        await storage.setItem('user',  Object.assign({}, this.$state));
      }
      catch (err) {
        console.log(err);
      }
    },

    async setAccepted() {
      this.accepted = true;
      await storage.setItem('user',  Object.assign({}, this.$state));
    }
  }
});

import { defineStore } from 'pinia';
import localForage from "localforage";
import { useApiStore } from "./api";

const storage = localForage.createInstance({
  storeName: "corrector-task",
  description: "Task data",
});


/**
 * Task Store
 * Handles settings of the writing task
 */
export const useTaskStore = defineStore('task', {
  state: () => {
    return {
      // saved in storage
      title: null,                    // title of the task - shown in the app bar
      instructions: null,             // instructions - shown in the left column
      solution: null,                 // solution - shown in the left column
      correction_end: null,           // correction end (sec in server time) - accept no writing step after this time

      // not saved in storage
      remaining_time: null            // remaining correction time in seconds (updated per interval)
    }
  },

  getters: {
    hasInstructions: state => !!state.instructions,
    hasSolution: state => !!state.solution,
    hasCorrectionEnd: state => !!state.correction_end,
    correctionEndReached: state => state.remaining_time === 0,
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
      const apiStore = useApiStore();
      try {
        const data = await storage.getItem('task');
        this.$patch(data);
      }
      catch (err) {
        console.log(err);
      }

      this.updateRemainingTime();
    },

    async loadFromData(data) {
      const apiStore = useApiStore();
      try {
        await storage.setItem('task', data);
        this.$patch(data);
      }
      catch (err) {
        console.log(err);
      }

      this.updateRemainingTime();
    },

    /**
     * Update the remaining correction time
     */
    updateRemainingTime() {
      const apiStore = useApiStore();

      if (this.correction_end) {
        this.remaining_time = Math.max(0, this.correction_end - apiStore.getServerTime(Date.now()));
      } else {
        this.remaining_time = null;
      }
    }
  }
});

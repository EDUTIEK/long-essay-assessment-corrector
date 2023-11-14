import { defineStore } from 'pinia';
import localForage from "localforage";

const storage = localForage.createInstance({
  storeName: "corrector-preferences",
  description: "Preferences data",
});

/**
 * Preferences Store
 * Stores local setings done by the corrector
 * These settings are not yet sent to the backend
 */
export const usePreferencesStore = defineStore('preferences', {
  state: () => {
    return {
      // saved in storage
      essay_page_zoom: 0.25,              // zoom of a pdf page display
      essay_text_zoom: 1,                 // zoom of an essay text display
      include_comments: null,             // include comments in the authorized correction
      include_comment_ratings: null,      // include comment ratings in the authorized correction
      include_comment_points: null,       // include comment points in the authorized correction
      include_criteria_points: null,      // include criteria points in the authorized correction
      include_writer_notes: null,         // include writer notes in the authorized correction

      // not saved in storage
      sent: false                        // preferences are sent to the backend
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
        const data = await storage.getItem('settings');
        if (data) {
          this.$patch(data);
        }
      }
      catch (err) {
        console.log(err);
      }
    },

    async saveToStorage() {
      try {
        await storage.setItem('settings', {
          essay_page_zoom: this.essay_page_zoom,
          essay_text_zoom: this.essay_text_zoom,
          include_comments: this.include_comments,
          include_comment_ratings: this.include_comment_ratings,
          include_comment_points: this.include_comment_points,
          include_criteria_points: this.include_criteria_points,
          include_writer_notes: this.include_writer_notes,
          sent: this.sent
        });
      }
      catch (err) {
        console.log(err);
      }
    },

    loadFromData(data) {
      try {
        this.$patch(data);
        this.sent = true;
        this.saveToStorage();

      }
      catch (err) {
        console.log(err);
      }
    },

    setSent() {
      this.sent = true;
      this.saveToStorage();
    },


    setInclusions(
      include_comments,
      include_comment_ratings,
      include_comment_points,
      include_criteria_points,
      include_writer_notes
    ) {
      this.include_comments = include_comments;
      this.include_comment_ratings = include_comment_ratings;
      this.include_comment_points = include_comment_points;
      this.include_criteria_points = include_criteria_points;
      this.include_writer_notes = include_writer_notes;
      this.sent = false;
      this.saveToStorage();
    },

    zoomEssayPageIn() {
      this.essay_page_zoom = this.essay_page_zoom * 1.1;
      this.sent = false;
      this.saveToStorage();
    },

    zoomEssayPageOut() {
      this.essay_page_zoom = this.essay_page_zoom * 0.9;
      this.sent = false;
      this.saveToStorage();
    },

    zoomEssayTextIn() {
      this.essay_text_zoom = this.essay_text_zoom * 1.1;
      this.sent = false;
      this.saveToStorage();
    },

    zoomEssayTextOut() {
      this.essay_text_zoom = this.essay_text_zoom * 0.9;
      this.sent = false;
      this.saveToStorage();
    }

  },
});
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Summary from "@/data/Summary";
import Change from "@/data/Change";
import i18n from "@/plugins/i18n";
import Procedure from '@/data/Procedure';
import Correction from '@/data/Correction';
import Item from "@/data/Item";

const { t } = i18n.global;

const storage = getStorage('summaries');

// set check interval very short to update the grade level according the points
const checkInterval = 1000;      // time (ms) to wait for a new update check (e.g. 0.2s to 1s)
const forceInterval = 60000;    // max time to wait for a new update check if update check is locked

let lockUpdate = 0;             // prevent updates during a processing

/**
 * Summaries Store
 */
export const useSummariesStore = defineStore('summaries', {
  state: () => {
    return {
      // saved in storage
      summaries: {},              // list of all summary objects for the current item, indexed by key

      // not saved in storage
      editSummary: new Summary(), // summary of the corrector correction that is actively edited
      lastCheck: 0,               // timestamp (ms) of the last check if an update needs a storage
    }

  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    /**
     * Get the corresponding summary for a first or second corrector
     * @return Summary|null
     */
    ownSummary(state) {
      return state.editSummary;
    },

    /**
     * Get the corresponding summary for a first or second corrector
     * @return Summary|null
     */
    otherSummary(state) {
      switch (stores.corrections().ownCorrection?.position) {
        case Correction.POSITION_FIRST:
          return state.getForCorrection(stores.corrections().secondCorrection?.key ?? '') ?? null;
        case Correction.POSITION_SECOND:
          return state.getForCorrection(stores.corrections().firstCorrection?.key ?? '') ?? null;
      }
      return null;
    },

    allSummaries(state) {
      return Object.values(state.summaries);
    },

    isOwnValidForAuthorization(state) {
      return state.editSummary.hasTextOrPdf()
      && state.editSummary.hasPoints()
      && state.editSummary.points >= state.pointsCorridor.min
      && state.editSummary.points <= state.pointsCorridor.max
    },

    isOwnValidForRevision(state) {
      const own_correction = stores.corrections().ownCorrection;

      return state.editSummary.hasRevisionText() == own_correction.can_enter_revision_text
          && state.editSummary.hasRevisionPoints()
          && state.editSummary.points >= state.pointsCorridor.min
          && state.editSummary.points <= state.pointsCorridor.max
    },

    /**
     * Is an editing of the current correction and item disabled
     * @return {bool}
     */
    isOwnDisabled(state) {
      return state.editSummary.correction_key == ''
          || state.editSummary.isPregraded()
          || state.editSummary.isAuthorized()
          || !stores.items().canCorrect
    },

    /**
     * Is a revision of the current correction and item disabled
     * @return {bool}
     */
    isOwnRevisionDisabled(state) {
      return state.editSummary.correction_key == ''
          || state.editSummary.isRevised()
          || !stores.items().canRevise
    },

    /**
     * Is the current correction pregraded
     * @returns {bool}
     */
    isOwnPregraded(state) {
      return state.editSummary.isPregraded();
    },

    /**
     * Is the summary of the current correction and item authorized
     * @returns {bool}
     */
    isOwnAuthorized(state) {
      return state.editSummary.isAuthorized();
    },

    /**
     * Is the summary of the current correction and item revised
     * @returns {bool}
     */
    isOwnRevised(state) {
      return state.editSummary.isRevised();
    },

    isOneAuthorized(state) {
      for (const summary of state.allSummaries) {
        if (summary.isAuthorized()) {
          return true;
        }
      }
      return false;
    },

    ownPdf(state) {
      return state.editSummary.pdf;
    },

    areOthersAuthorized(state) {
      for (const summary of state.allSummaries) {
        if (summary.getKey() != state.editSummary.getKey() && !summary.isAuthorized()) {
          return false;
        }
      }
      return true;
    },

    /**
     * Resulting grade title from the summary of the current correction and item
     * @returns {string}
     */
    currentGradeTitle(state) {
      return stores.levels().getLevel(state.editSummary.grade_key ?? '')?.title ?? t('summariesNoGrade');
    },

    /**
     * Resulting grade title from the summary of the current correction and item
     * @returns {string}
     */
    currentGradeStatement(state) {
      return stores.levels().getLevel(state.editSummary.grade_key ?? '')?.statement ?? '';
    },

    /**
     * Resulting revision grade title from the summary of the current correction and item
     * @returns {string}
     */
    currentRevisionGradeTitle(state) {
      return stores.levels().getLevel(state.editSummary.revision_grade_key ?? '')?.title ?? t('summariesNoGrade');
    },

    /**
     * Resulting revision grade title from the summary of the current correction and item
     * @returns {string}
     */
    currentRevisionGradeStatement(state) {
      return stores.levels().getLevel(state.editSummary.revision_grade_key ?? '')?.statement ?? '';
    },

    getAuthorizationForCorrection(state) {
      /**
       * Get a summary of a specific correction for the current item
       * @param {string} correction_key
       * @returns {bool}
       */
      const fn = function (correction_key) {
        for (const summary of state.allSummaries) {
          if (summary.correction_key == correction_key) {
            return summary.isAuthorized();
          }
        }
        return false;
      }
      return fn;
    },

    getForCorrection(state) {

      /**
       * Get a summary of a specific correction for the current item
       * @param {string} correction_key
       * @returns {Summary}
       */
      const fn = function (correction_key) {
        for (const summary of state.allSummaries) {
          if (summary.correction_key == correction_key) {
            return summary;
          }
        }
        return null;
      }
      return fn;
    },

    /**
     * Text to be shown for an authorization if a procedure ot stitch decision is needed afterward
     * @returns {string}
     */
    procedureNeededText(state) {
      const reason = state.pointsDifferText;
      if (reason) {
        switch (stores.settings().Assessment.procedure) {
          case Procedure.APPROXIMATION:
            return t('summariesProcedureApproximationNeeded', [reason]);
          case Procedure.CONSULTING:
            return t('summariesProcedureConsultingNeeded', [reason]);
        }
        // a stitch decision can be required without a procedure
        if (stores.settings().Assessment.stitch_when_distance) {
          return t('summariesProcedureStitchNeeded', [reason]);
        }
      }
      return '';
    },

    /**
     * Text to be shown for an revision if a stitch decision is needed afterward
     * @returns {string}
     */
    stitchNeededAfterRevisionText(state) {
      const reason = state.pointsDifferText;
      if (reason) {
        if (stores.settings().Assessment.stitch_when_distance) {
          return t('summariesProcedureStitchNeeded', [reason]);
        }
      }
     return '';
    },

    /**
     * Text why a procedure or stitch decision is needed for the current item
     * @returns {string}
     */
    pointsDifferText(state) {
      const ownSummary = state.ownSummary;
      const otherSummary = state.otherSummary;

      if (ownSummary === null || otherSummary === null) {
        return '';
      }

      let own_points = null;
      let other_points = null;

      if (stores.items().canAuthorize) {
        own_points = ownSummary.points;
        other_points = otherSummary.points;
      } else if (stores.items().canRevise) {
        own_points = ownSummary.revision_points ?? ownSummary.points;
        other_points = otherSummary.revision_points ?? otherSummary.points;
      }

      if (own_points === null || other_points === null) {
        return '';
      }

      if (Math.abs(own_points - other_points) > stores.settings().Assessment.max_no_procedure_distance) {
        return t('summariesPointsDifferText', stores.settings().Assessment.max_no_procedure_distance);
      }

      return '';
    },

    pointsOutsideCorridorText(state) {
      const corridor = state.pointsCorridor;
      const points = stores.items().canRevise ? state.editSummary.revision_points : state.editSummary.points;
      if (points < corridor.min || points > corridor.max) {
        return t('summariesPointsOutsideMinMax', [
          stores.preferences().formatNumber(corridor.min),
          stores.preferences().formatNumber(corridor.max)
        ]);
      }
      return '';
    },

    /**
     * Get the minimum and maximum allowed points
     * @return {object}
     */
    pointsCorridor(state) {
      const firstSummary = state.getForCorrection(stores.corrections().firstCorrection?.key ?? '') ?? null;
      const secondSummary = state.getForCorrection(stores.corrections().secondCorrection?.key ?? '') ?? null;

      let first_points = null;
      let second_points = null;

      // stitch decision checks points of revision first, then original points
      if (stores.corrections().ownCorrection?.position == Correction.POSITION_STITCH) {
        first_points = firstSummary?.revision_points ?? firstSummary?.points;
        second_points = secondSummary?.revision_points ?? secondSummary?.points;
      }
      // revision with corridor limit checks only original points
      else if (stores.items().canRevise && stores.settings().Assessment.revision_between) {
        first_points = firstSummary?.points;
        second_points = secondSummary?.points;
      }
      // all other cases check the allowed points
      else {
        first_points = 0;
        second_points = stores.settings().Assessment.max_points;
      }

      return {
        min: Math.min(first_points, second_points),
        max: Math.max(first_points, second_points)
      }
    },
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

    /**
     * Load the summaries data from the storage
     * Only the summaries of the current item are loaded to the state
     *
     * @public
     */
    async loadFromStorage() {
      const apiStore = stores.api();
      const levelsStore = stores.levels();
      const correctionsStore = stores.corrections();
      try {
        this.$reset();

        const keys = await storage.getItem('keys');
        for (const key of keys) {
          const summary = new Summary(await storage.getItem(key));
          summary.grade_key = levelsStore.getLevelForPoints(summary.points)?.key ?? '';
          summary.revision_grade_key = levelsStore.getLevelForPoints(summary.revision_points)?.key ?? '';
          if (summary.item_key == apiStore.itemKey) {
            this.summaries[key] = summary;
          }
          if (summary.correction_key == correctionsStore.ownKey) {
            this.editSummary = summary.getClone();
          }
        }

      }
      catch (err) {
        console.log(err);
      }

      lockUpdate = 0;
      apiStore.setInterval('summariesStore.updateContent', this.updateContent, checkInterval);
    },

    /**
     * Load the summaries data from the backend
     *
     * All keys and summaries are put to the storage
     * Only the summaries of the current item are loaded to the state
     *
     * @param {array} data - array of plain objects
     * @public
     */
    async loadFromBackend(data) {
      const apiStore = stores.api();
      const levelsStore = stores.levels();
      const correctionsStore = stores.corrections();
      try {
        await storage.clear();
        this.$reset();

        for (const item of data) {
          const summary = new Summary(item);
          summary.grade_key = levelsStore.getLevelForPoints(summary.points)?.key ?? '';
          summary.revision_grade_key = levelsStore.getLevelForPoints(summary.revision_points)?.key ?? '';
          await storage.setItem(summary.getKey(), summary.getData());
          if (summary.item_key == apiStore.itemKey) {
            this.summaries[summary.getKey()] = summary;
          }
          if (summary.correction_key == correctionsStore.ownKey) {
            this.editSummary = summary.getClone();
          }
        }
        await storage.setItem('keys', Object.keys(this.summaries));
      }
      catch (err) {
        console.log(err);
      }

      lockUpdate = 0;
      apiStore.setInterval('summariesStore.updateContent', this.updateContent, checkInterval);
    },

    /**
     * Update the stored content
     * Triggered from the editor component when the content is changed
     * Triggered every checkInterval
     */
    async updateContent(fromEditor = false, forced = false) {
      const levelsStore = stores.levels();
      const apiStore = stores.api();
      const changesStore = stores.changes();

       // avoid too many checks
      const currentTime = Date.now();
      if (!forced && currentTime - this.lastCheck < checkInterval) {
        return;
      }

      // force a check if update is locked for too long
      if (!forced && currentTime - this.lastCheck > forceInterval) {
        forced = true;
      }

      // avoid parallel updates
      // no need to wait because updateContent is called by interval
      // use post-increment for test-and set
      if (forced) {
        lockUpdate++;
      } else if (lockUpdate++) {
        return;
      }

      // use a clone to avoid conflict with ongoing inputs
      const storedSummary = this.summaries[this.editSummary.getKey()] ?? new Summary();
      const clonedSummary = this.getCloneToStore(storedSummary, this.editSummary);
      if (clonedSummary.isEqual(storedSummary)) {
        this.lastCheck = currentTime;
        lockUpdate = 0;
        return;
      }
      clonedSummary.last_change = apiStore.getServerTime(currentTime);

      try {
        // this updates the adjusted points
        this.editSummary.setData(clonedSummary.getData());
        this.summaries[clonedSummary.getKey()] = clonedSummary;

        await storage.setItem(clonedSummary.getKey(), clonedSummary.getData());
        await changesStore.setChange(new Change({
          type: Change.TYPE_SUMMARY,
          action: Change.ACTION_SAVE,
          key: clonedSummary.getKey(),
          item_key: clonedSummary.item_key
        }))

        console.log(
            "Save Change ",
            "| Editor: ", fromEditor,
            "| Duration:", Date.now() - currentTime, 'ms');
      }
      catch (error) {
        console.error(error);
      }

      this.lastCheck = currentTime;
      lockUpdate = 0;
    },

    /**
     * Get a cloned summary to store
     * This respects which fields are changeable in the current correction status
     * @param {Summary} stored
     * @param {Summary} edited
     * @return {Summary}
     */
    getCloneToStore(stored, edited) {
      const itemsStore = stores.items();
      const levelsStore = stores.levels();

      let clone = stored.getClone();
      if (itemsStore.canCorrect) {
        clone.text = edited.text;
        clone.pdf = edited.pdf;
        clone.points = this.adjustPoints(edited.points);
        clone.grade_key = levelsStore.getLevelForPoints(edited.points)?.key ?? '';
      }
      if (itemsStore.canRevise) {
        clone.revision_text = edited.revision_text;
        clone.revision_points = this.adjustPoints(edited.revision_points);
        clone.revision_grade_key = levelsStore.getLevelForPoints(edited.revision_grade_key)?.key ?? '';
        clone.require_other_revision = edited.require_other_revision;
      }

      switch (edited.status) {
        case Summary.STATUS_PRE_GRADED:
        case Summary.STATUS_OPEN:
          clone.status = itemsStore.canCorrect ? edited.status : clone.status;
          break;
        case Summary.STATUS_AUTHORIZED:
          clone.status = itemsStore.canAuthorize ? edited.status : clone.status;
          break;
        case Summary.STATUS_REVISED:
          clone.status = itemsStore.canRevise ? edited.status : clone.status;
      }

      return clone;
    },

    updatePoints(points) {
      points =  this.adjustPoints(points);
      this.editSummary.points = points;
      this.editSummary.grade_key = stores.levels().getLevelForPoints(points)?.key ?? ''
    },

    updateRevisionPoints(points) {
      points = this.adjustPoints(points);
      this.editSummary.revision_points = points;
      this.editSummary.revision_grade_key = stores.levels().getLevelForPoints(points)?.key ?? ''
    },

    /**
     * Adjust the points to the allowed range
     * @param {float|null} points
     * @return {float|null}
     */
    adjustPoints(points) {
      const settingsStore = stores.settings();

      if (points === null || Number.isNaN(points)) {
        return null;
      }

      points = parseFloat(points);

      if (!Number.isInteger(points) && settingsStore.Assessment.no_manual_decimals) {
        points = Math.floor(points);
      }

      if (points < this.pointsCorridor.min) {
        return null;
      }
      if (points > this.pointsCorridor.max) {
        return null;
      }

      return points;
    },

    /**
     * Get all changed summaries from the storage as flat data objects
     * These may include summaries of other items that are only in the storage
     * This is called for sending the summaries to the backend
     * @param {integer} sendingTime - timestamp of the sending or 0 to get all
     * @return {array} Change objects
     */
    async getChangedData(sendingTime = 0) {
      const changesStore = stores.changes();
      const changes = [];
      for (const change of changesStore.getChangesFor(Change.TYPE_SUMMARY, sendingTime)) {
        const data = await storage.getItem(change.key);
        changes.push(changesStore.getChangeDataToSend(change, data));
      }
      return changes;
    },

    /**
     * Set the own current summary as open
     */
    async setOwnOpen() {
      this.editSummary.status = Summary.STATUS_OPEN;
      await this.updateContent(false, true);
    },

    /**
     * Set the own current summary as pregraded
     */
    async setOwnPregraded() {
      this.editSummary.status = Summary.STATUS_PRE_GRADED;
      await this.updateContent(false, true);
      stores.api().clearInterval('summariesStore.updateContent');
    },

    /**
     * Set the own current summary as authorized
     */
    async setOwnAuthorized() {
      this.editSummary.status = Summary.STATUS_AUTHORIZED;
      await this.updateContent(false, true);
      stores.api().clearInterval('summariesStore.updateContent');
    },

    /**
     * Set the own current summary as revised
     */
    async setOwnRevised(require_other_revision) {
      this.editSummary.require_other_revision = !!require_other_revision;
      this.editSummary.status = Summary.STATUS_REVISED;
      await this.updateContent(false, true);
      stores.api().clearInterval('summariesStore.updateContent');
    },
  }

});

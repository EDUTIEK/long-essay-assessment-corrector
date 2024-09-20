import { defineStore } from 'pinia';
import localForage from "localforage";
import { useCorrectorsStore } from '@/store/correctors';
import { useApiStore } from '@/store/api';

const storage = localForage.createInstance({
  storeName: "corrector-layout",
  description: "Layout data",
});


/**
 * Layout Store
 * Handles visibility of user interface components
 */
export const useLayoutStore = defineStore('layout', {
  state: () => {
    return {
      // saved in storage
      expandedColumn: 'none',             // left|right|none
      leftContent: 'essay',               // instructions|instructionsPdf|solution|solutionPdf|resources|essay|corrector
      rightContent: 'marking',            // summary|marking|corrector

      showMarkingComments: true,          // display of the comments on marking column
      showMarkingPoints: true,            // display of the rating points on marking column
      showMarkingText: false,             // display of the summary text on marking column

      showLeftSummaryCriteria: true,      // display of the criteria table on the left summary column
      showRightSummaryCriteria: true,     // display of the criteria table on the right summary column

      showLeftSummaryText: true,          // display of the summary text on the left summary column
      showRightSummaryText: true,         // display of the summary text on the right summary column

      // not stored
      leftCorrectorKey: '',               // key of the corrector shown on the left side
      rightCorrectorKey: '',              // key of the corrector shown on the right side
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {
    isLeftExpanded: state => state.expandedColumn == 'left',
    isRightExpanded: state => state.expandedColumn == 'right',

    isInstructionsSelected: state => state.leftContent == 'instructions',
    isInstructionsPdfSelected: state => state.leftContent == 'instructionsPdf',
    isSolutionSelected: state => state.leftContent == 'solution',
    isSolutionPdfSelected: state => state.leftContent == 'solutionPdf',
    isResourcesSelected: state => state.leftContent == 'resources',
    isEssaySelected: state => state.leftContent == 'essay',
    isSummarySelected: state => state.rightContent == 'summary',
    isMarkingSelected: state => state.rightContent == 'marking',
    isLeftCorrectorSelected: state => state.leftContent == 'corrector',
    isRightCorrectorSelected: state => state.rightContent == 'corrector',

    isInstructionsVisible: state => (state.isInstructionsSelected && state.isLeftVisible),
    isInstructionsPdfVisible: state => (state.isInstructionsPdfSelected && state.isLeftVisible),
    isSolutionVisible: state => (state.isSolutionSelected && state.isLeftVisible),
    isSolutionPdfVisible: state => (state.isSolutionPdfSelected && state.isLeftVisible),
    isResourcesVisible: state => (state.isResourcesSelected && state.isLeftVisible),
    isEssayVisible: state => (state.isEssaySelected && state.isLeftVisible),
    isSummaryVisible: state => (state.isSummarySelected && state.isRightVisible),
    isMarkingVisible: state => (state.isMarkingSelected && state.isRightVisible),
    isLeftCorrectorVisible: state => (state.isLeftCorrectorSelected && state.isLeftVisible),
    isRightCorrectorVisible: state => (state.isRightCorrectorSelected && state.isRightVisible),

    isLeftVisible: state => {
      const apiStore = useApiStore();
      return !apiStore.isLoading && state.expandedColumn != 'right'
    },

    isRightVisible: state => {
      const apiStore = useApiStore();
      return !apiStore.isLoading && state.expandedColumn != 'left'
    },

    leftCorrectorTitle: state => {
      const correctorsStore = useCorrectorsStore();
      const corrector = correctorsStore.getCorrector(state.leftCorrectorKey);
      return corrector ? 'Korrektur von ' + corrector.title + ' ' + correctorsStore.getPositionText(
        corrector.corrector_key) : ''
    },

    rightCorrectorTitle: state => {
      const correctorsStore = useCorrectorsStore();
      const corrector = correctorsStore.getCorrector(state.rightCorrectorKey);
      return corrector ? 'Korrektur von ' + corrector.title + ' ' + correctorsStore.getPositionText(
        corrector.corrector_key) : ''
    },

    getCorrectorIsVisible: state => {

      /**
       * Get if a corrector's summary is visible
       *
       * @param {string} corrector_key
       * @returns {boolean}
       */
      const fn = function (corrector_key) {
        return state.leftCorrectorKey == corrector_key && state.isLeftCorrectorVisible
          || state.rightCorrectorKey == corrector_key && state.isRightCorrectorVisible
      }
      return fn;
    },
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

        const data = await storage.getItem('layout');
        if (data) {
          this.expandedColumn = data.expandedColumn;
          this.rightContent = data.rightContent;
          this.showMarkingComments = !!data.showMarkingComments,
            this.showMarkingPoints = !!data.showMarkingPoints,
            this.showMarkingText = !!data.showMarkingText,
            this.showLeftSummaryCriteria = !!data.showLeftSummaryCriteria;
          this.showRightSummaryCriteria = !!data.showRightSummaryCriteria;
          this.showLeftSummaryText = !!data.showLeftSummaryText;
          this.showRightSummaryText = !!data.showRightSummaryText;
        }

        if (!this.showMarkingComments && !this.showMarkingPoints && !this.showMarkingPoints) {
          this.showMarkingComments = true;
        }
        if (!this.showLeftSummaryCriteria && !this.showLeftSummaryText) {
          this.showLeftSummaryCriteria = true;
        }
        if (!this.showRightSummaryCriteria && !this.showRightSummaryText) {
          this.showRightSummaryCriteria = true;
        }
      }
      catch (err) {
        console.log(err);
      }
    },

    async saveToStorage() {
      try {
        await storage.setItem('layout', {
          expandedColumn: this.expandedColumn,
          leftContent: this.leftContent,
          rightContent: this.rightContent,
          showMarkingComments: this.showMarkingComments,
          showMarkingPoints: this.showMarkingPoints,
          showMarkingText: this.showMarkingText,
          showLeftSummaryCriteria: this.showLeftSummaryCriteria,
          showRightSummaryCriteria: this.showRightSummaryCriteria,
          showLeftSummaryText: this.showLeftSummaryText,
          showRightSummaryText: this.showRightSummaryText
        })
      }
      catch (err) {
        console.log(err);
      }
    },

    showInstructions() {
      this.setLeftVisible();
      this.leftContent = 'instructions';
      this.saveToStorage();
    },

    showInstructionsPdf() {
      this.setLeftVisible();
      this.leftContent = 'instructionsPdf';
      this.saveToStorage();
    },

    showSolution() {
      this.setLeftVisible();
      this.leftContent = 'solution';
      this.saveToStorage();
    },

    showSolutionPdf() {
      this.setLeftVisible();
      this.leftContent = 'solutionPdf';
      this.saveToStorage();
    },

    showResources() {
      this.setLeftVisible();
      this.leftContent = 'resources';
      this.saveToStorage();
    },

    showLeftCorrector() {
      this.setLeftVisible();
      this.leftContent = 'corrector';
      this.saveToStorage();
    },

    showRightCorrector() {
      this.setRightVisible();
      this.rightContent = 'corrector';
      this.saveToStorage();
    },

    showEssay() {
      this.setLeftVisible();
      this.leftContent = 'essay';
      this.saveToStorage();
    },

    showMarking() {
      this.setRightVisible();
      this.rightContent = 'marking';
      this.showMarkingComments = true;
      this.showMarkingPoints = true;
      this.showMarkingText = false;
      this.saveToStorage();
    },

    showSummary() {
      this.setRightVisible();
      this.rightContent = 'summary';
      this.showRightSummaryText = true;
      this.showRightSummaryCriteria = false;
      this.saveToStorage();
    },

    setLeftVisible() {
      if (!this.isLeftVisible) {
        this.expandedColumn = 'left';
        this.saveToStorage();
      }
    },

    setRightVisible() {
      if (!this.isRightVisible) {
        this.expandedColumn = 'right';
        this.saveToStorage();
      }
    },

    setLeftExpanded(expanded) {
      this.expandedColumn = expanded ? 'left' : 'none';
      this.saveToStorage();
    },

    setRightExpanded(expanded) {
      this.expandedColumn = expanded ? 'right' : 'none';
      this.saveToStorage();
    },

    toggleMarkingComments() {
      this.showMarkingComments = !this.showMarkingComments
      this.saveToStorage();
    },

    toggleMarkingPoints() {
      this.showMarkingPoints = !this.showMarkingPoints
      this.saveToStorage();
    },

    toggleMarkingText() {
      this.showMarkingText = !this.showMarkingText
      this.saveToStorage();
    },

    toggleLeftSummaryCriteria() {
      this.showLeftSummaryCriteria = !this.showLeftSummaryCriteria
      this.saveToStorage()
    },

    toggleRightSummaryCriteria() {
      this.showRightSummaryCriteria = !this.showRightSummaryCriteria
      this.saveToStorage()
    },

    toggleLeftSummaryText() {
      this.showLeftSummaryText = !this.showLeftSummaryText
      this.saveToStorage()
    },

    toggleRightSummaryText() {
      this.showRightSummaryText = !this.showRightSummaryText
      this.saveToStorage()
    },

    selectCorrector(corrector_key) {
      const apiStore = useApiStore();
      const correctorsStore = useCorrectorsStore();

      if (this.leftCorrectorKey == corrector_key) {
        this.showLeftCorrector();
      } else if (this.rightCorrectorKey == corrector_key) {
        this.showRightCorrector();
      } else if (!apiStore.isForReviewOrStitch) {
        this.leftCorrectorKey = corrector_key;
        this.showLeftCorrector();
      } else if (correctorsStore.countCorrectors == 1) {
        this.rightCorrectorKey = corrector_key;
        this.showRightCorrector();
      } else if (this.leftCorrectorKey == '') {
        this.leftCorrectorKey = corrector_key;
        this.showLeftCorrector();
      } else if (this.rightCorrectorKey == '') {
        this.rightCorrectorKey = corrector_key;
        this.showRightCorrector();
      } else {
        this.leftCorrectorKey = corrector_key;
        this.showLeftCorrector();
      }
    },
  }
});


/**
 * Change the vertical expansion rate of a page element
 * @param {number} ratio
 * @return {number}
 */
function changeExpansion(ratio) {
  switch (ratio) {
    case 0:
      return 0.5;
    case 1:
      return 0;
    default:
      return 1;
  }
}


import { defineStore } from 'pinia';
import localForage from "localforage";
import { useCorrectorsStore } from '@/store/correctors';
import { useApiStore } from '@/store/api';
import {nextTick} from "vue";

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
      showMarkingGeneralCriteria: true,            // display of the general criteria on marking column
      showMarkingCommentCriteria: true,            // display of the comment criteria on marking column
      showMarkingText: false,             // display of the summary text on marking column

      showLeftSummaryCriteria: true,      // display of the criteria table on the left summary column
      showRightSummaryCriteria: true,     // display of the criteria table on the right summary column

      showLeftSummaryText: true,          // display of the summary text on the left summary column
      showRightSummaryText: true,         // display of the summary text on the right summary column

      // not stored
      leftCorrectorKey: '',               // key of the corrector shown on the left side
      rightCorrectorKey: '',              // key of the corrector shown on the right side

      focusTarget: '',                    // target for setting the focus (header|navigation|left|right|ownSummary)
      focusChange: 0                      // indicator to set the focus to the target
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
          this.showMarkingGeneralCriteria = !!data.showMarkingGeneralCriteria,
          this.showMarkingCommentCriteria = !!data.showMarkingCommentCriteria,
          this.showMarkingText = !!data.showMarkingText,
          this.showLeftSummaryCriteria = !!data.showLeftSummaryCriteria;
          this.showRightSummaryCriteria = !!data.showRightSummaryCriteria;
          this.showLeftSummaryText = !!data.showLeftSummaryText;
          this.showRightSummaryText = !!data.showRightSummaryText;
        }

        if (!this.showMarkingComments && !this.showMarkingCommentCriteria && !this.showMarkingCommentCriteria) {
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
          showMarkingGeneralCriteria: this.showMarkingGeneralCriteria,
          showMarkingCommentCriteria: this.showMarkingCommentCriteria,
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
      this.leftContent = 'instructions';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showInstructionsPdf() {
      this.leftContent = 'instructionsPdf';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showSolution() {
      this.leftContent = 'solution';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showSolutionPdf() {
      this.leftContent = 'solutionPdf';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showResources() {
      this.leftContent = 'resources';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showLeftCorrector() {
      this.leftContent = 'corrector';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showRightCorrector() {
      this.rightContent = 'corrector';
      this.setRightVisible();
      this.saveToStorage();
    },

    showEssay() {
      this.leftContent = 'essay';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showMarking() {
      this.rightContent = 'marking';
      this.setRightVisible();
      this.saveToStorage();
    },

    showSummary() {
      this.rightContent = 'summary';
      this.setRightVisible();
      this.saveToStorage();
    },

    showOwnSummaryText() {
      this.rightContent = 'summary';
      this.showRightSummaryText = true
      this.setRightVisible('ownSummary');
      this.saveToStorage();
    },

    setLeftVisible(target = null) {
      if (!this.isLeftVisible) {
        this.expandedColumn = 'left';
        this.saveToStorage();
      }
      if (target === null) {
        switch(this.leftContent) {
          case 'instructions':
          case 'solution':
          case 'essay':
            target = this.leftContent;
            break;
        }
      }
      this.setFocusChange(target ?? 'appHeadLeft');
    },

    setRightVisible(target = null) {
      if (!this.isRightVisible) {
        this.expandedColumn = 'right';
        this.saveToStorage();
      }
      this.setFocusChange(target ?? 'appHeadRight');
    },

    setLeftExpanded(expanded) {
      this.expandedColumn = expanded ? 'left' : 'none';
      this.saveToStorage();
    },

    setRightExpanded(expanded) {
      this.expandedColumn = expanded ? 'right' : 'none';
      this.saveToStorage();
    },

    focusMarkingCommentCriteriaSum() {
      if (!this.showMarkingComments) {
        this.showMarkingComments = true;
        this.saveToStorage();
      }
      this.setFocusChange('markingCommentCriteriaSum');
    },

    focusMarkingGeneralCriteria() {
      if (!this.showMarkingGeneralCriteria) {
        this.showMarkingGeneralCriteria = true;
        this.saveToStorage();
      }
      this.setFocusChange('markingGeneralCriteria');
    },

    focusMarkingCommentCriteria() {
      if (!this.showMarkingCommentCriteria) {
        this.showMarkingCommentCriteria = true;
        this.saveToStorage();
      }
      this.setFocusChange('markingCommentCriteria');
    },

    toggleMarkingComments() {
      this.showMarkingComments = !this.showMarkingComments
      this.saveToStorage();
    },

    toggleMarkingGeneralCriteria() {
      this.showMarkingGeneralCriteria = !this.showMarkingGeneralCriteria
      this.saveToStorage();
    },

    toggleMarkingCommentCriteria() {
      this.showMarkingCommentCriteria = !this.showMarkingCommentCriteria
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

    setFocusChange(target) {
      this.focusTarget = target;
      this.focusChange = Date.now();
    },

    handleKeyDown(event) {
      if (event.altKey) {
        switch (event.key) {
          case '0':
            this.setFocusChange('header');
            break;
          case '1':
            this.setLeftVisible();
            break;
          case '2':
            this.setRightVisible();
            break;
          case '#':
            this.setFocusChange('navigation');
            break;
        }
      }
    }
  }

});


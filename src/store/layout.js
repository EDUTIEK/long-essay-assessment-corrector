/**
 * Layout Store
 * Handles visibility of user interface components
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import {nextTick} from "vue";
import Item from "@/data/Item";
import Resource from "@/data/Resource";

const storage = getStorage('layout');

export const useLayoutStore = defineStore('layout', {
  state: () => {
    return {
      // saved in storage
      expandedColumn: 'none',             // left|right|none
      leftContent: 'essay',               // instructions|instructionsPdf|solution|solutionPdf|resources|essay|correction
      rightContent: 'marking',            // summary|marking|correction

      showMarkingComments: true,          // display of the comments on marking column
      showMarkingGeneralPoints: true,     // display of the general criteria on marking column
      showMarkingCommentPoints: true,     // display of the comment criteria on marking column
      showMarkingText: false,             // display of the summary text on marking column

      showLeftSummaryCriteria: false,      // display of the criteria table on the left summary column
      showRightSummaryCriteria: false,     // display of the criteria table on the right summary column

      showLeftSummaryText: true,          // display of the summary text on the left summary column
      showRightSummaryText: true,         // display of the summary text on the right summary column

      showLeftSummaryRevision: false,      // display of the revision text on the left summary column
      showRightSummaryRevision: false,     // display of the revision text on the right summary column

      showSnippetList: false,              // display the list of snippets on the left side

      // not stored
      leftCorrectionKey: '',               // key of the correction shown on the left side
      rightCorrectionKey: '',              // key of the correction shown on the right side
      showIncludesPopup: false,            // show the popup to set the included elements

      initFailure: '',                    // failure from app initialisation

      initialized: false,                 // used to switch from startup screen to the editing view
      showAgreement: false,               // show the user agreement form
      showItemLoadFailure: false,         // show a message that the loading if an item failed
      showSendFailure: false,             // show a message about a sending failure
      showDataReplaceConfirmation: false, // show a confirmation that the stored data should be replaced by another task or user
      showItemReplaceConfirmation: false, // show a confirmation that the stored item should be replaced by another item

      focusTarget: '',                    // target for setting the focus (header|navigation|left|right|ownSummary)
      focusChange: 0                      // indicator to set the focus to the target
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {
    hasInitFailure: state => state.initFailure !== '',

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
    isLeftCorrectionSelected: state => state.leftContent == 'correction',
    isRightCorrectionSelected: state => state.rightContent == 'correction',

    isInstructionsVisible: state => (state.isInstructionsSelected && state.isLeftVisible),
    isInstructionsPdfVisible: state => (state.isInstructionsPdfSelected && state.isLeftVisible),
    isSolutionVisible: state => (state.isSolutionSelected && state.isLeftVisible),
    isSolutionPdfVisible: state => (state.isSolutionPdfSelected && state.isLeftVisible),
    isResourcesVisible: state => (state.isResourcesSelected && state.isLeftVisible),
    isEssayVisible: state => (state.isEssaySelected && state.isLeftVisible),
    isSummaryVisible: state => (state.isSummarySelected && state.isRightVisible),
    isMarkingVisible: state => (state.isMarkingSelected && state.isRightVisible),
    isLeftCorrectionVisible: state => (state.isLeftCorrectionSelected && state.isLeftVisible),
    isRightCorrectionVisible: state => (state.isRightCorrectionSelected && state.isRightVisible),

    isLeftVisible(state)  {
      const apiStore = stores.api();
      return !apiStore.isLoading && state.expandedColumn != 'right'
    },

    isRightVisible(state)  {
      const apiStore = stores.api();
      return !apiStore.isLoading && state.expandedColumn != 'left'
    },

    isResourceShown(state) {

      const resourcesStore = stores.resources();
      /**
       * Check if a resource is visible
       * @returns {bool}
       */
      const fn = function (resource) {
        return (state.isInstructionsPdfVisible && resource.type === Resource.TYPE_INSTRUCTION ||
            state.isSolutionPdfVisible && resource.type === Resource.TYPE_SOLUTION ||
            state.isResourcesVisible && resourcesStore.getResourceIsActive(resource));
      }
      return fn;
    },

    leftCorrectionTitle(state)  {
      const correctionsStore = stores.corrections();
      const correction = correctionsStore.getCorrection(state.leftCorrectionKey);
      return correction ? 'Korrektur von ' + correction.title + ' ' + Item.buildPositionText(correction.position) : ''
    },

    rightCorrectionTitle(state)  {
      const correctionsStore = stores.corrections();
      const correction = correctionsStore.getCorrection(state.rightCorrectionKey);
      return correction ? 'Korrektur von ' + correction.title + ' '  + Item.buildPositionText(correction.position)  : ''
    },

    getCorrectionIsVisible(state) {

      /**
       * Get if a correction's summary is visible
       *
       * @param {string} correction_key
       * @returns {boolean}
       */
      const fn = function (correction_key) {
        return state.leftCorrectionKey == correction_key && state.isLeftCorrectionVisible
          || state.rightCorrectionKey == correction_key && state.isRightCorrectionVisible
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
          this.showMarkingGeneralPoints = !!data.showMarkingGeneralPoints,
          this.showMarkingCommentPoints = !!data.showMarkingCommentPoints,
          this.showMarkingText = !!data.showMarkingText,
          this.showLeftSummaryCriteria = !!data.showLeftSummaryCriteria;
          this.showRightSummaryCriteria = !!data.showRightSummaryCriteria;
          this.showLeftSummaryText = !!data.showLeftSummaryText;
          this.showRightSummaryText = !!data.showRightSummaryText;
          this.showSnippetList= !!data.showSnippetList;
        }

        if (!this.showMarkingComments && !this.showMarkingGeneralPoints && !this.showMarkingCommentPoints) {
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
          showMarkingGeneralPoints: this.showMarkingGeneralPoints,
          showMarkingCommentPoints: this.showMarkingCommentPoints,
          showMarkingText: this.showMarkingText,
          showLeftSummaryCriteria: this.showLeftSummaryCriteria,
          showRightSummaryCriteria: this.showRightSummaryCriteria,
          showLeftSummaryText: this.showLeftSummaryText,
          showRightSummaryText: this.showRightSummaryText,
          showSnippetList: this.showSnippetList
        })
      }
      catch (err) {
        console.log(err);
      }
    },

    initForItem() {

      if (!stores.settings().hasSummaryOverview) {
        this.showLeftSummaryCriteria = false;
        this.showRightSummaryCriteria = false;
      }

      if (stores.items().isInRevision || stores.items().isInStitch) {
        this.showLeftSummaryCriteria = false;
        this.showRightSummaryCriteria = false;

        this.leftContent = 'correction';
        this.leftCorrectionKey = stores.corrections().firstOtherCorrection?.key ?? '';
        if (stores.summaries().getForCorrection(this.leftCorrectionKey)?.isRevised) {
          this.showLeftSummaryRevision = true;
        }

        if (stores.corrections().ownCorrection !== null) {
          this.rightContent = 'summary';
          this.showRightSummaryRevision = true;
        } else {
          this.rightContent = 'correction';
          this.rightCorrectionKey = stores.corrections().secondOtherCorrection?.key ?? '';
          if (stores.summaries().getForCorrection(this.rightCorrectionKey)?.isRevised) {
            this.showRightSummaryRevision = true;
          }
        }
      }
      else {
        this.leftContent = 'essay';
        this.rightContent = 'marking';
        if (!stores.settings().Task.enable_comments) {
          this.showMarkingText = true;
        }
      }
      this.expandedColumn = 'none';
      this.saveToStorage();
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

    showLeftCorrection() {
      this.leftContent = 'correction';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showRightCorrection() {
      this.rightContent = 'correction';
      this.setRightVisible();
      this.saveToStorage();
    },

    showEssay() {
      this.leftContent = 'essay';
      this.setLeftVisible();

      if (stores.settings().Task.enable_comments) {
        this.rightContent = 'marking';
        this.setRightVisible();
      }
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

    focusMarkingCommentPointsSum() {
      if (!this.showMarkingComments) {
        this.showMarkingComments = true;
        this.saveToStorage();
      }
      this.setFocusChange('MarkingCommentPointsSum');
    },

    focusMarkingGeneralPoints() {
      if (!this.showMarkingGeneralPoints) {
        this.showMarkingGeneralPoints = true;
        this.saveToStorage();
      }
      this.setFocusChange('MarkingGeneralPoints');
    },

    focusMarkingCommentPoints() {
      if (!this.showMarkingCommentPoints) {
        this.showMarkingCommentPoints = true;
        this.saveToStorage();
      }
      this.setFocusChange('MarkingCommentPoints');
    },

    toggleMarkingComments() {
      this.showMarkingComments = !this.showMarkingComments
      this.saveToStorage();
    },

    toggleMarkingGeneralPoints() {
      this.showMarkingGeneralPoints = !this.showMarkingGeneralPoints
      this.saveToStorage();
    },

    toggleMarkingCommentPoints() {
      this.showMarkingCommentPoints = !this.showMarkingCommentPoints
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

    toggleLeftSummaryRevision() {
      this.showLeftSummaryRevision = !this.showLeftSummaryRevision
      this.saveToStorage()
    },

    toggleRightSummaryRevision() {
      this.showRightSummaryRevision = !this.showRightSummaryRevision
      this.saveToStorage()
    },

    toggleSnippetList() {
      this.showSnippetList = !this.showSnippetList;
      this.saveToStorage();
      if (this.showSnippetList) {
        this.setFocusChange('appSnippetList');
      }
    },

    selectCorrection(correction_key) {
      const apiStore = stores.api();
      const correctionsStore = stores.corrections();

      if (this.leftCorrectionKey == correction_key) {         // already selected
        this.showLeftCorrection();
      } else if (this.rightCorrectionKey == correction_key) { // already selected
        this.showRightCorrection();
      } else if (stores.corrections().ownKey) {               // user is corrector => other correctors should be left
        this.leftCorrectionKey = correction_key;
        this.showLeftCorrection();
      } else if (correctionsStore.countCorrections == 1) {    // admin view => show a single corrector on the right
        this.rightCorrectionKey = correction_key;
        this.showRightCorrection();
      } else if (this.leftCorrectionKey == '') {              // left is free
        this.leftCorrectionKey = correction_key;
        this.showLeftCorrection();
      } else if (this.rightCorrectionKey == '') {             // right is free
        this.rightCorrectionKey = correction_key;
        this.showRightCorrection();
      } else {                                                // replace on left
        this.leftCorrectionKey = correction_key;
        this.showLeftCorrection();
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


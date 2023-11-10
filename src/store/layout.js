import {defineStore} from 'pinia';
import localForage, { setItem } from "localforage";
import {useCorrectorsStore} from '@/store/correctors';
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

            leftCorrectorKey: '',               // key of the corrector shown on the left side
            rightCorrectorKey: '',              // key of the corrector shown on the right side

            markingPointsExpansion: 0.5,           // vertical expansion of the rating points in the marking view: 0=hidden, 0.5=half, 1=full
            markingTextExpansion: 0.0,             // vertical expansion of the summary text in the marking view: 0=hidden, 0.5=half, 1=full
            leftSummaryTextExpansion: 0.5,         // vertical expansion of the left summary text: 0=hidden, 0.5=half, 1=full
            rightSummaryTextExpansion: 0.5,        // vertical expansion of the right summary text: 0=hidden, 0.5=half, 1=full
        }
    },

    /**
     * Getter functions (with params) start with 'get', simple state queries not
     */
    getters: {
        isLeftVisible: state => state.expandedColumn != 'right',
        isRightVisible: state => state.expandedColumn != 'left',

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

        isMarkingPointsExpanded: state => state.markingPointsExpansion > 0,
        isMarkingTextExpanded: state => state.markingTextExpansion > 0,
        
        isLeftSummaryTextExpanded: state => state.leftSummaryTextExpansion > 0,
        isRightSummaryTextExpanded: state => state.rightSummaryTextExpansion > 0,

        leftCorrectorTitle: state => {
            const correctorsStore = useCorrectorsStore();
            const corrector = correctorsStore.getCorrector(state.leftCorrectorKey);
            return corrector ? 'Korrektur von ' + corrector.title  + ' ' + correctorsStore.getPositionText(corrector.corrector_key) : ''
        },

        rightCorrectorTitle: state => {
            const correctorsStore = useCorrectorsStore();
            const corrector = correctorsStore.getCorrector(state.rightCorrectorKey);
            return corrector ? 'Korrektur von ' + corrector.title + ' ' + correctorsStore.getPositionText(corrector.corrector_key) : ''
        },

        getCorrectorIsVisible: state => {

            /**
             * Get if a corrector's summary is visible
             * 
             * @param {string} corrector_key
             * @returns {boolean}
             */
            const fn = function(corrector_key) {
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
            } catch (err) {
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
                    // resources may not be ready, PDF is not shown instantly
                    // so show show the instructions as default left content
                    // this.leftContent = data.leftContent;
                    this.rightContent = data.rightContent;
                    this.markingPointsExpansion = data.markingPointsExpansion;
                    this.markingTextExpansion = data.markingTextExpansion;
                    this.leftSummaryTextExpansion = data.leftSummaryTextExpansion;
                    this.rightSummaryTextExpansion = data.rightSummaryTextExpansion;
                    this.showTimer = data.showTimer;
                }

            } catch (err) {
                console.log(err);
            }
        },

        async saveToStorage() {
            try {
                await storage.setItem('layout', {
                    expandedColumn: this.expandedColumn,
                    leftContent: this.leftContent,
                    rightContent: this.rightContent,
                    markingPointsExpansion: this.markingPointsExpansion,
                    markingTextExpansion: this.markingTextExpansion,
                    leftSummaryTextExpansion: this.leftSummaryTextExpansion,
                    rightSummaryTextExpansion: this.rightSummaryTextExpansion,
                    showTimer: this.showTimer
                })
            } catch (err) {
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
            this.saveToStorage();
        },

        showSummary() {
            this.setRightVisible();
            this.rightContent = 'summary';
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

        changeMarkingPointsExpansion() {
            this.markingPointsExpansion = this.changeExpansion(this.markingPointsExpansion);
            if (this.markingPointsExpansion > 0) {
                this.markingTextExpansion = 0;
            }
            this.saveToStorage();
        },
        
        changeMarkingTextExpansion() {
            this.markingTextExpansion = this.changeExpansion(this.markingTextExpansion);
            if (this.markingTextExpansion > 0) {
                this.markingPointsExpansion = 0;
            }
            this.saveToStorage();
        },
        
        syncMarkingTextExpansion() {
            this.markingTextExpansion = this.rightSummaryTextExpansion;
            if (this.markingTextExpansion > 0) {
                this.markingPointsExpansion = 0;
            }
            this.saveToStorage();
        },
        
        changeLeftSummaryTextExpansion() {
            this.leftSummaryTextExpansion = this.changeExpansion(this.leftSummaryTextExpansion);
            this.saveToStorage()
        },

        changeRightSummaryTextExpansion() {
            this.rightSummaryTextExpansion = this.changeExpansion(this.rightSummaryTextExpansion);
            this.saveToStorage();
        },

        changeExpansion(ratio) {
          switch (ratio) {
              case 0: return 0.5;
              case 1: return 0;
              default: return 1;
          }
        },

        
        selectCorrector(corrector_key) {
            const apiStore = useApiStore();
            const correctorsStore = useCorrectorsStore();
            
            if (this.leftCorrectorKey == corrector_key) {
                this.showLeftCorrector();
            }
            else if (this.rightCorrectorKey == corrector_key) {
                this.showRightCorrector();
            }
            else if (!apiStore.isForReviewOrStitch) {
                this.leftCorrectorKey = corrector_key;
                this.showLeftCorrector();
            }
            else if (correctorsStore.countCorrectors == 1) {
                this.rightCorrectorKey = corrector_key;
                this.showRightCorrector();
            }
            else if (this.leftCorrectorKey == '') {
                this.leftCorrectorKey = corrector_key;
                this.showLeftCorrector();
            }
            else if (this.rightCorrectorKey == '') {
                this.rightCorrectorKey = corrector_key;
                this.showRightCorrector();
            }
            else {
                this.leftCorrectorKey = corrector_key;
                this.showLeftCorrector();
            }
        }
    }
});

import {defineStore} from 'pinia';
import localForage, { setItem } from "localforage";
import {useCorrectorsStore} from '@/store/correctors';

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

            markingPointsExpanded: true,        // vertical expansion of the rating points
            leftSummaryTextExpanded: true,      // vertical expansion of the left summary text
            rightSummaryTextExpanded: true,     // vertical expansion of the right summary text

            showPlayground: false               // show the playground istead of the main content
        }
    },

    getters: {
        isLeftVisible: (state) => state.expandedColumn != 'right',
        isRightVisible: (state) => state.expandedColumn != 'left',

        isLeftExpanded: (state) => state.expandedColumn == 'left',
        isRightExpanded: (state) => state.expandedColumn == 'right',

        isInstructionsSelected: (state) => state.leftContent == 'instructions',
        isInstructionsPdfSelected: (state) => state.leftContent == 'instructionsPdf',
        isSolutionSelected: (state) => state.leftContent == 'solution',
        isSolutionPdfSelected: (state) => state.leftContent == 'solutionPdf',
        isResourcesSelected: (state) => state.leftContent == 'resources',
        isEssaySelected: (state) => state.leftContent == 'essay',
        isSummarySelected: (state) => state.rightContent == 'summary',
        isMarkingSelected: (state) => state.rightContent == 'marking',
        isLeftCorrectorSelected: (state) => state.leftContent == 'corrector',
        isRightCorrectorSelected: (state) => state.rightContent == 'corrector',

        isInstructionsVisible: (state) => (state.isInstructionsSelected && state.isLeftVisible),
        isInstructionsPdfVisible: (state) => (state.isInstructionsPdfSelected && state.isLeftVisible),
        isSolutionVisible: (state) => (state.isSolutionSelected && state.isLeftVisible),
        isSolutionPdfVisible: (state) => (state.isSolutionPdfSelected && state.isLeftVisible),
        isResourcesVisible: (state) => (state.isResourcesSelected && state.isLeftVisible),
        isEssayVisible: (state) => (state.isEssaySelected && state.isLeftVisible),
        isSummaryVisible: (state) => (state.isSummarySelected && state.isRightVisible),
        isMarkingVisible: (state) => (state.isMarkingSelected && state.isRightVisible),
        isLeftCorrectorVisible: (state) => (state.isLeftCorrectorSelected && state.isLeftVisible),
        isRightCorrectorVisible: (state) => (state.isRightCorrectorSelected && state.isRightVisible),

        isMarkingPointsExpanded: (state) => state.markingPointsExpanded,
        isLeftSummaryTextExpanded: (state) => state.leftSummaryTextExpanded,
        isRightSummaryTextExpanded: (state) => state.rightSummaryTextExpanded,

        isPlaygroundShown: (state) => (state.showPlayground),

        leftCorrectorTitle: (state) => {
            const correctorsStore = useCorrectorsStore();
            const corrector = correctorsStore.getCorrector(state.leftCorrectorKey);
            return corrector ? 'Korrektur von ' + corrector.title : ''
        },

        rightCorrectorTitle: (state) => {
            const correctorsStore = useCorrectorsStore();
            const corrector = correctorsStore.getCorrector(state.rightCorrectorKey);
            return corrector ? 'Korrektur von ' + corrector.title : ''
        },

        isCorrectorVisible(state) {
            return (corrector) =>
                state.leftCorrectorKey == corrector.key && state.isLeftCorrectorVisible
                || state.rightCorrectorKey == corrector.key && state.isRightCorrectorVisible
        },
    },

    actions: {

        async clearStorage() {
            try {
                await storage.clear();
            } catch (err) {
                console.log(err);
            }
        },

        async loadFromStorage() {
            try {
                const data = await storage.getItem('layout');

                if (data) {
                    this.expandedColumn = data.expandedColumn;
                    // resources may not be ready, PDF is not shown instantly
                    // so show show the instructions as default left content
                    // this.leftContent = data.leftContent;
                    this.rightContent = data.rightContent;
                    this.markingPointsExpanded = data.markingPointsExpanded;
                    this.leftSummaryTextExpanded = data.leftSummaryTextExpanded;
                    this.rightSummaryTextExpanded = data.rightSummaryTextExpanded;
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
                    markingPointsExpanded: this.markingPointsExpanded,
                    leftSummaryTextExpanded: this.leftSummaryTextExpanded,
                    rightSummaryTextExpanded: this.rightSummaryTextExpanded,
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

        setMarkingPointsExpanded(expanded) {
            this.markingPointsExpanded = !!expanded;
            this.saveToStorage();
        },

        setLeftSummaryTextExpanded(expanded) {
            this.leftSummaryTextExpanded = !!expanded;
            this.saveToStorage();
        },

        setRightSummaryTextExpanded(expanded) {
            this.rightSummaryTextExpanded = !!expanded;
            this.saveToStorage();
        },


        setLeftCorrector(corrector_key) {
            this.leftCorrectorKey = corrector_key;
            this.saveToStorage();
        },

        setRightCorrector(corrector_key) {
            this.leftCorrectorKey = corrector_key;
            this.saveToStorage();
        },


        selectCorrector(corrector_key) {
            if (this.leftCorrectorKey == corrector_key) {
                this.showLeftCorrector();
            }
            else if (this.rightCorrectorKey == corrector_key) {
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
        },


        togglePlayground() {
            this.showPlayground = !this.showPlayground;
        }
    }
});

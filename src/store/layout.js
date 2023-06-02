import {defineStore} from 'pinia';
import localForage from "localforage";
import {useApiStore} from "./api";

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
            expandedColumn: 'none',         // left|right|none
            leftContent: 'essay',           // instructions|resources|essay|correctors
            rightContent: 'marking',        // summary|marking
            pointsExpanded: true,           // vertical expansion of the rating points

            showPlayground: false           // show the playground istead of the main content
        }
    },

    getters: {
        isForReviewOrStitch(state) {
            const apiStore = useApiStore();
            return apiStore.isReview || apiStore.isStitchDecision;
        },

        isLeftExpanded: (state) => state.expandedColumn == 'left',
        isRightExpanded: (state) => state.expandedColumn == 'right',
        isPointsExpanded: (state) => state.pointsExpanded,

        isLeftVisible: (state) => state.expandedColumn != 'right',
        isRightVisible: (state) => state.expandedColumn != 'left',

        isInstructionsSelected: (state) => state.leftContent == 'instructions',
        isResourcesSelected: (state) => state.leftContent == 'resources',
        isCorrectorsSelected: (state) => {
            if (state.isForReviewOrStitch) {
                return state.rightContent == 'correctors'
            } else {
                return state.leftContent == 'correctors'
            }
        },
        isEssaySelected: (state) => state.leftContent == 'essay',
        isSummarySelected: (state) => state.rightContent == 'summary',
        isMarkingSelected: (state) => state.rightContent == 'marking',

        isInstructionsVisible: (state) => (state.expandedColumn != 'right' && state.leftContent == 'instructions'),
        isResourcesVisible: (state) => (state.expandedColumn != 'right' && state.leftContent == 'resources'),
        isCorrectorsVisible: (state) => {
            if (state.isForReviewOrStitch) {
                return (state.expandedColumn != 'left' && state.rightContent == 'correctors')
            } else {
                return (state.expandedColumn != 'right' && state.leftContent == 'correctors')
            }
        },
        isEssayVisible: (state) => (state.expandedColumn != 'right' && state.leftContent == 'essay'),
        isSummaryVisible: (state) => (state.expandedColumn != 'left' && state.rightContent == 'summary'),
        isMarkingVisible: (state) => (state.expandedColumn != 'left' && state.rightContent == 'marking'),

        isPlaygroundShown: (state) => (state.showPlayground)
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
                    // resources may not be ready PDF is not shown instantly
                    // so show show the instructions as default left content
                    // this.leftContent = data.leftContent;
                    this.rightContent = data.rightContent;
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

        showResources() {
            this.setLeftVisible();
            this.leftContent = 'resources';
            this.saveToStorage();
        },

        showCorrectors() {
            if (this.isForReviewOrStitch) {
                this.setRightVisible();
                this.rightContent = 'correctors';
            } else {
                this.setLeftVisible();
                this.leftContent = 'correctors';
            }
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

        setPointsExpanded(expanded) {
            this.pointsExpanded = !!expanded;
            this.saveToStorage();
        },

        togglePlayground() {
            this.showPlayground = !this.showPlayground;
        }
    }
});

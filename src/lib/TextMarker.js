/**
 * TextMarker class
 * inspired by https://github.com/shuowu/text-highlighter
 *
 *
 * This class expects single word being wrapped in elements like <w-p w="1" p="2">
 *  - attribute w gives the absolute number of the word
 *  - attribute p gives the absolute number of the parent paragraph
 *
 * @param {HTMLElement} element - DOM element to which marker will be applied.
 * @param {function} onSelection - Override callback when text is selected
 */
class TextMarker {

    /**
     * @type {IntersectionObserver}
     */
    observer = null;

    /**
     * Constructor - see class parameters
     */
    constructor(element, onSelection, onIntersection) {
        if (!element) {
            throw new Error('Missing anchor element');
        }
        this.el = element;

        if (onSelection instanceof Function) {
            this.onSelection = onSelection;
            this.el.addEventListener('mouseup', this.selectionHandler.bind(this));
            this.el.addEventListener('touchend', this.selectionHandler.bind(this));
        }

        if (onIntersection instanceof Function) {
            this.onIntersection = onIntersection;
            this.observer = new IntersectionObserver(this.intersectionHandler.bind(this), {
                root: this.el, threshold: [1] });
        }
    }

    /**
     * Callback when text is selected
     * This should be overridden by the onSelction parameter of the constructor
     * @param {object} [selected] -
     * @param {integer} selected.mouseX  - x position of the mouseup or touch event
     * @param {integer} selected.mouseY - y position of the mouseup or touch event
     * @param {integer} selected.firstWord - number of the first selected word
     * @param {integer} selected.lastWord  - number of the last selected word
     * @param {integer} selected.parentNumber - number of the paragraph with the first selected word
     * @param {boolean} selected.isCollapsed - only a point is clicked, not a text range selected
     */
    onSelection(selected) {}

    /**
     * Callback when marked text is moving into or out the scrolling window
     * @param {integer} firstWord - number of the first marked word that is visible
     * @param {integer} lastWord - number of the first marked word that is visible
     */
    onIntersection(firstWord, lastWord) {}


    /**
     * Handle a text selection
     * @param event
     */
    selectionHandler(event) {
        let data = this.getSelectionData();
        data.mouseX = event.clientX;
        data.mouseY = event.clientY;
        if (data.firstWord > 0 && data.lastWord > 0) {
            this.onSelection(data)
        }
    }

    /**
     * Handle the intersection observer
     * @param {array} entries
     */
    intersectionHandler(entries) {
        let first = 0;
        let last = 0;

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                let w = parseInt(entry.target.getAttribute('w'));
                if (first == 0 || w < first) {
                    first = w;
                }
                if (w > last) {
                    last = w
                }
            }
        });

        this.onIntersection(first, last);
    }


    /**
     * Removes a selection
     */
    removeSelection() {
        const selection = window.getSelection();
        selection.removeAllRanges();
    }


    /**
     * Get the selection data
     * @return {object}  - {firstWord: integer, lastWord: integer, parentNumber: integer, isCollapsed: bool}
     */
    getSelectionData() {

        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        if (!selection || !range) {
            return {};
        }
        // console.log(selection)
        // console.log(range);

        let ancestor = range.commonAncestorContainer;
        // part of a text node is selected - get parent of the surrounding w-p element
        if (ancestor.nodeType == 3) {
            ancestor = ancestor.parentNode.parentNode;
        }

        let first = 0;
        let last = 0;
        let parent = 0;
        ancestor.querySelectorAll('w-p').forEach(node => {
            if (selection.containsNode(node, true)) {
                let w = parseInt(node.getAttribute('w'));
                let p = parseInt(node.getAttribute('p'));
                if (first == 0 || w < first) {
                    first = w;
                    parent = p;
                }
                if (w > last) {
                    last = w
                }
            }
        })

        return {firstWord: first, lastWord: last, parentNumber: parent, isCollapsed: selection.isCollapsed};
    }

    /**
     * Add a label to the first wird of a mark
     * @param {string} cssClass
     * @param {string} label
     * @param {integer} firstWord
     */
    addLabel(cssClass, label, firstWord) {
        let node = this.el.querySelector('w-p[w="' + firstWord + '"]');
        if (node) {
            node.setAttribute('label', label);
            node.classList.add(cssClass);
        }
    }

    /**
     * Show a mark
     * @param {string} cssClass
     * @param {integer} firstWord
     * @param {integer} lastWord
     */
    showMark(cssClass, firstWord, lastWord) {
        this.el.querySelectorAll('w-p').forEach(node => {
            let w = parseInt(node.getAttribute('w'));
            if (w >= firstWord && w <= lastWord) {
                node.classList.add(cssClass);
            }
            if (this.observer && (w == firstWord || w == lastWord)) {
                this.observer.observe(node);
            }
        });
    }

    /**
     * Hide a mark
     * @param {string} cssClass
     * @param {integer} firstWord
     * @param {integer} lastWord
     */
    hideMark(cssClass, firstWord, lastWord) {
        this.el.querySelectorAll('w-p.' + cssClass).forEach(node => {
            let w = parseInt(node.getAttribute('w'));
            if (w >= firstWord && w <= lastWord) {
                node.classList.remove(cssClass);
            }
            if (this.observer && (w == firstWord || w == lastWord)) {
                this.observer.unobserve(node);
            }

        });
    }

    /**
     * Remoce the css classes from all marks and labels
     */
    hideAllMarksAndLabels() {
        this.el.querySelectorAll('w-p[class]').forEach(node => {
            node.classList.value = '';
        });
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    /**
     * Set the scripping so that the complete mark is visible
     * @param {integer} firstWord
     * @param {integer} lastWord
     */
    scrollToMark(firstWord, lastWord) {
        const firstNode = this.el.querySelector('w-p[w="' + firstWord + '"]');
        const lastNode = this.el.querySelector('w-p[w="' + lastWord + '"]');

        if (!firstNode || !lastNode) {
            return;
        }

        const containerRect = this.el.getBoundingClientRect();
        const firstRect = firstNode.getBoundingClientRect();
        const lastRect = lastNode.getBoundingClientRect();

        const firstVisible = (firstRect.top >= containerRect.top && firstRect.bottom <= containerRect.bottom);
        const lastVisible = (lastRect.top >= containerRect.top && lastRect.bottom <= containerRect.bottom);

        if (!firstVisible || !lastVisible) {
            firstNode.scrollIntoView();
        }
    }
}

export default TextMarker;


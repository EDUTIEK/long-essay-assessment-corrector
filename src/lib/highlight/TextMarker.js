import {addClass, removeClass, getSelection, getRange, removeAllRanges} from './dom';
import { defaults } from './utils';

/**
 * TextMarker class
 *
 * This class expects single word being wrapped in elements like <w-p w="1" p="2">
 *  - attribute w gives the absolute number of the word
 *  - attribute p gives the absolute number of the parent paragraph
 *
 *
 * @param {HTMLElement} element - DOM element to which marker will be applied.
 * @param {object} [options] - additional options.
 * @param {boolean} options.bindEvents - bind the mouseup and touchend events to the selectionHandler of this class
 * @param {function} options.onSelection - function called when text is selected.
 *      Called with {mouseX: integer, mouseY: integer, firstWord: integer, lastWord: integer, parentNumber: integer, isCollapsed: bool}
 */
class TextMarker {

  constructor(element, options) {
    if (!element) {
      throw new Error('Missing anchor element');
    }

    this.el = element;
    this.options = defaults(options, {
      bindEvents: true,
      onSelection() { return true; }
    });

    if (this.options.bindEvents) {
      this.bindEvents();
    }
  }

  bindEvents() {
    this.el.addEventListener('mouseup', this.selectionHandler.bind(this));
    this.el.addEventListener('touchend', this.selectionHandler.bind(this));
  }

  unbindEvents() {
    this.el.removeEventListener('mouseup', this.selectionHandler.bind(this));
    this.el.removeEventListener('touchend', this.selectionHandler.bind(this));
  }

  /**
   * Permanently disables highlighting.
   * Unbinds events and remove context element class.
   */
  destroy() {
    if (this.options.bindEvents) {
      this.unbindEvents();
    }
  }

  /**
   * Handle a text selection
   * @param event
   */
  selectionHandler(event)
  {
    let data = this.getSelectionData();
    data.mouseX = event.clientX;
    data.mouseY = event.clientY;
    if (data.firstWord > 0 && data.lastWord > 0) {
      this.options.onSelection(data)
    }
  }

    /**
     * Removes a selection
     */
  removeSelection()
  {
      removeAllRanges(this.el);
  }


  /**
   * Get the selection data
   * @return {object}  - {firstWord: integer, lastWord: integer, parentNumber: integer, isCollapsed: bool}
   */
  getSelectionData()
  {

    let selection = getSelection(this.el);
    let range = getRange(this.el);
    if (!selection || !range) {
      return {};
    }
    // console.log(selection)
    // console.log(range);

    let ancestor = range.commonAncestorContainer;
    // part of text node is selected - get parent of the surrounding w-p element
    if (ancestor.nodeType == 3) {
      ancestor = ancestor.parentNode.parentNode;
    }

    let first = 0;
    let last = 0;
    let parent = 0;
    ancestor.querySelectorAll('w-p').forEach(word => {
      if (selection.containsNode(word, true)) {
        let w = parseInt(word.getAttribute('w'));
        let p = parseInt(word.getAttribute('p'));
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

  showMark(cssClass, firstWord, lastWord)
  {
    this.el.querySelectorAll('w-p').forEach(word => {
      let w = parseInt(word.getAttribute('w'));
      if (w >= firstWord && w <= lastWord) {
        addClass(word, cssClass);
      }
    });
  }

  hideMark(cssClass, firstWord, lastWord)
  {
    this.el.querySelectorAll('w-p.' + cssClass).forEach(word => {
      let w = parseInt(word.getAttribute('w'));
      if (w >= firstWord && w <= lastWord) {
        removeClass(word, cssClass);
      }
    });
  }

  hideAllMarks(cssClass) {
    this.el.querySelectorAll('w-p.' + cssClass).forEach(word => {
      removeClass(word, cssClass);
    });
  }

  addLabel(label, firstWord) {
      let word = this.el.querySelector('w-p[w="' + firstWord + '"]');
      if (word) {
          word.setAttribute('label', label);
          addClass(word, 'labelled');
      }
  }

  removeAllLabels() {
      this.el.querySelectorAll('w-p.labelled').forEach(word => {
          word.removeAttribute('label');
          removeClass(word, 'labelled');
      });
  }

  scrollToWord(firstWord) {
      let word = this.el.querySelector('w-p[w="' + firstWord + '"]');
      if (word) {
          word.scrollIntoView();
      }
  }
}

export default TextMarker;

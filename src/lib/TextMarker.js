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
 * @param {function} onSelection - Callback when text is selected
 * @param {function} onIntersection - Callback when marked text is is moving into or out the scrolling window
 */
class TextMarker {

  /**
   * @type {IntersectionObserver}
   */
  observer = null;

  /**
   * Marked texts {cssClass: string, firstWord: integer, lastWord: integer}
   */
  marks = [];

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
      this.el.addEventListener('keydown', this.keydownHandler.bind(this));
    }

    if (onIntersection instanceof Function) {
      this.onIntersection = onIntersection;
      this.observer = new IntersectionObserver(this.intersectionHandler.bind(this), {
        root: this.el, threshold: [1]
      });
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
  onSelection(selected) {
  }

  /**
   * Callback when marked text is moving into or out the scrolling window
   * @param {integer} firstWord - number of the first marked word thet is visible
   */
  onIntersection(firstMarkedWord) {
  }


  /**
   * Handle a pressed key
   * @param event
   */
  keydownHandler(event)
  {
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        this.selectionHandler(event);
        break;
      case "Escape":
        event.preventDefault();
        this.removeSelection();
        break;
    }
  }

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
    this.marks.forEach(mark => {
      if ((first == 0 || mark.firstWord < first) && this.isMarkVisible(mark.firstWord,
        mark.lastWord)) {
        first = mark.firstWord;
      }
    });
    this.onIntersection(first);
  }


  /**
   * Removes a selection
   */
  removeSelection() {
    const selection = window.getSelection();
    selection.collapseToEnd();
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

    return {
      firstWord: first,
      lastWord: last,
      parentNumber: parent,
      isCollapsed: selection.isCollapsed
    };
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
   * Reserve the space for the labels as left margin of the labelled words
   * Must be called after all marks and labels are set, because showMark() overwrites the style of the words
   */
  reserveLabelSpace() {
    const nodes = Array.from(this.el.querySelectorAll('w-p.labelled'));
    const widths = nodes.map(node => {
      const style = getComputedStyle(node, '::before');
      return (parseFloat(style.width) || 0) + (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    });
    nodes.forEach((node, index) => {
      node.style.marginLeft = (widths[index] + 5) + 'px';
    });
  }

  /**
   * Show a mark
   * @param {string} cssClass  - css class to add to the mark
   * @param {integer} firstWord
   * @param {integer} lastWord
   */
  showMark(cssClass, cssText, firstWord, lastWord) {
    this.marks.push({ cssClass: cssClass, firstWord: firstWord, lastWord: lastWord });

    this.el.querySelectorAll('w-p').forEach(node => {
      let w = parseInt(node.getAttribute('w'));
      if (w >= firstWord && w <= lastWord) {
        node.classList.add(cssClass);
        node.style.cssText = cssText;
      }
      if (this.observer && (w == firstWord || w == lastWord)) {
        this.observer.observe(node);
      }
    });
  }

  /**
   * Hide a mark
   * @param {string} cssClass - css class to remove from the mark
   * @param {integer} firstWord
   * @param {integer} lastWord
   */
  hideMark(cssClass, firstWord, lastWord) {
    this.marks = this.marks.filter(mark => mark.cssClass != cssClass || mark.firstWord != firstWord || mark.lastWord != lastWord);

    this.el.querySelectorAll('w-p.' + cssClass).forEach(node => {
      let w = parseInt(node.getAttribute('w'));
      if (w >= firstWord && w <= lastWord) {
        node.classList.remove(cssClass);
        node.style.cssText = '';
      }
      if (this.observer && (w == firstWord || w == lastWord)) {
        this.observer.unobserve(node);
      }

    });
  }


  /**
   * Remove the css classes from all marks and labels
   */
  hideAllMarksAndLabels() {
    this.marks = [];

    this.el.querySelectorAll('w-p[class]').forEach(node => {
      node.classList.value = '';
      node.style.cssText = '';
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

    if (!this.isMarkVisible(firstWord, lastWord, true)) {
      const firstNode = this.el.querySelector('w-p[w="' + firstWord + '"]');
      if (firstNode) {
        firstNode.scrollIntoView();
      }
    }
  }

  /**
   * Set the caret to a mark
   * @param {integer} firstWord
   */

  setCaretToMark(firstWord) {
    // set to the text node within, so that getSelectionData will work afterwards
    const firstNode = this.el.querySelector('w-p[w="' + firstWord + '"]').childNodes[0];
    if (firstNode) {
      let range = document.createRange();
      let sel = window.getSelection();

      range.setStart(firstNode, 0);
      range.collapse(true);

      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  /**
   * Check if a mark is visible in the scrolling window
   * @param {integer} firstWord - number of the first marked word
   * @param {integer} lastWord - number of the last marled word
   * @param {boolean} full - check for full visibility (first Word and lastWord)
   * @return {boolean}
   */
  isMarkVisible(firstWord, lastWord, full) {
    const firstNode = this.el.querySelector('w-p[w="' + firstWord + '"]');
    const lastNode = this.el.querySelector('w-p[w="' + lastWord + '"]');

    if (!firstNode || !lastNode) {
      return false;
    }

    const containerRect = this.el.getBoundingClientRect();
    const firstRect = firstNode.getBoundingClientRect();
    const lastRect = lastNode.getBoundingClientRect();

    const firstVisible = (firstRect.top >= containerRect.top && firstRect.bottom <= containerRect.bottom);
    const lastVisible = (lastRect.top >= containerRect.top && lastRect.bottom <= containerRect.bottom);

    if (full) {
      return firstVisible && lastVisible;
    } else {
      return firstVisible || lastVisible;
    }
  }

  /**
   * Visual lines of a marked word range
   * @param {integer} start
   * @param {integer} end
   * @return {array}
   */
  visualLines(start, end) {
    if (!this.el) {
      return [];
    }
    const nodes = [];
    this.el.querySelectorAll('w-p').forEach(node => {
      const word = parseInt(node.getAttribute('w'), 10);
      if (word >= start && word <= end) {
        nodes.push({ word, rect: node.getBoundingClientRect() });
      }
    });

    const lines = [];
    for (const node of nodes) {
      const rect = node.rect;
      if (!rect.height && !rect.width) {
        continue;
      }
      const previous = lines[lines.length - 1];
      const threshold = Math.max(4, rect.height * 0.6);
      if (previous && Math.abs(rect.top - previous.top) <= threshold) {
        previous.end = node.word;
        previous.left = Math.min(previous.left, rect.left);
        previous.right = Math.max(previous.right, rect.right);
        previous.top = Math.min(previous.top, rect.top);
        previous.bottom = Math.max(previous.bottom, rect.bottom);
      } else {
        lines.push({
          start: node.word,
          end: node.word,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        });
      }
    }
    return lines;
  }

  /**
   * Words to wich a menu stays attached
   * The last line when the whole marking is on screen, otherwise the first line,
   * so the menu sits below the marking and does not jump while scrolling.
   * @param {integer} start
   * @param {integer} end
   * @return {{start: integer, end: integer}|null}
   */
  chooseMenuWords(start, end) {
    if (!this.el) {
      return null;
    }
    const lines = this.visualLines(start, end);
    if (!lines.length) {
      return null;
    }
    const essayRect = this.el.getBoundingClientRect();
    const last = lines[lines.length - 1];
    const lastFits = last.top >= essayRect.top && last.bottom <= essayRect.bottom;
    const line = lastFits ? last : lines[0];
    return { start: line.start, end: line.end };
  }

  /**
   * Bounding box of the marked words on the first visual line
   * @param {integer} start
   * @param {integer} end
   * @return {object|null}
   */
  firstLineRect(start, end) {
    const line = this.visualLines(start, end)[0];
    if (!line) {
      return null;
    }
    return {
      left: line.left,
      right: line.right,
      top: line.top,
      bottom: line.bottom,
      width: line.right - line.left,
    };
  }
}

export default TextMarker;


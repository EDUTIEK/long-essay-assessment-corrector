import Mark from '@/data/Mark';
import Item from "@/data/Item";
import Correction from "@/data/Correction";
import {stores} from "@/store";

/**
 * Correction Comment
 */
export default class Comment {

  static CLASS_SELECTED = 'xlas-comment-selected'
  static CLASS_CORRECTOR1 = 'xlas-corrector1';
  static CLASS_CORRECTOR2 = 'xlas-corrector2';
  static CLASS_CORRECTOR3 = 'xlas-corrector3';
  static CLASS_CORRECTORX = 'xlas-correctorX';

  static CORRECTOR_CSS_CLASSES = [Comment.CLASS_CORRECTOR1, Comment.CLASS_CORRECTOR2, Comment.CLASS_CORRECTOR3,  Comment.CLASS_CORRECTORX];

  static RATING_CARDINAL = 'cardinal';
  static RAITNG_EXCELLENT = 'excellent';

  static ALLOWED_RATING = [Comment.RATING_CARDINAL, Comment.RAITNG_EXCELLENT];

  static cssClassByCorrectionPosition(position) {
    switch(position) {
      case 0:
        return Comment.CLASS_CORRECTOR1;
      case 1:
        return Comment.CLASS_CORRECTOR2;
      case 2:
        return Comment.CLASS_CORRECTOR3;
      default:
        return Comment.CLASS_CORRECTORX;
    }
  }

  /**
   * Compare two comments for sorting
   * @param {Comment} comment1
   * @param {Comment} comment2
   */
  static order(comment1, comment2) {
    if (comment1.parent_number < comment2.parent_number) {
      return -1;
    } else if (comment1.parent_number > comment2.parent_number) {
      return 1;
    } else if (comment1.start_position < comment2.start_position) {
      return -1;
    } else if (comment1.start_position > comment2.start_position) {
      return 1;
    } else {
      return 0;
    }
  }

  static newKey(corrector_id) {
    return 'C' + corrector_id + '_' + Math.random().toString();
  }

  /**
   * Unique identifier of the comment
   * Will be auto-generated for a new comment
   * @type {string}
   */
  key = '';

  /**
   * Key of the correction item to which the comment belongs
   * @type {string}
   */
  item_key = '';

  /**
   * Key of the correction to which the comment belongs
   * @type {string}
   */
  correction_key = '';

  /**
   * Task to which this comment belongs
   * @type {integer}
   */
  task_id = null;

  /**
   * Writer to which this comment belongs
   * @type {integer}
   */
  writer_id = null;

  /**
   * Corrector to which this comment belongs
   * @type {integer}
   */
  corrector_id = null;

  /**
   * Text mark: Number of the first word from the marked text to which the comment belongs
   * Image mark: lowest y position of the marks on the page
   * @type {integer}
   */
  start_position = 0;

  /**
   * Text mark: Number of the last word fom the marked text to which the comment belongs
   * Image mark: ignored
   * @type {integer}
   */
  end_position = 0;

  /**
   * Text mark: Number of the parent paragraph of the first marked word
   * Image mark: Number of the page
   * @type {integer}
   */
  parent_number = 0;

  /**
   * Textual comment
   * @type {string}
   */
  comment = '';

  /**
   * Marked text is excellent
   * @type {bool}
   */
  rating_excellent = false;

  /**
   * Marked text has a cardinal failure
   * @type {bool}
   */
  rating_cardinal = false;

  /**
   * position of the correction to which this comment belongs
   * (not stored, dynamically assigned in sortAndLabelComments)
   * @type {string}
   */
  correction_position = null;

  /**
   * label that should be shown for the comment
   * (not stored, dynamically assigned in sortAndLabelComments)
   * @type {string}
   */
  label = '';

  /**
   * Marks in PDF file or graphical marks on PDF image assigned to the comment
   * @type {Mark[]}
   */
  marks = [];

  /**
   * Comment is deleted
   * @type {string}
   */
  deleted = false;


  /**
   * Constructor - gets properties from a data object
   * @param {object} data
   */
  constructor(data = {}) {

    if (data.key !== undefined && data.key !== null) {
      this.key = data.key.toString()
    }
    if (data.task_id !== undefined && data.task_id !== null) {
      this.task_id = parseInt(data.task_id);
    }
    if (data.task_id !== undefined && data.task_id !== null) {
      this.task_id = parseInt(data.task_id);
    }
    if (data.writer_id !== undefined && data.writer_id !== null) {
      this.writer_id = parseInt(data.writer_id);
    }
    if (data.corrector_id !== undefined && data.corrector_id !== null) {
      this.corrector_id = parseInt(data.corrector_id);
    }
    if (data.start_position !== undefined && data.start_position !== null) {
      this.start_position = parseInt(data.start_position);
    }
    if (data.end_position !== undefined && data.end_position !== null) {
      this.end_position = parseInt(data.end_position);
    }
    if (data.parent_number !== undefined && data.parent_number !== null) {
      this.parent_number = parseInt(data.parent_number);
    }
    if (data.comment !== undefined && data.comment !== null) {
      this.comment = data.comment.toString()
    }
    if (data.rating == Comment.RAITNG_EXCELLENT) {
      this.rating_excellent = true;
    } else if (data.rating == Comment.RATING_CARDINAL) {
      this.rating_cardinal = true;
    }
    if (data.marks !== undefined && Array.isArray(data.marks)) {
      for (const mark_data of data.marks) {
        this.addMarkData(mark_data);
      }
    }

    if (!this.key && this.corrector_id) {
      this.key = Comment.newKey(this.corrector_id);
    }
    if (!this.item_key && this.task_id && this.writer_id) {
      this.item_key = Item.buildKey(this.task_id, this.writer_id)
    }
    if (!this.correction_key && this.task_id && this.writer_id && this.corrector_id) {
      this.correction_key = Correction.buildKey(this.task_id, this.writer_id, this.corrector_id)
    }
  }

  /**
   * Get the CSS class for this comment
   * @returns {string}
   */
  getCssClass()
  {
      return Comment.cssClassByCorrectionPosition(this.correction_position);
  }

  /**
   * Set the correction key and change the ids accordingly
   * @param {string} correction_key
   */
  setCorrectionKey(correction_key) {
    this.correction_key = correction_key;
    this.task_id = Correction.extractTaskId(this.correction_key);
    this.writer_id = Correction.extractWriterId(this.correction_key);
    this.corrector_id = Correction.extractCorrectorId(this.correction_key);
    this.item_key = Item.buildKey(this.task_id, this.writer_id);
    this.key = Comment.newKey(this.corrector_id);
  }

  /**
   * Add a new mark by its data
   * @param {object} mark_data
   */
  addMarkData(mark_data) {
    this.marks.push(new Mark(mark_data));
    this.calculateStartPositon();
  }

  /**
   * Set the marks to a new mark
   * @param {object} mark_data
   */
  updateMarkData(mark_data) {
    for (const mark of this.marks) {
      if (mark.key == mark_data.key) {
        mark.setData(mark_data);
      }
    }
    this.calculateStartPositon();
  }

  /**
   * Get the alternative label and symbol for accessible PDF
   */
  getAltText() {
    for (const mark of this.marks) {
      if (mark.symbol) {
        return this.label + ' ' + Mark.symbolToText(mark.symbol);
      }
    }
    return this.label ?? '';
  }

  /**
   * Get the label with added mark symbol
   */
  getLabelWithSymbol() {
    for (const mark of this.marks) {
      if (mark.symbol) {
        return this.label + ' ' + Mark.symbolToLabel(mark.symbol);
      }
    }
    return this.label ?? '';
  }

  getLabelAndComment() {
    let text = this.label;
    for (const mark of this.marks) {
      if (mark.symbol) {
        text = text + ' ' + Mark.symbolToComment(mark.symbol);
        break;
      }
    }
    if (this.comment) {
      if (text) {
        text = text + '\n'
      }
      text = text + this.comment;
    }
    return text;
  }


  /**
   * Get the icon of the mark
   * @return string|null
   */
  getMarkIcon() {
    for (const mark of this.marks) {
      return mark.getIcon();
    }
    return null;
  }

  /**
   * Get a mark by its key
   * @param {string }key
   * @return {Mark|null}
   */
  getMarkByKey(key) {
    for (const mark of this.marks) {
      if (mark.key == key) {
        return mark;
      }
    }
    return null;
  }

  /**
   * Get the annotations for pdfjs from the marks
   */
  getPdfAnnotations() {
    const all = [];
    for (const mark of this.marks) {
      if (mark.internal) {

        all.push({
          id: mark.key,
          page: this.parent_number - 1,
          type: Mark.shapeToPdfAnnotationType(mark.shape),
          token: Mark.symbolToPdfAnnotationToken(mark.symbol),
          label: this.label,
          altText: this.getAltText(),
          intern: JSON.parse(mark.internal),
          color: stores.config().getCommentColor(this.correction_position, false, mark.isFilled())
        });
      }
    }
    return all;
  }


  /**
   * Calculate the start position as lowest y position of all marks.
   * Text comments keep the word index in start_position (end_position is set).
   */
  calculateStartPositon() {
    if (this.end_position > 0) {
      return;
    }
    let pos = null;
    for (const mark of this.marks) {
      if (pos === null || mark.pos.y < pos) {
        pos = mark.pos.y
      }
    }
    if (pos !== null) {
      this.start_position = pos;
    } else {
      this.start_position = 0;
    }
  }

  /**
   * Check if the comment has a mark with a given key
   * @param key
   * @return {boolean}
   */
  hasMarkKey(key) {
    for (const mark of this.marks) {
      if (mark.key == key) {
        return true;
      }
    }
    return false;
  }


  /**
   * Get a plain data object from the public properties
   */
  getData() {
    let marks = [];
    for (const mark of this.marks) {
      marks.push(mark.getData());
    }

    return {
      key: this.key,
      item_key: this.item_key,
      correction_key: this.correction_key,
      task_id: this.task_id,
      writer_id: this.writer_id,
      corrector_id: this.corrector_id,
      start_position: this.start_position,
      end_position: this.end_position,
      parent_number: this.parent_number,
      comment: this.comment,
      rating: this.rating_excellent ? Comment.RAITNG_EXCELLENT : (this.rating_cardinal ? Comment.RATING_CARDINAL : ''),
      marks: marks,
    }
  }

  /**
   * Get a clone of the comment
   */
  clone() {
    return new Comment(this.getData());
  }
}
